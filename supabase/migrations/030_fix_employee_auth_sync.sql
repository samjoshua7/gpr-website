-- ==============================================================================
-- Migration 030: Fix Employee Auth Sync, RLS Chicken-and-Egg & Email Normalization
-- ==============================================================================

-- 1. Normalize existing email fields in employees and users to lower-case and trimmed
UPDATE public.employees 
SET email = lower(trim(email)) 
WHERE email IS NOT NULL;

UPDATE public.users 
SET email = lower(trim(email)) 
WHERE email IS NOT NULL;

-- 2. Enhanced get_auth_role() helper with employee fallback
-- Resolves user's role from public.users, or falls back to public.employees by user_id or auth email
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text AS $$
    SELECT COALESCE(
        (SELECT role FROM public.users WHERE id = auth.uid()),
        (SELECT role FROM public.employees WHERE user_id = auth.uid() OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email')) LIMIT 1)
    );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 3. Fix RLS on public.employees to allow self-read by auth email or user_id
DROP POLICY IF EXISTS "Read access on employees" ON public.employees;
CREATE POLICY "Read access on employees" ON public.employees 
    FOR SELECT TO authenticated USING (
        (select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER')
        OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
        OR user_id = auth.uid()
    );

-- 4. Fix RLS on public.users to allow self-read by auth email or user_id
DROP POLICY IF EXISTS "Allow users to read own profile" ON public.users;
CREATE POLICY "Allow users to read own profile" ON public.users 
    FOR SELECT TO authenticated USING (
        id = auth.uid() 
        OR lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
        OR (select public.get_auth_role()) IN ('SUPER_ADMIN', 'STAKEHOLDER')
    );

-- 5. Trigger Function to sync employee updates into public.users case-insensitively
CREATE OR REPLACE FUNCTION public.sync_employee_to_user()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email IS NOT NULL AND trim(NEW.email) != '' THEN
        UPDATE public.users
        SET role = COALESCE(NEW.role, 'STAFF'),
            name = NEW.name,
            departments = COALESCE(NEW.departments, '{}'),
            active = NEW.active,
            updated_at = now()
        WHERE lower(trim(email)) = lower(trim(NEW.email));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atomic sync_user_profile() RPC
-- Called on login by AuthProvider to seamlessly provision/link employee to users table
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS jsonb AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_email text;
    v_emp record;
    v_user record;
BEGIN
    IF v_uid IS NULL THEN
        RETURN NULL;
    END IF;

    -- Get email from auth token or auth.users
    v_email := lower(trim(auth.jwt() ->> 'email'));
    IF v_email IS NULL OR v_email = '' THEN
        SELECT lower(trim(email)) INTO v_email FROM auth.users WHERE id = v_uid;
    END IF;

    IF v_email IS NULL OR v_email = '' THEN
        RETURN NULL;
    END IF;

    -- Check if there is an employee record with this email
    SELECT * INTO v_emp FROM public.employees 
    WHERE lower(trim(email)) = v_email
    LIMIT 1;

    IF v_emp IS NOT NULL THEN
        -- Upsert into public.users with employee details
        INSERT INTO public.users (id, role, name, email, departments, active, updated_at)
        VALUES (
            v_uid,
            COALESCE(v_emp.role, 'STAFF'),
            COALESCE(v_emp.name, split_part(v_email, '@', 1)),
            v_email,
            COALESCE(v_emp.departments, '{}'),
            COALESCE(v_emp.active, true),
            now()
        )
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            departments = EXCLUDED.departments,
            active = EXCLUDED.active,
            updated_at = now();

        -- Link employee record to this auth user
        UPDATE public.employees
        SET user_id = v_uid,
            updated_at = now()
        WHERE employee_id = v_emp.employee_id;

        -- Retrieve and return updated user profile
        SELECT * INTO v_user FROM public.users WHERE id = v_uid;
        RETURN to_jsonb(v_user);
    END IF;

    -- If not an employee, check if user profile exists (e.g. initial super admin / customer)
    SELECT * INTO v_user FROM public.users WHERE id = v_uid;
    IF v_user IS NOT NULL THEN
        RETURN to_jsonb(v_user);
    END IF;

    -- Neither employee nor existing user profile
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_user_profile() TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload';

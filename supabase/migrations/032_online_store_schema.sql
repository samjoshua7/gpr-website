-- ==============================================================================
-- Migration 032: Customer-Facing Online Storefront & E-Commerce Core
-- ==============================================================================

-- 1. Extend company_settings with default GST rate for online checkout
ALTER TABLE public.company_settings 
ADD COLUMN IF NOT EXISTS default_gst_rate numeric(5,2) NOT NULL DEFAULT 18.00;

-- Allow anon read on company_settings so public storefront can show contact & GST
DROP POLICY IF EXISTS "Anon read access on company_settings" ON public.company_settings;
CREATE POLICY "Anon read access on company_settings" ON public.company_settings
    FOR SELECT TO anon USING (true);


-- 2. Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    category_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    icon text,
    display_order int NOT NULL DEFAULT 0,
    parent_category_id uuid REFERENCES public.product_categories(category_id) ON DELETE SET NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    product_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id uuid REFERENCES public.product_categories(category_id) ON DELETE SET NULL,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    short_description text,
    description text,
    base_price numeric(12,2) NOT NULL CHECK (base_price >= 0),
    min_quantity int NOT NULL DEFAULT 100 CHECK (min_quantity > 0),
    main_image_url text,
    is_featured boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    display_order int NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Product Additional Gallery Images
CREATE TABLE IF NOT EXISTS public.product_images (
    image_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    image_url text NOT NULL,
    display_order int NOT NULL DEFAULT 0,
    alt_text text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Product Configurable Options (e.g. Size, Paper Type, Lamination)
CREATE TABLE IF NOT EXISTS public.product_options (
    option_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    name text NOT NULL,
    display_order int NOT NULL DEFAULT 0,
    is_required boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Product Option Values (e.g. A4, Gloss 300 GSM, Matte Lamination)
CREATE TABLE IF NOT EXISTS public.product_option_values (
    value_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    option_id uuid NOT NULL REFERENCES public.product_options(option_id) ON DELETE CASCADE,
    label text NOT NULL,
    price_adjustment numeric(12,2) NOT NULL DEFAULT 0.00,
    display_order int NOT NULL DEFAULT 0,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Product Quantity Pricing Tiers (Volume Discounts)
CREATE TABLE IF NOT EXISTS public.product_quantity_tiers (
    tier_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    min_quantity int NOT NULL CHECK (min_quantity > 0),
    max_quantity int CHECK (max_quantity IS NULL OR max_quantity >= min_quantity),
    price_per_unit numeric(12,2) NOT NULL CHECK (price_per_unit >= 0),
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Online Customers Table (Separate from internal ERP customer ledger)
CREATE TABLE IF NOT EXISTS public.online_customers (
    online_customer_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE REFERENCES public.users(id) ON DELETE SET NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company_name text,
    gstin text,
    billing_address text,
    city text,
    state text,
    pincode text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 9. Server-side Carts
CREATE TABLE IF NOT EXISTS public.carts (
    cart_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Cart Items
CREATE TABLE IF NOT EXISTS public.cart_items (
    cart_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id uuid NOT NULL REFERENCES public.carts(cart_id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    quantity int NOT NULL CHECK (quantity > 0),
    selected_options jsonb NOT NULL DEFAULT '{}',
    design_provision text NOT NULL DEFAULT 'self_supplied' CHECK (design_provision IN ('self_supplied', 'design_by_gpr')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. Online Orders Table
CREATE SEQUENCE IF NOT EXISTS online_order_number_seq START WITH 1001;

CREATE OR REPLACE FUNCTION public.generate_online_order_no()
RETURNS text AS $$
DECLARE
    next_val bigint;
BEGIN
    SELECT nextval('online_order_number_seq') INTO next_val;
    RETURN 'ORD-' || lpad(next_val::text, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.online_orders (
    order_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no text NOT NULL UNIQUE DEFAULT public.generate_online_order_no(),
    online_customer_id uuid REFERENCES public.online_customers(online_customer_id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'ready', 'completed', 'cancelled')),
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    gst_rate numeric(5,2) NOT NULL DEFAULT 18.00,
    gst_amount numeric(12,2) NOT NULL CHECK (gst_amount >= 0),
    grand_total numeric(12,2) NOT NULL CHECK (grand_total >= 0),
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text,
    customer_company text,
    customer_gstin text,
    billing_address text,
    city text,
    state text,
    pincode text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 12. Online Order Items Table (Immutable Snapshot)
CREATE TABLE IF NOT EXISTS public.online_order_items (
    order_item_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id uuid NOT NULL REFERENCES public.online_orders(order_id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(product_id) ON DELETE SET NULL,
    product_name text NOT NULL,
    product_image_url text,
    selected_options jsonb NOT NULL DEFAULT '{}',
    quantity int NOT NULL CHECK (quantity > 0),
    unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
    subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
    design_provision text NOT NULL DEFAULT 'self_supplied',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. Hero Banners Table
CREATE TABLE IF NOT EXISTS public.hero_banners (
    banner_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url text NOT NULL,
    title text,
    subtitle text,
    link_url text,
    display_order int NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 14. Indexes for Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_product_images_product ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON public.product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_product_option_values_option ON public.product_option_values(option_id);
CREATE INDEX IF NOT EXISTS idx_product_tiers_product ON public.product_quantity_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_user ON public.online_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_online_orders_status ON public.online_orders(status);
CREATE INDEX IF NOT EXISTS idx_online_order_items_order ON public.online_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_hero_banners_active ON public.hero_banners(is_active, display_order);

-- ==============================================================================
-- 15. Timestamp Trigger Helper
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER trg_product_categories_updated_at
BEFORE UPDATE ON public.product_categories
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_online_customers_updated_at ON public.online_customers;
CREATE TRIGGER trg_online_customers_updated_at
BEFORE UPDATE ON public.online_customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_cart_items_updated_at ON public.cart_items;
CREATE TRIGGER trg_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_online_orders_updated_at ON public.online_orders;
CREATE TRIGGER trg_online_orders_updated_at
BEFORE UPDATE ON public.online_orders
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hero_banners_updated_at ON public.hero_banners;
CREATE TRIGGER trg_hero_banners_updated_at
BEFORE UPDATE ON public.hero_banners
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 16. Supabase Storage Buckets for Products & Hero Banners
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('hero-banners', 'hero-banners', true)
ON CONFLICT (id) DO NOTHING;

-- Product images storage policies
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "SUPER_ADMIN manage product images" ON storage.objects;
CREATE POLICY "SUPER_ADMIN manage product images" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'product-images' AND public.get_auth_role() = 'SUPER_ADMIN'
  ) WITH CHECK (
    bucket_id = 'product-images' AND public.get_auth_role() = 'SUPER_ADMIN'
  );

-- Hero banners storage policies
DROP POLICY IF EXISTS "Public read hero banners" ON storage.objects;
CREATE POLICY "Public read hero banners" ON storage.objects
  FOR SELECT USING (bucket_id = 'hero-banners');

DROP POLICY IF EXISTS "SUPER_ADMIN manage hero banners" ON storage.objects;
CREATE POLICY "SUPER_ADMIN manage hero banners" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'hero-banners' AND public.get_auth_role() = 'SUPER_ADMIN'
  ) WITH CHECK (
    bucket_id = 'hero-banners' AND public.get_auth_role() = 'SUPER_ADMIN'
  );

-- ==============================================================================
-- 17. Auth Trigger & Sync Update (Self-Registration & Customer Support)
-- ==============================================================================

-- Update handle_new_user() to recognize customer vs internal employee
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_emp record;
    v_email text := lower(trim(NEW.email));
BEGIN
    -- Check if new user is an employee
    SELECT * INTO v_emp FROM public.employees 
    WHERE lower(trim(email)) = v_email 
    LIMIT 1;

    IF v_emp IS NOT NULL THEN
        -- Link as employee user
        INSERT INTO public.users (id, role, name, email, departments, active)
        VALUES (
            NEW.id,
            COALESCE(v_emp.role, 'STAFF'),
            COALESCE(v_emp.name, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1)),
            v_email,
            COALESCE(v_emp.departments, '{}'),
            COALESCE(v_emp.active, true)
        )
        ON CONFLICT (id) DO UPDATE
        SET role = EXCLUDED.role,
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            departments = EXCLUDED.departments,
            active = EXCLUDED.active,
            updated_at = now();

        UPDATE public.employees
        SET user_id = NEW.id,
            updated_at = now()
        WHERE employee_id = v_emp.employee_id;
    ELSE
        -- Self-registered customer: give CUSTOMER role and active=true immediately
        INSERT INTO public.users (id, role, name, email, departments, active)
        VALUES (
            NEW.id,
            'CUSTOMER',
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1)),
            v_email,
            '{}',
            true
        )
        ON CONFLICT (id) DO UPDATE
        SET email = EXCLUDED.email,
            updated_at = now();

        -- Also provision online_customers profile
        INSERT INTO public.online_customers (user_id, email, name)
        VALUES (
            NEW.id,
            v_email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(v_email, '@', 1))
        )
        ON CONFLICT (user_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update atomic sync_user_profile() RPC called by AuthProvider
CREATE OR REPLACE FUNCTION public.sync_user_profile()
RETURNS jsonb AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_email text;
    v_emp record;
    v_user record;
    v_name text;
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

    v_name := COALESCE(
        auth.jwt() -> 'user_metadata' ->> 'full_name',
        auth.jwt() -> 'user_metadata' ->> 'name',
        split_part(v_email, '@', 1)
    );

    -- 1. Check if there is an employee record with this email
    SELECT * INTO v_emp FROM public.employees 
    WHERE lower(trim(email)) = v_email
    LIMIT 1;

    IF v_emp IS NOT NULL THEN
        -- Upsert into public.users with employee details
        INSERT INTO public.users (id, role, name, email, departments, active, updated_at)
        VALUES (
            v_uid,
            COALESCE(v_emp.role, 'STAFF'),
            COALESCE(v_emp.name, v_name),
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

        SELECT * INTO v_user FROM public.users WHERE id = v_uid;
        RETURN to_jsonb(v_user);
    END IF;

    -- 2. Check if user profile already exists in public.users
    SELECT * INTO v_user FROM public.users WHERE id = v_uid;
    IF v_user IS NOT NULL THEN
        IF v_user.role = 'CUSTOMER' THEN
            -- Ensure online_customers record exists
            INSERT INTO public.online_customers (user_id, email, name)
            VALUES (v_uid, v_email, COALESCE(v_user.name, v_name))
            ON CONFLICT (user_id) DO NOTHING;
        END IF;
        RETURN to_jsonb(v_user);
    END IF;

    -- 3. Neither employee nor existing user profile: provision as active CUSTOMER
    INSERT INTO public.users (id, role, name, email, departments, active, updated_at)
    VALUES (
        v_uid,
        'CUSTOMER',
        v_name,
        v_email,
        '{}',
        true,
        now()
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();

    -- Ensure online_customers record exists
    INSERT INTO public.online_customers (user_id, email, name)
    VALUES (v_uid, v_email, v_name)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_user FROM public.users WHERE id = v_uid;
    RETURN to_jsonb(v_user);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.sync_user_profile() TO authenticated;

-- ==============================================================================
-- 18. Atomic Order Placement RPC Function (Guarantees DB-Calculated Totals)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.place_online_order(
    p_customer_name text,
    p_customer_email text,
    p_customer_phone text,
    p_customer_company text,
    p_customer_gstin text,
    p_billing_address text,
    p_city text,
    p_state text,
    p_pincode text,
    p_notes text,
    p_items jsonb -- Array of [{product_id, quantity, selected_options, design_provision}]
)
RETURNS jsonb AS $$
DECLARE
    v_uid uuid := auth.uid();
    v_cust_id uuid;
    v_order_id uuid;
    v_order_no text;
    v_item jsonb;
    v_product record;
    v_opt_key text;
    v_val_id text;
    v_opt_val record;
    v_tier record;
    v_item_unit_price numeric(12,2);
    v_item_subtotal numeric(12,2);
    v_total_subtotal numeric(12,2) := 0.00;
    v_gst_rate numeric(5,2) := 18.00;
    v_gst_amount numeric(12,2);
    v_grand_total numeric(12,2);
    v_resolved_options jsonb;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place an order.';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Cannot place an order with zero items.';
    END IF;

    -- Get or create online customer record
    SELECT online_customer_id INTO v_cust_id FROM public.online_customers WHERE user_id = v_uid LIMIT 1;
    IF v_cust_id IS NULL THEN
        INSERT INTO public.online_customers (
            user_id, name, email, phone, company_name, gstin, billing_address, city, state, pincode
        ) VALUES (
            v_uid, p_customer_name, lower(trim(p_customer_email)), p_customer_phone, p_customer_company, p_customer_gstin,
            p_billing_address, p_city, p_state, p_pincode
        ) RETURNING online_customer_id INTO v_cust_id;
    ELSE
        -- Update online customer address info with latest
        UPDATE public.online_customers
        SET name = p_customer_name,
            phone = COALESCE(p_customer_phone, phone),
            company_name = COALESCE(p_customer_company, company_name),
            gstin = COALESCE(p_customer_gstin, gstin),
            billing_address = COALESCE(p_billing_address, billing_address),
            city = COALESCE(p_city, city),
            state = COALESCE(p_state, state),
            pincode = COALESCE(p_pincode, pincode),
            updated_at = now()
        WHERE online_customer_id = v_cust_id;
    END IF;

    -- Get GST rate from company_settings
    SELECT COALESCE(default_gst_rate, 18.00) INTO v_gst_rate FROM public.company_settings LIMIT 1;
    IF v_gst_rate IS NULL THEN
        v_gst_rate := 18.00;
    END IF;

    -- Calculate order subtotal by validating against live product & option catalog
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_product FROM public.products 
        WHERE product_id = (v_item->>'product_id')::uuid AND is_active = true;

        IF v_product IS NULL THEN
            RAISE EXCEPTION 'Product with ID % not found or is inactive.', (v_item->>'product_id');
        END IF;

        IF (v_item->>'quantity')::int < v_product.min_quantity THEN
            RAISE EXCEPTION 'Quantity % is below minimum required % for product %.', 
                (v_item->>'quantity')::int, v_product.min_quantity, v_product.name;
        END IF;

        -- Check tier pricing first
        SELECT * INTO v_tier FROM public.product_quantity_tiers
        WHERE product_id = v_product.product_id
          AND (v_item->>'quantity')::int >= min_quantity
          AND (max_quantity IS NULL OR (v_item->>'quantity')::int <= max_quantity)
        ORDER BY min_quantity DESC LIMIT 1;

        IF v_tier IS NOT NULL THEN
            v_item_unit_price := v_tier.price_per_unit;
        ELSE
            v_item_unit_price := v_product.base_price;
        END IF;

        -- Add option price adjustments
        IF v_item->'selected_options' IS NOT NULL AND jsonb_typeof(v_item->'selected_options') = 'object' THEN
            FOR v_opt_key, v_val_id IN SELECT * FROM jsonb_each_text(v_item->'selected_options')
            LOOP
                SELECT * INTO v_opt_val FROM public.product_option_values 
                WHERE value_id = v_val_id::uuid;
                IF v_opt_val IS NOT NULL THEN
                    v_item_unit_price := v_item_unit_price + v_opt_val.price_adjustment;
                END IF;
            END LOOP;
        END IF;

        v_item_subtotal := round(v_item_unit_price * (v_item->>'quantity')::int, 2);
        v_total_subtotal := v_total_subtotal + v_item_subtotal;
    END LOOP;

    -- Compute GST & Grand Total
    v_gst_amount := round((v_total_subtotal * v_gst_rate) / 100.0, 2);
    v_grand_total := v_total_subtotal + v_gst_amount;

    -- Generate Order Number & Insert Master Order
    v_order_no := public.generate_online_order_no();

    INSERT INTO public.online_orders (
        order_no, online_customer_id, user_id, status, subtotal, gst_rate, gst_amount, grand_total,
        customer_name, customer_email, customer_phone, customer_company, customer_gstin,
        billing_address, city, state, pincode, notes
    ) VALUES (
        v_order_no, v_cust_id, v_uid, 'pending', v_total_subtotal, v_gst_rate, v_gst_amount, v_grand_total,
        p_customer_name, lower(trim(p_customer_email)), p_customer_phone, p_customer_company, p_customer_gstin,
        p_billing_address, p_city, p_state, p_pincode, p_notes
    ) RETURNING order_id INTO v_order_id;

    -- Insert Order Items Snapshot
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        SELECT * INTO v_product FROM public.products WHERE product_id = (v_item->>'product_id')::uuid;

        -- Tier check
        SELECT * INTO v_tier FROM public.product_quantity_tiers
        WHERE product_id = v_product.product_id
          AND (v_item->>'quantity')::int >= min_quantity
          AND (max_quantity IS NULL OR (v_item->>'quantity')::int <= max_quantity)
        ORDER BY min_quantity DESC LIMIT 1;

        IF v_tier IS NOT NULL THEN
            v_item_unit_price := v_tier.price_per_unit;
        ELSE
            v_item_unit_price := v_product.base_price;
        END IF;

        -- Option adjustments & human-readable label snapshot
        v_resolved_options := '{}'::jsonb;
        IF v_item->'selected_options' IS NOT NULL AND jsonb_typeof(v_item->'selected_options') = 'object' THEN
            FOR v_opt_key, v_val_id IN SELECT * FROM jsonb_each_text(v_item->'selected_options')
            LOOP
                SELECT pov.label, po.name INTO v_opt_val 
                FROM public.product_option_values pov
                JOIN public.product_options po ON po.option_id = pov.option_id
                WHERE pov.value_id = v_val_id::uuid;

                IF v_opt_val IS NOT NULL THEN
                    v_resolved_options := jsonb_set(v_resolved_options, ARRAY[v_opt_val.name], to_jsonb(v_opt_val.label));
                    -- Re-fetch price adjustment
                    SELECT price_adjustment INTO v_opt_val FROM public.product_option_values WHERE value_id = v_val_id::uuid;
                    v_item_unit_price := v_item_unit_price + v_opt_val.price_adjustment;
                END IF;
            END LOOP;
        END IF;

        v_item_subtotal := round(v_item_unit_price * (v_item->>'quantity')::int, 2);

        INSERT INTO public.online_order_items (
            order_id, product_id, product_name, product_image_url, selected_options,
            quantity, unit_price, subtotal, design_provision
        ) VALUES (
            v_order_id,
            v_product.product_id,
            v_product.name,
            v_product.main_image_url,
            v_resolved_options,
            (v_item->>'quantity')::int,
            v_item_unit_price,
            v_item_subtotal,
            COALESCE(v_item->>'design_provision', 'self_supplied')
        );
    END LOOP;

    -- Clear user's server-side cart if any
    DELETE FROM public.cart_items 
    WHERE cart_id IN (SELECT cart_id FROM public.carts WHERE user_id = v_uid);

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_no', v_order_no,
        'subtotal', v_total_subtotal,
        'gst_rate', v_gst_rate,
        'gst_amount', v_gst_amount,
        'grand_total', v_grand_total,
        'status', 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.place_online_order TO authenticated;

-- ==============================================================================
-- 19. Row Level Security Policies
-- ==============================================================================

-- Enable RLS on all new tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_option_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_quantity_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.online_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_banners ENABLE ROW LEVEL SECURITY;

-- Product Categories Policies
DROP POLICY IF EXISTS "Public read product_categories" ON public.product_categories;
CREATE POLICY "Public read product_categories" ON public.product_categories
    FOR SELECT USING (active = true OR public.get_auth_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD product_categories" ON public.product_categories;
CREATE POLICY "SUPER_ADMIN full CRUD product_categories" ON public.product_categories
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Products Policies
DROP POLICY IF EXISTS "Public read products" ON public.products;
CREATE POLICY "Public read products" ON public.products
    FOR SELECT USING (is_active = true OR public.get_auth_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD products" ON public.products;
CREATE POLICY "SUPER_ADMIN full CRUD products" ON public.products
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Product Images Policies
DROP POLICY IF EXISTS "Public read product_images" ON public.product_images;
CREATE POLICY "Public read product_images" ON public.product_images
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD product_images" ON public.product_images;
CREATE POLICY "SUPER_ADMIN full CRUD product_images" ON public.product_images
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Product Options Policies
DROP POLICY IF EXISTS "Public read product_options" ON public.product_options;
CREATE POLICY "Public read product_options" ON public.product_options
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD product_options" ON public.product_options;
CREATE POLICY "SUPER_ADMIN full CRUD product_options" ON public.product_options
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Product Option Values Policies
DROP POLICY IF EXISTS "Public read product_option_values" ON public.product_option_values;
CREATE POLICY "Public read product_option_values" ON public.product_option_values
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD product_option_values" ON public.product_option_values;
CREATE POLICY "SUPER_ADMIN full CRUD product_option_values" ON public.product_option_values
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Product Quantity Tiers Policies
DROP POLICY IF EXISTS "Public read product_quantity_tiers" ON public.product_quantity_tiers;
CREATE POLICY "Public read product_quantity_tiers" ON public.product_quantity_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD product_quantity_tiers" ON public.product_quantity_tiers;
CREATE POLICY "SUPER_ADMIN full CRUD product_quantity_tiers" ON public.product_quantity_tiers
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Hero Banners Policies
DROP POLICY IF EXISTS "Public read hero_banners" ON public.hero_banners;
CREATE POLICY "Public read hero_banners" ON public.hero_banners
    FOR SELECT USING (is_active = true OR public.get_auth_role() = 'SUPER_ADMIN');

DROP POLICY IF EXISTS "SUPER_ADMIN full CRUD hero_banners" ON public.hero_banners;
CREATE POLICY "SUPER_ADMIN full CRUD hero_banners" ON public.hero_banners
    FOR ALL TO authenticated USING (public.get_auth_role() = 'SUPER_ADMIN')
    WITH CHECK (public.get_auth_role() = 'SUPER_ADMIN');

-- Online Customers Policies
DROP POLICY IF EXISTS "Customer read own online_customers" ON public.online_customers;
CREATE POLICY "Customer read own online_customers" ON public.online_customers
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR public.get_auth_role() IN ('SUPER_ADMIN', 'ACCOUNTS')
    );

DROP POLICY IF EXISTS "Customer update own online_customers" ON public.online_customers;
CREATE POLICY "Customer update own online_customers" ON public.online_customers
    FOR UPDATE TO authenticated USING (
        user_id = auth.uid() OR public.get_auth_role() = 'SUPER_ADMIN'
    );

DROP POLICY IF EXISTS "Customer insert own online_customers" ON public.online_customers;
CREATE POLICY "Customer insert own online_customers" ON public.online_customers
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() OR public.get_auth_role() = 'SUPER_ADMIN'
    );

-- Carts Policies
DROP POLICY IF EXISTS "Customer full access own cart" ON public.carts;
CREATE POLICY "Customer full access own cart" ON public.carts
    FOR ALL TO authenticated USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Cart Items Policies
DROP POLICY IF EXISTS "Customer full access own cart items" ON public.cart_items;
CREATE POLICY "Customer full access own cart items" ON public.cart_items
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.carts 
            WHERE carts.cart_id = cart_items.cart_id AND carts.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.carts 
            WHERE carts.cart_id = cart_items.cart_id AND carts.user_id = auth.uid()
        )
    );

-- Online Orders Policies
DROP POLICY IF EXISTS "Read online_orders" ON public.online_orders;
CREATE POLICY "Read online_orders" ON public.online_orders
    FOR SELECT TO authenticated USING (
        user_id = auth.uid() OR public.get_auth_role() IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER')
    );

DROP POLICY IF EXISTS "Customer insert own online_orders" ON public.online_orders;
CREATE POLICY "Customer insert own online_orders" ON public.online_orders
    FOR INSERT TO authenticated WITH CHECK (
        user_id = auth.uid() OR public.get_auth_role() = 'SUPER_ADMIN'
    );

DROP POLICY IF EXISTS "Admin manage online_orders" ON public.online_orders;
CREATE POLICY "Admin manage online_orders" ON public.online_orders
    FOR UPDATE TO authenticated USING (
        public.get_auth_role() IN ('SUPER_ADMIN', 'ACCOUNTS')
    ) WITH CHECK (
        public.get_auth_role() IN ('SUPER_ADMIN', 'ACCOUNTS')
    );

-- Online Order Items Policies
DROP POLICY IF EXISTS "Read online_order_items" ON public.online_order_items;
CREATE POLICY "Read online_order_items" ON public.online_order_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.online_orders 
            WHERE online_orders.order_id = online_order_items.order_id 
              AND (online_orders.user_id = auth.uid() OR public.get_auth_role() IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'))
        )
    );

DROP POLICY IF EXISTS "Insert online_order_items" ON public.online_order_items;
CREATE POLICY "Insert online_order_items" ON public.online_order_items
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.online_orders 
            WHERE online_orders.order_id = online_order_items.order_id 
              AND (online_orders.user_id = auth.uid() OR public.get_auth_role() = 'SUPER_ADMIN')
        )
    );

-- ==============================================================================
-- 20. Seed Initial Categories, Sample Products, Options & Tiers
-- ==============================================================================

DO $$
DECLARE
    v_cat_visiting uuid;
    v_cat_wedding uuid;
    v_cat_flex uuid;
    v_cat_books uuid;
    v_cat_cert uuid;
    v_cat_posters uuid;
    v_cat_flyers uuid;
    v_cat_stationery uuid;

    v_prod_vc uuid;
    v_prod_lh uuid;
    v_prod_flex uuid;
    v_prod_env uuid;

    v_opt_vc_paper uuid;
    v_opt_vc_finish uuid;
    v_opt_vc_corner uuid;

    v_opt_lh_paper uuid;
    v_opt_flex_media uuid;
    v_opt_env_size uuid;
BEGIN
    -- Insert Product Categories
    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Visiting Cards', 'visiting-cards', 'Matte & Gloss Finish Business Cards', '📇', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_visiting;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Wedding Printing', 'wedding-printing', 'Premium Wedding Cards & Foil Invites', '💌', 2)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_wedding;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Flex Banner', 'flex-banner', 'High-res outdoor star flex banners', '🖼️', 3)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_flex;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Office Stationery', 'office-stationery', 'Custom Letterheads & Security Envelopes', '✒️', 4)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_stationery;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Pamphlets & Flyers', 'pamphlets-flyers', 'Marketing brochures & tri-fold flyers', '📄', 5)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_flyers;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Notices & Posters', 'notices-posters', 'Vibrant promotional poster sheets', '📢', 6)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_posters;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Books & Catalogs', 'books-catalogs', 'Hardcover & perfect binding prints', '📚', 7)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_books;

    INSERT INTO public.product_categories (name, slug, description, icon, display_order)
    VALUES 
        ('Certificates', 'certificates', 'Gold foil credentials & certificates', '🎓', 8)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon
    RETURNING category_id INTO v_cat_cert;

    -- 1. Product: Premium Visiting Cards
    INSERT INTO public.products (
        category_id, name, slug, short_description, description, base_price, min_quantity,
        main_image_url, is_featured, display_order
    ) VALUES (
        v_cat_visiting,
        'Premium Visiting Cards',
        'premium-visiting-cards',
        '350 GSM high density card with rich offset printing & tactile finishes.',
        'High-grade business cards tailored for executives, entrepreneurs, and professional brands. Printed using high-resolution Japanese offset printing technology on premium art board with sharp typography and color accuracy.',
        250.00,
        100,
        'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&auto=format&fit=crop&q=80',
        true,
        1
    ) ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price
    RETURNING product_id INTO v_prod_vc;

    -- Options for Visiting Cards
    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_vc, 'Paper Weight', 1, true)
    RETURNING option_id INTO v_opt_vc_paper;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_vc_paper, '300 GSM Art Card', 0.00, 1, false),
        (v_opt_vc_paper, '350 GSM Premium Card', 50.00, 2, true),
        (v_opt_vc_paper, '400 GSM Heavy Ivory Card', 100.00, 3, false);

    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_vc, 'Lamination Finish', 2, true)
    RETURNING option_id INTO v_opt_vc_finish;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_vc_finish, 'Gloss Lamination', 0.00, 1, false),
        (v_opt_vc_finish, 'Velvet Matte Lamination', 40.00, 2, true),
        (v_opt_vc_finish, 'Non-Tearable Frosted PVC', 120.00, 3, false);

    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_vc, 'Corners', 3, false)
    RETURNING option_id INTO v_opt_vc_corner;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_vc_corner, 'Standard Square Corners', 0.00, 1, true),
        (v_opt_vc_corner, 'Rounded Corners (Die Cut)', 30.00, 2, false);

    -- Quantity Tiers for Visiting Cards
    INSERT INTO public.product_quantity_tiers (product_id, min_quantity, max_quantity, price_per_unit)
    VALUES 
        (v_prod_vc, 100, 499, 2.50),
        (v_prod_vc, 500, 999, 1.80),
        (v_prod_vc, 1000, NULL, 1.30);

    -- 2. Product: Executive Letterhead Pads
    INSERT INTO public.products (
        category_id, name, slug, short_description, description, base_price, min_quantity,
        main_image_url, is_featured, display_order
    ) VALUES (
        v_cat_stationery,
        'Executive Letterhead Pads',
        'executive-letterhead-pads',
        'Executive 100 GSM sunshine bond paper with custom corporate branding.',
        'High-quality bond paper that feeds smoothly through all standard office laser and inkjet printers without ink bleeding. Precision edge cutting and glued pads of 100 sheets each.',
        350.00,
        100,
        'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=800&auto=format&fit=crop&q=80',
        true,
        2
    ) ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price
    RETURNING product_id INTO v_prod_lh;

    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_lh, 'Paper Grade', 1, true)
    RETURNING option_id INTO v_opt_lh_paper;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_lh_paper, '100 GSM Bond Paper', 0.00, 1, true),
        (v_opt_lh_paper, '120 GSM Royal Executive Bond', 80.00, 2, false);

    INSERT INTO public.product_quantity_tiers (product_id, min_quantity, max_quantity, price_per_unit)
    VALUES 
        (v_prod_lh, 100, 499, 3.50),
        (v_prod_lh, 500, 999, 2.80),
        (v_prod_lh, 1000, NULL, 2.20);

    -- 3. Product: Outdoor Flex Banners
    INSERT INTO public.products (
        category_id, name, slug, short_description, description, base_price, min_quantity,
        main_image_url, is_featured, display_order
    ) VALUES (
        v_cat_flex,
        'Outdoor Flex Banners',
        'outdoor-flex-banners',
        'Weather-proof, UV-resistant high-res star flex banners for events and promotions.',
        'Heavy-duty solvent printed outdoor banners capable of withstanding rain and intense sunlight. Includes corner brass eyelets and hemmed borders for simple and secure mounting.',
        450.00,
        1,
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80',
        true,
        3
    ) ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price
    RETURNING product_id INTO v_prod_flex;

    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_flex, 'Flex Type', 1, true)
    RETURNING option_id INTO v_opt_flex_media;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_flex_media, 'Normal Flex (260 GSM)', 0.00, 1, false),
        (v_opt_flex_media, 'Star Blackout Flex (340 GSM)', 150.00, 2, true),
        (v_opt_flex_media, 'Backlit Glow Sign Media', 250.00, 3, false);

    -- 4. Product: Corporate Security Envelopes
    INSERT INTO public.products (
        category_id, name, slug, short_description, description, base_price, min_quantity,
        main_image_url, is_featured, display_order
    ) VALUES (
        v_cat_stationery,
        'Corporate Security Envelopes',
        'corporate-security-envelopes',
        'Custom printed window and non-window executive envelopes with peel & seal.',
        'High-grade executive mailing envelopes featuring tamper-evident adhesive strips and interior security tint patterns to protect confidential letters, statements, and invoices.',
        300.00,
        100,
        'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=800&auto=format&fit=crop&q=80',
        true,
        4
    ) ON CONFLICT (slug) DO UPDATE SET base_price = EXCLUDED.base_price
    RETURNING product_id INTO v_prod_env;

    INSERT INTO public.product_options (product_id, name, display_order, is_required)
    VALUES (v_prod_env, 'Envelope Size', 1, true)
    RETURNING option_id INTO v_opt_env_size;

    INSERT INTO public.product_option_values (option_id, label, price_adjustment, display_order, is_default)
    VALUES 
        (v_opt_env_size, '9.5 x 4.25 in (Standard Commercial)', 0.00, 1, true),
        (v_opt_env_size, 'A4 Document Size (10 x 12 in)', 120.00, 2, false);

    INSERT INTO public.product_quantity_tiers (product_id, min_quantity, max_quantity, price_per_unit)
    VALUES 
        (v_prod_env, 100, 499, 3.00),
        (v_prod_env, 500, 999, 2.40),
        (v_prod_env, 1000, NULL, 1.90);

    -- Seed Hero Banners
    INSERT INTO public.hero_banners (image_url, title, subtitle, link_url, display_order, is_active)
    VALUES 
        (
            'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&auto=format&fit=crop&q=85',
            'High-Precision Commercial Offset Printing',
            'Premium Business Cards, Catalogs, Flex Banners & Wedding Invites Crafted with Master Precision',
            '/products',
            1,
            true
        ),
        (
            'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=1600&auto=format&fit=crop&q=85',
            'Instant Online Ordering & Live Customization',
            'Pick your paper, finish, and quantities — transparent pricing with guaranteed factory-grade turnaround',
            '/products',
            2,
            true
        );

END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload';

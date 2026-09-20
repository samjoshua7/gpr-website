-- Migration 033: Hero Banners CMS Enhancement
-- Enhances public.hero_banners to support flexible admin-managed promotion banners,
-- image-only vs image+text modes, eyebrow text, text alignment/position, and dual action buttons.

DO $$
BEGIN
    -- 1. Internal reference name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'banner_name') THEN
        ALTER TABLE public.hero_banners ADD COLUMN banner_name text;
    END IF;

    -- 2. Mobile-optimized image
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'mobile_image_url') THEN
        ALTER TABLE public.hero_banners ADD COLUMN mobile_image_url text;
    END IF;

    -- 3. Accessibility alt text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'alt_text') THEN
        ALTER TABLE public.hero_banners ADD COLUMN alt_text text;
    END IF;

    -- 4. Scheduled visibility dates
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'start_date') THEN
        ALTER TABLE public.hero_banners ADD COLUMN start_date timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'end_date') THEN
        ALTER TABLE public.hero_banners ADD COLUMN end_date timestamptz;
    END IF;

    -- 5. Banner type: image_only vs image_text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'banner_type') THEN
        ALTER TABLE public.hero_banners ADD COLUMN banner_type text NOT NULL DEFAULT 'image_text';
        ALTER TABLE public.hero_banners ADD CONSTRAINT chk_hero_banners_type CHECK (banner_type IN ('image_only', 'image_text'));
    END IF;

    -- 6. Eyebrow / Overline text
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'eyebrow') THEN
        ALTER TABLE public.hero_banners ADD COLUMN eyebrow text;
    END IF;

    -- 7. Text alignment & placement
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'text_align') THEN
        ALTER TABLE public.hero_banners ADD COLUMN text_align text NOT NULL DEFAULT 'left';
        ALTER TABLE public.hero_banners ADD CONSTRAINT chk_hero_banners_text_align CHECK (text_align IN ('left', 'center', 'right'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'text_position') THEN
        ALTER TABLE public.hero_banners ADD COLUMN text_position text NOT NULL DEFAULT 'center-left';
        ALTER TABLE public.hero_banners ADD CONSTRAINT chk_hero_banners_text_position CHECK (text_position IN ('center-left', 'center', 'center-right', 'bottom-left', 'bottom-center'));
    END IF;

    -- 8. Action Button 1 (Primary)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn1_label') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn1_label text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn1_action_type') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn1_action_type text DEFAULT 'catalog';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn1_url') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn1_url text;
    END IF;

    -- 9. Action Button 2 (Secondary)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn2_label') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn2_label text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn2_action_type') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn2_action_type text DEFAULT 'none';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'hero_banners' AND column_name = 'btn2_url') THEN
        ALTER TABLE public.hero_banners ADD COLUMN btn2_url text;
    END IF;
END $$;

-- Update existing seeded rows with sensible defaults if banner_name is NULL
UPDATE public.hero_banners
SET 
    banner_name = COALESCE(banner_name, title, 'Promotional Banner'),
    eyebrow = COALESCE(eyebrow, 'Factory Direct Printing • Tirunelveli'),
    btn1_label = COALESCE(btn1_label, 'Explore Catalog'),
    btn1_action_type = COALESCE(btn1_action_type, 'catalog'),
    btn1_url = COALESCE(btn1_url, link_url, '/products'),
    btn2_label = COALESCE(btn2_label, 'Visiting Cards'),
    btn2_action_type = COALESCE(btn2_action_type, 'category'),
    btn2_url = COALESCE(btn2_url, '/products?category=visiting-cards')
WHERE banner_name IS NULL;

-- Reload schema cache
NOTIFY pgrst, 'reload';

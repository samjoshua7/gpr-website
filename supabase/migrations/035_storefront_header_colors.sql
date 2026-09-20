-- Migration 035: Configurable Storefront Header Colors
-- Public storefront users may read these values through the existing
-- company_settings SELECT policies; only SUPER_ADMIN may update them.

ALTER TABLE public.company_settings
  ADD COLUMN IF NOT EXISTS storefront_nav_background_color text
    NOT NULL DEFAULT '#8A6424',
  ADD COLUMN IF NOT EXISTS storefront_nav_text_color text
    NOT NULL DEFAULT '#FFFFFF';

ALTER TABLE public.company_settings
  DROP CONSTRAINT IF EXISTS company_settings_storefront_nav_background_color_hex,
  DROP CONSTRAINT IF EXISTS company_settings_storefront_nav_text_color_hex;

ALTER TABLE public.company_settings
  ADD CONSTRAINT company_settings_storefront_nav_background_color_hex
    CHECK (storefront_nav_background_color ~ '^#[0-9A-Fa-f]{6}$'),
  ADD CONSTRAINT company_settings_storefront_nav_text_color_hex
    CHECK (storefront_nav_text_color ~ '^#[0-9A-Fa-f]{6}$');

NOTIFY pgrst, 'reload';

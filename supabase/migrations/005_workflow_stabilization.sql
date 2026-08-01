-- Workflow Stabilization: Tax Master, Product Master Seeds, and Schema Auditing

-- ==========================================
-- 1. CREATE TAX MASTER TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.tax_rates (
    tax_rate_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_name text NOT NULL UNIQUE,
    percentage numeric(5,2) NOT NULL CHECK (percentage >= 0),
    hsn_code text,
    description text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tax_rates ENABLE ROW LEVEL SECURITY;

-- Policy (SUPER_ADMIN and STAFF full CRUD)
CREATE POLICY "SUPER_ADMIN & STAFF full access on tax_rates" ON public.tax_rates
    FOR ALL TO authenticated USING (get_auth_role() IN ('SUPER_ADMIN', 'STAFF'));

-- Register updated_at trigger
CREATE TRIGGER trigger_update_timestamp_tax_rates
BEFORE UPDATE ON public.tax_rates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- ==========================================
-- 2. ALTER ITEMS (PRODUCT CATALOG)
-- ==========================================
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS tax_rate_id uuid REFERENCES public.tax_rates(tax_rate_id) ON DELETE SET NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS hsn_code text;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Remove deprecated column default_gst_rate if it exists (we keep it for safety, but mark it unused)
-- ALTER TABLE public.items DROP COLUMN IF EXISTS default_gst_rate;

-- ==========================================
-- 3. AUDIT SALES INVOICE LINE ITEMS
-- ==========================================
-- Force creation of columns in case cache/migration was interrupted
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS item_id uuid REFERENCES public.items(item_id) ON DELETE RESTRICT;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS discount_amount numeric(12,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS gst_rate numeric(5,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS tax_amount numeric(12,2) DEFAULT 0.00;
ALTER TABLE public.sales_invoice_items ADD COLUMN IF NOT EXISTS hsn_code text;

-- ==========================================
-- 4. INSERT SEED DATA
-- ==========================================
-- Tax Rates Seeds
INSERT INTO public.tax_rates (tax_name, percentage, hsn_code, description) VALUES
('GST 0%', 0.00, '4901', 'Tax Exempt Books/Pamphlets'),
('GST 5%', 5.00, '4901', 'Pamphlets/Newspapers'),
('GST 12%', 12.00, '4903', 'Children Drawing Books/Notices'),
('GST 18%', 18.00, '4911', 'Standard Printing Services (Cards, Brochures, Flex Banner)'),
('GST 28%', 28.00, '4911-S', 'Special Prints')
ON CONFLICT (tax_name) DO UPDATE 
SET percentage = EXCLUDED.percentage, hsn_code = EXCLUDED.hsn_code, description = EXCLUDED.description;

-- Product Catalog Seeds
INSERT INTO public.items (name, unit, unit_price, hsn_code, active, tax_rate_id) VALUES
('Visiting Card', 'box', 250.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Notice', 'sheet', 2.50, '4903', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 12%')),
('Pamphlet', 'sheet', 1.50, '4901', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 5%')),
('Book', 'pcs', 120.00, '4901', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 0%')),
('Bill Book', 'book', 90.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Letterhead', 'pad', 350.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Envelope', 'pcs', 3.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Sticker', 'sheet', 8.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Flex Banner', 'sqft', 45.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Invitation', 'pcs', 15.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('ID Card', 'pcs', 80.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Certificate', 'pcs', 12.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Brochure', 'pcs', 25.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%')),
('Receipt Book', 'book', 80.00, '4911', true, (SELECT tax_rate_id FROM public.tax_rates WHERE tax_name = 'GST 18%'))
ON CONFLICT (name) DO UPDATE 
SET unit = EXCLUDED.unit, 
    unit_price = EXCLUDED.unit_price, 
    hsn_code = EXCLUDED.hsn_code, 
    active = EXCLUDED.active, 
    tax_rate_id = EXCLUDED.tax_rate_id;

-- ==========================================
-- 5. RELOAD SCHEMA CACHE
-- ==========================================
NOTIFY pgrst, 'reload';

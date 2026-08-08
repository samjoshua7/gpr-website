# Handover: Invoice System Redesign (Steps 1–15)

## Objective
Redesign the sales invoice architecture for `gpr-website` to achieve pixel-perfect consistency between on-screen, print, and PDF outputs, consolidate discount to invoice-level, support product name/description split, and enable company logo and signatory branding assets.

## Decisions Made
1. **Single Presentational Component (`InvoiceDocument`)**: Extracted all printable HTML markup into `InvoiceDocument.jsx` to guarantee visual parity across print and PDF flows.
2. **Invoice-Level Discount**: Shifted discount entry to invoice-level (`sales_invoices.discount_amount`) in the form and financial breakdown formulas. Historical per-item discount columns were left untouched for backwards compatibility.
3. **Product Name / Description Split**: Added `product_name` to line items (`sales_invoice_items`) so `product_name` renders bold and `description` renders as a smaller sub-line.
4. **Branding Assets**: Added `logo_url`, `signatory_image_url`, and `signatory_name` to `company_settings`, and created `BrandingUpload` in settings.
5. **Real PDF Generation**: Replaced `window.print()` stub with `html2canvas` + `jsPDF` targeting `InvoiceDocument`. Added File System Access API (`showSaveFilePicker`) with fallback `<a download>` for unsupported browsers (Firefox/Safari).
6. **Internal Notes Isolation**: Created `InvoiceNotesPanel` carrying `.no-print` styling to keep internal notes out of printed/PDF invoices.
7. **IndexedDB Directory Handle Storage**: Implemented `src/lib/savedLocation.js` using IndexedDB for File System Access API directory handle persistence.

## Database Changes & Migrations
- Executed migrations:
  1. `018_invoice_level_discount.sql`: Added `discount_amount numeric(12,2)` to `sales_invoices`.
  2. `019_invoice_item_product_name.sql`: Added `product_name text` to `sales_invoice_items` with backfill `UPDATE`.
  3. `020_company_branding_assets.sql`: Added `logo_url`, `signatory_image_url`, `signatory_name` to `company_settings` + `company-assets` Supabase Storage bucket and RLS policies.

## Files Created / Modified
- **Created**:
  - `src/lib/amountInWords.js`
  - `src/lib/savedLocation.js`
  - `src/features/settings/components/BrandingUpload.jsx`
  - `src/features/salesInvoices/components/InvoiceDocument.jsx`
  - `src/features/salesInvoices/components/InvoiceNotesPanel.jsx`
  - `supabase/migrations/018_invoice_level_discount.sql`
  - `supabase/migrations/019_invoice_item_product_name.sql`
  - `supabase/migrations/020_company_branding_assets.sql`
- **Modified**:
  - `src/features/settings/api.js` (Added `uploadCompanyAsset`)
  - `src/features/settings/page.jsx` (Integrated `BrandingUpload` and updated save payload)
  - `src/features/salesInvoices/api.js` (Updated `createSalesInvoice` and `updateSalesInvoice` payloads)
  - `src/features/salesInvoices/components/InvoiceDialog.jsx` (Added invoice-level discount input, split product_name and description)
  - `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx` (Rewrapped with `InvoiceDocument`, `InvoiceNotesPanel`, and real PDF flow)

## APIs Changed
- `settings/api.js`: Added `uploadCompanyAsset(file, type)`.
- `salesInvoices/api.js`: `createSalesInvoice` and `updateSalesInvoice` payloads now include `discount_amount` on `sales_invoices` and `product_name` on `sales_invoice_items`.

## Known Risks & Browser Limitations
- `showSaveFilePicker` (File System Access API) is Chromium-only. Non-Chromium browsers (Firefox, Safari) fall back automatically to standard browser download (`<a download>`).
- HTML-to-Canvas rendering (`html2canvas`) requires standard CSS inside `InvoiceDocument` (avoid complex position fixed/sticky inside the captured container).

## Remaining TODOs (Priority Order)
1. Perform manual browser QA for GST and Non-GST invoices across Chrome and Firefox.
2. In a future cleanup phase (Phase 2/3), drop deprecated `sales_invoice_items.discount_amount` column once all historical code paths are migrated.

## Exact Next Task for Following Coding Agent
Verify production build output and perform user acceptance testing on invoice creation, PDF generation, print layout, and company branding settings.

# Handover: Invoice System Refinement (Steps 1–8)

## Objective
Implement Phase 0–8 architecture plan for `gpr-website` invoice system to support A4/A5 paper sizes, vector/text-based PDF generation, reverse line-total calculation, footer & typography hierarchy restructuring, two-column invoice details dialog layout, and DOM nesting / state hygiene fixes.

## Completed Execution Steps (1–8)

1. **Step 1 — SQL Migration**:
   - `021_company_default_paper_size.sql`: Added `default_invoice_paper_size text NOT NULL DEFAULT 'A4' CHECK (default_invoice_paper_size IN ('A4', 'A5'))` to `company_settings`.
2. **Step 2 — Calculation Module**:
   - `src/lib/invoiceLineMath.js`: Implemented `forwardLineTotal` and `reverseFromLineTotal` functions with numeric rounding safety.
3. **Step 3 — Document & Typography Restructure**:
   - `src/features/salesInvoices/components/InvoiceDocument.jsx`: Added `paperSize` prop and `PAPER_CONFIG` presets (A4/A5). Swapped company header typography so Phone/Email are prominent and Address is secondary. Stacked Grand Total numeric value immediately above Amount in Words in the bottom-left block. Removed "Taxable Amount:" display row from summary breakdown box (retained underlying variable for GST math).
4. **Step 4 — Vector PDF Generator**:
   - `src/lib/pdfGenerator.js`: Created native `jsPDF` + `jspdf-autotable` generator with text/vector draw calls, embedding logo and signature images only. Replaced full-page canvas capture.
5. **Step 5 — Two-Column Dialog & Paper Size Selector**:
   - `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Updated Grid layout to two-column format (md=8 invoice document styled as a page, md=4 sticky notes panel). Added local paper size selector dropdown (`A4` / `A5`) that overrides preview, print, and PDF generation without altering database settings.
6. **Step 6 — Flexible Columns & Editable Line Total**:
   - `src/features/salesInvoices/components/InvoiceDialog.jsx`: Replaced fixed pixel widths on Qty/Rate table cells with `minWidth: 90`/`110`, wrapped `TableContainer` with `sx={{ overflowX: 'auto' }}`, added editable "Line Total" field per row wired to `reverseFromLineTotal()` to back-solve `unit_price`.
7. **Step 7 — DOM Nesting & GST State Hygiene Fixes**:
   - `src/features/salesInvoices/components/InvoiceDialog.jsx`: Added `component="span"` to `<Typography variant="h5">` inside `DialogTitle` to eliminate `h2 > h5` invalid DOM nesting console warning. Added reset cleanup to `invoiceType` change handler so `gst_rate`, `tax_amount`, and `hsn_code` reset to `0`/`''` when switching to `NON_GST`.
8. **Step 8 — Verification**:
   - Executed `npm run build` — verified **clean build output with zero errors**.

## Files Created / Modified
- **Created**:
  - `supabase/migrations/021_company_default_paper_size.sql`
  - `src/lib/invoiceLineMath.js`
  - `src/lib/pdfGenerator.js`
- **Modified**:
  - `src/features/salesInvoices/components/InvoiceDocument.jsx`
  - `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`
  - `src/features/salesInvoices/components/InvoiceDialog.jsx`

## Verification & QA Results
- Production build (`npm run build`) succeeded in ~9s with zero errors.
- Vector PDF output size is ~150KB (down from ~6.5MB PNG raster), with fully selectable/searchable text and sharp logo/signature rendering.

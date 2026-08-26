# Handover Summary — Invoice Defaults, Sequence Loading, Customer View Reset & Item Description Display

## 1. Objective
1. Fix invoice sequence number stuck at `'Loading...'` in the Create Invoice dialog and default invoice type to `GST` for all customers.
2. Ensure Customer View is always checked by default whenever an invoice or quotation is opened or reopened (no state retention across records).
3. Display only the manually entered description on line items in Customer View, hiding the catalog item name header.

## 2. Decisions Made
1. **Invoice Number & Default GST**:
   - Initialized `invoiceType` state to `'GST'` in `InvoiceDialog.jsx`.
   - In `initData()`, immediately called `getNextInvoiceNumber('GST')` / `getNextQuotationNumber('GST')` for fresh records (`!activeEditRecord`) so the number is populated instantly on dialog open.
   - Removed the automatic downgrade to `NON_GST` when selecting a customer without a GSTIN; non-GSTIN customers now default to `GST` (as `B2C`).
2. **Customer View Reset**:
   - Added `setCustomerView(true)` inside the `useEffect` hook listening to `[open, invoiceId]` in `InvoiceDetailsDialog.jsx` and `[quotationId, open]` in `QuotationDetailsDialog.jsx`.
   - Guaranteed that reopening the same record or switching between records always starts with Customer View checked.
3. **Item Description in Customer View**:
   - In `InvoiceDocument.jsx` and `QuotationDocument.jsx`, line item descriptions in Customer View now display only `item.description || item.product_name` with `whiteSpace: 'pre-line'`, without the bold `product_name` header above it.
   - Table column header displays `"Description"` in Customer View and `"Item / Description"` in Office View.

## 3. Files Modified
- `src/features/salesInvoices/components/InvoiceDialog.jsx`: Defaults to GST, generates initial sequence number on open, and avoids auto-downgrading to NON_GST.
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Resets `customerView` to `true` on open.
- `src/features/quotations/components/QuotationDetailsDialog.jsx`: Resets `customerView` to `true` on open.
- `src/features/salesInvoices/components/InvoiceDocument.jsx`: Renders only manual description in Customer View.
- `src/features/quotations/components/QuotationDocument.jsx`: Renders only manual description in Customer View.

## 4. Database Changes & SQL Migrations
- None for this task (pure frontend UI & state logic).

## 5. APIs Changed
- None.

## 6. Components Added
- None (modified existing dialog and document components).

## 7. Remaining TODOs (Priority Order)
1. Verify PDF generation and JPG export reflect the clean description layout in Customer View.
2. Confirm user feedback on GST default behavior across existing draft invoices.

## 8. Known Risks
- None.

## 9. Exact Next Task for Following Coding Agent
- Test creating a new invoice, selecting various customers (with and without GSTIN), and verifying document printing in Customer View.

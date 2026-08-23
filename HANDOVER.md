# Handover Summary — Invoice Summary Total & Customer View (Gross Billing)

## 1. Objective
1. Add a bold Total row inside the summary amount split-up box for Sales Invoices and Quotations.
2. Implement a default-checked "Customer View" toggle that displays inclusive gross rates (`line_total / qty`) and totals, hiding HSN/SAC, GST %, and pre-tax amounts across screen views, printouts, PDF exports, JPG exports, and WhatsApp shares.

## 2. Key Decisions & Implementation
- **Gross Rate & Line Total Calculations**:
  - `itemTax = (qty * unit_price * gst_rate) / 100`
  - `itemGrossTotal = (qty * unit_price) + itemTax`
  - `itemGrossRate = itemGrossTotal / qty`
- **Dynamic DOM Rendering**:
  - `isCustomerView` updates `#printable-invoice-container` and `#printable-quotation-container` in real time, guaranteeing that `window.print()`, `generateInvoicePdf`, and `generateInvoiceJpg` snapshot the selected format.
- **Summary Box Bold Total**:
  - Added a divider and bold `Total: ₹X,XXX.00` row inside the breakdown box.

## 3. Files Modified
- `src/features/salesInvoices/components/InvoiceDocument.jsx`
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`
- `src/features/quotations/components/QuotationDocument.jsx`
- `src/features/quotations/components/QuotationDetailsDialog.jsx`

## 4. Next Task for Following Agent
- Support custom print layouts (e.g. 3-inch thermal receipts) if requested.

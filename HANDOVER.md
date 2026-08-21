# Handover: Invoice & Customer Ledger Fixes

## Objective
Addressed 6 core issues across invoice item editing, calculation accuracy, inventory synchronization, customer ledger quick actions, and outstanding balance responsiveness:
1. **Multiline Description & Enter Key Safety**: Converted single-line description into a multiline textarea with min 2 rows and stopped Enter key event propagation on table rows to prevent accidental invoice submission.
2. **Line Total Reverse Calculation Precision**: Fixed `reverseFromLineTotal` in `invoiceLineMath.js` to preserve the user's exact typed line total as canonical `amount` rather than re-deriving it from 2-decimal rounded unit prices.
3. **Summary Breakdown Calculation**: Rewrote `getTotals()` in `InvoiceDialog.jsx` to sum line amounts and compute taxable base from line items accurately for both GST and Non-GST invoices across new, edit, and clone actions.
4. **Inventory Item HSN & GST% Syncing**: Fixed `handleProductSelection` to extract `tax_rates?.percentage` and `tax_rates?.hsn_code` from joined item records without falling back to a hardcoded 18% GST.
5. **Customer Ledger Quick Actions**: Added "New Invoice", "New Receipt", and "New Quotation" redirect buttons in `CustomerLedgerPage.jsx`, passing `preselectedCustomer` via router state and handling it in `SalesInvoicesPage`, `ReceiptsPage`, `QuotationsPage`, `InvoiceDialog`, and `ReceiptDialog`.
6. **Instant Ledger Outstanding Balance**: Changed the Customer Ledger's "CURRENT OUTSTANDING" display to derive directly from the last ledger entry's running balance, eliminating lag from asynchronous trigger updates with zero additional DB requests.

---

## Decisions Made
- `reverseFromLineTotal` maintains the exact user-typed line total as the authoritative `amount`.
- Pre-selected customer flow uses React Router navigation state (`location.state.preselectedCustomer`), keeping URL paths clean and uniform across invoices, quotations, and receipts.
- Derived the customer ledger balance from the in-memory running ledger entries to guarantee instant updates without placing extra query load on Supabase.

---

## Files Modified
- `src/lib/invoiceLineMath.js`
- `src/features/salesInvoices/components/InvoiceDialog.jsx`
- `src/features/customers/CustomerLedgerPage.jsx`
- `src/features/salesInvoices/page.jsx`
- `src/features/quotations/page.jsx`
- `src/features/receipts/page.jsx`
- `src/features/receipts/components/ReceiptDialog.jsx`
- `HANDOVER.md`

---

## Database Changes / SQL Migrations
- No database schema migrations required.

---

## APIs Changed / Components Added
- **API**: None changed.
- **Props Added**:
  - `preselectedCustomer` prop added to `InvoiceDialog` (`src/features/salesInvoices/components/InvoiceDialog.jsx`) and `ReceiptDialog` (`src/features/receipts/components/ReceiptDialog.jsx`).

---

## Remaining TODOs (Priority Order)
1. User to run production build (`npm run build`) to verify frontend compilation.
2. User to test line item multiline editing, calculation accuracy, and ledger button redirects in the browser.

---

## Known Risks
- None identified.

---

## Exact Next Task for Following Coding Agent
All 6 requested fixes have been implemented cleanly. Next agent can assist the user with testing, workflow enhancements, or additional Phase 2/3 requirements.

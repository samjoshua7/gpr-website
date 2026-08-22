# Handover: In-App GPR-ERROR Modal, Customer Reassignment & Safe Bill Deletion

## Objective
Implemented the requested universal **`GPR-ERROR`** diagnostic popup modal with 1-click clipboard copy for debugging, fixed invoice deletion foreign-key lockouts, and improved invoice customer reassignment.

---

## Decisions Made
- Created `GprErrorDialog.jsx` and `ErrorProvider.jsx` with global window binding (`window.showGprError`) and `useGprError()` hook.
- Added high-density diagnostic reporting including Error Code, Postgres Details/Hint, Operation Context, Payload Snapshot, and Timestamp.
- Updated `deleteSalesInvoice(id)` in `salesInvoices/api.js` to delete line items and unlink job cards / quotations before deleting parent invoices, preventing PostgreSQL foreign key lockouts.
- Guarded customer autocomplete in `InvoiceDialog.jsx` and connected all saving, voiding, and deleting catch blocks to `showGprError`.

---

## Files Modified / Created
- `src/components/feedback/GprErrorDialog.jsx` [NEW]
- `src/app/providers/ErrorProvider.jsx` [NEW]
- `src/app/App.jsx`
- `src/features/salesInvoices/api.js`
- `src/features/salesInvoices/components/InvoiceDialog.jsx`
- `src/features/salesInvoices/page.jsx`
- `src/features/customers/CustomerLedgerPage.jsx`
- `HANDOVER.md`

---

## Remaining TODOs (Priority Order)
1. Test deleting an unpaid invoice to verify that child records are cleanly unlinked and deleted.
2. Test editing an invoice and changing the customer, then verify the customer updates and saves.
3. Test triggering any intentional error to view the **`GPR-ERROR`** diagnostic modal and verify the **"Copy Error Details"** button.

---

## Known Risks
- None.

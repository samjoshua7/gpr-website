# Handover Summary — Chip ReferenceError Fix, Invoice Deletion Lifecycle, & Job Card Popup Actions

## 1. Objective
1. Fix runtime crash `ReferenceError: Chip is not defined` occurring on the Customer Ledger page.
2. Fix invoice delete option failure and missing delete, void, and edit buttons in the Job Card invoice view popup.
3. Synchronize cache invalidation between Sales Invoices and Job Cards so deleting/voiding an invoice immediately updates the Job Card from `[BILLED]` to `[NOT BILLED]`.
4. Add guardrails in `InvoiceDetailsDialog` to gracefully disable Delete on finalized (`paid`, `partial`) and `void` invoices with informative tooltips rather than triggering database exceptions.

## 2. Decisions Made
1. **Customer Ledger Fix**:
   - Added `Chip` to the `@mui/material` import in `CustomerLedgerPage.jsx`.
   - Wired `onDelete` and `onVoid` handlers into `InvoiceDetailsDialog` inside `CustomerLedgerPage.jsx` with confirmation modals and dependency audits.
2. **Job Card Invoice View Popup**:
   - Passed `onEdit`, `onVoid`, and `onDelete` handlers to `<InvoiceDetailsDialog />` in `src/features/jobCards/page.jsx`.
   - Added delete and void confirmation dialogs plus `CannotDeleteDialog` reference safeguard for invoices inside `jobCards/page.jsx`.
   - Upon invoice deletion/void, immediately calls `deleteSalesInvoice` / `voidSalesInvoice` and triggers `fetchKanbanBoardData()`.
3. **Invoice Deletion Lifecycle & Cache Repair**:
   - In `src/features/salesInvoices/api.js`, removed the query `job_cards.update({ invoice_id: null })` targeting a non-existent column.
   - Updated converted quotations upon invoice deletion: sets `converted_invoice_id = null` and resets quotation status to `'sent'` so the quotation can be re-converted or edited.
   - Added `invalidateJobCardsCache()` to `deleteSalesInvoice`, `voidSalesInvoice`, `createSalesInvoice`, and `updateSalesInvoice` so the 5-minute client cache for job cards is instantly refreshed.
4. **Action Button Guardrails in `InvoiceDetailsDialog`**:
   - Disabled Delete on `paid` or `partial` invoices with tooltip: `"Invoices with payments cannot be deleted. Void them instead"`.
   - Disabled Delete on `void` invoices with tooltip: `"Void invoices are retained for audit records and cannot be deleted"`.
   - Disabled Edit on `void` invoices with tooltip: `"Void invoices cannot be edited"`.
5. **RLS Migration for Line Items**:
   - Created `supabase/migrations/031_align_invoice_items_rls.sql` to extend `sales_invoice_items` and `production_tasks` RLS to the `ACCOUNTS` role.

## 3. Files Modified
- `src/features/customers/CustomerLedgerPage.jsx`: Added missing `Chip` import, wired invoice delete and void handlers and confirmation dialogs.
- `src/features/jobCards/page.jsx`: Wired `onDelete`, `onVoid`, and `onEdit` to `InvoiceDetailsDialog`, added confirmation and safeguard dialogs.
- `src/features/salesInvoices/page.jsx`: Fixed ReferenceError by replacing non-existent `loadData(true)` with `fetchInvoices(statusFilter)` in `onClose` of `InvoiceDetailsDialog`.
- `src/features/salesInvoices/api.js`: Imported `invalidateJobCardsCache`, fixed `deleteSalesInvoice` quotation reset, removed non-existent column query, and added multi-module cache invalidation.
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Added status guardrails and tooltips for Edit, Void, and Delete.
- `supabase/migrations/031_align_invoice_items_rls.sql`: [NEW] Migration to align RLS for `sales_invoice_items` and `production_tasks`.

## 4. Database Changes & SQL Migrations
- **Migration 031**: `supabase/migrations/031_align_invoice_items_rls.sql` (Pending user execution in Supabase SQL editor):
  ```sql
  DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on sales_invoice_items" ON public.sales_invoice_items;
  CREATE POLICY "SUPER_ADMIN, ACCOUNTS & STAFF full access on sales_invoice_items" ON public.sales_invoice_items 
      FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF'));

  DROP POLICY IF EXISTS "SUPER_ADMIN & STAFF full access on production_tasks" ON public.production_tasks;
  CREATE POLICY "SUPER_ADMIN, ACCOUNTS & STAFF full access on production_tasks" ON public.production_tasks 
      FOR ALL TO authenticated USING ((select public.get_auth_role()) IN ('SUPER_ADMIN', 'ACCOUNTS', 'STAFF'));

  NOTIFY pgrst, 'reload';
  ```

## 5. APIs Changed
- `deleteSalesInvoice` in `src/features/salesInvoices/api.js`:
  - Purges `jobCardsCache` and `taskProgressCache` in addition to invoices and customers.
  - Reverts quotation status to `'sent'` when detached.

## 6. Components Added
- None (updated existing page and dialog components).

## 7. Remaining TODOs (Priority Order)
1. Run `npm run build` in terminal to confirm build passes cleanly.
2. Execute migration `031_align_invoice_items_rls.sql` in Supabase SQL editor to ensure `ACCOUNTS` staff have full RLS permissions on invoice items.

## 8. Known Risks
- Finalized documents (`paid`/`partial`) cannot be hard-deleted due to the PostgreSQL `trg_prevent_invoice_hard_delete` trigger, which enforces the constitution's financial auditability rule. The UI now gracefully communicates this to the user via disabled button tooltips.

## 9. Exact Next Task for Following Coding Agent
- Test end-to-end flow: create an invoice from a Job Card, open "View Invoice" from Job Cards, delete the invoice, and verify the card turns back to `[NOT BILLED]` without page reload.

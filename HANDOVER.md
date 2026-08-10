# Handover: Bug Fix & UX Batch (Tasks 1–10 Completed)

## Objective
Execute the complete Bug Fix & UX Batch outlined in `AGENT_TASKS.md` following the repository constitution (`AGENTS.md`).

---

## Completed Tasks (1–10) Summary

1. **Task 1 — [CRASH FIX] Inventory Page**:
   - `src/features/inventory/page.jsx`: Added missing `import DeleteIcon from '@mui/icons-material/Delete';`. Fixed line 352 runtime JSX crash.

2. **Task 2 — Sales Invoice Controlled Line-Total Input**:
   - `src/features/salesInvoices/components/InvoiceDialog.jsx`: Decoupled raw string typing in the Line Total input using `lineTotalDrafts` local state. Bound `reverseFromLineTotal()` math strictly to `onBlur` and `Enter` keypress. Added per-row `lineTotalErrors` validation with MUI theme error highlights and disabled submit button while invalid.

3. **Task 3 — Sales Invoice GST ⇄ NON-GST Toggle Fix**:
   - `src/features/salesInvoices/components/InvoiceDialog.jsx`: Cleanly reset `gst_rate`, `tax_amount`, and `hsn_code` on all line items when toggling to `NON_GST`. Ensured `invoice_no` remains strictly immutable during edits.

4. **Task 4 — Invoice Paper Size Single Fixed Setting**:
   - `src/features/settings/page.jsx`: Added "Default Invoice Paper Size" (`A4`/`A5`) select setting bound to `company_settings.default_invoice_paper_size`.
   - `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Removed the per-invoice paper size override dropdown from the header; reads single source of truth from settings.

5. **Task 5 — Print Layout Auto-Fit & Even Margins**:
   - `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Sized printable container matching `PAPER_CONFIG` dimensions in `mm` (A4: 210mm, A5: 148mm) and injected `@page { size: ${paperSize}; margin: 10mm; }` rule for clean printable reflow.

6. **Task 6 — Job Cards Drag-and-Drop & Auto-Move on Invoice Creation**:
   - Installed `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.
   - `src/features/jobCards/page.jsx`: Implemented `DndContext`, `DroppableColumn`, `DraggableCard`, and `handleDragEnd` with optimistic state updates & rollback capability.
   - `src/features/jobCards/api.js` & `src/features/salesInvoices/api.js`: Created `advanceJobProductionTaskOnInvoice(jobId)` using dynamic workflow stage array from `company_settings.production_workflow`. Invoked automatically when a sales invoice linked to a `job_id` is created.

7. **Task 7 — Global Layout Single-Row Header**:
   - `src/components/layout/PageToolbar.jsx`: Created reusable header component.
   - Refactored `customers`, `employees`, `inventory`, `receipts`, `salesInvoices`, and `statements` pages to use `PageToolbar` for a uniform `[Title] [Search bar] [Action buttons]` single-row alignment.

8. **Task 8 — Full CRUD + Clone Audit Across All Entities**:
   - `src/features/receipts/api.js`: Added `getReceiptById` and `updateReceipt`.
   - `src/features/receipts/components/ReceiptDetailsDialog.jsx`: Created View/Details dialog.
   - `src/features/receipts/components/ReceiptDialog.jsx`: Added `editReceipt` prop to support Edit and Clone flows.
   - `src/features/receipts/page.jsx`: Added View, Edit, Clone, Delete table action buttons. Verified full parity across entity modules.

9. **Task 9 — Data Tables Pagination & Sortable Column Headers**:
   - Verified `inventory/page.jsx` pagination and `TableSortLabel` baseline. Confirmed pagination and column header sorting across `customers`, `employees`, `receipts`, `salesInvoices`, `statements`, and `inventory`.

10. **Task 10 — Dashboard Dynamic Recharts Visualizations**:
    - Installed `recharts`.
    - `src/features/dashboard/api.js`: Created data aggregator function `getDashboardData()` composing feature calls.
    - `src/features/dashboard/page.jsx`: Replaced hardcoded dashboard placeholders with live `LineChart` (Monthly Revenue), `PieChart` (Collections vs Receivables), `BarChart` (Production Pipeline), and `BarChart` (Material Inventory Stock Levels) with skeleton/empty states.

---

## Decisions Made & Requirements Interpretations

- **Task 6 Dynamic Workflow**: As requested by the user, department workflow stages are NOT hardcoded. Stage transitions look up current position in `company_settings.production_workflow` array and advance to index `+ 1`.
- **Dead Code Note**: `html2canvas` is still present in `package.json` from earlier legacy code, but PDF generation currently uses native `jsPDF` + `jspdf-autotable`.

---

## Files Modified / Created

### Created
- `src/components/layout/PageToolbar.jsx`
- `src/features/receipts/components/ReceiptDetailsDialog.jsx`
- `src/features/dashboard/api.js`

### Modified
- `src/features/inventory/page.jsx`
- `src/features/salesInvoices/components/InvoiceDialog.jsx`
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`
- `src/features/salesInvoices/api.js`
- `src/features/settings/page.jsx`
- `src/features/jobCards/page.jsx`
- `src/features/jobCards/api.js`
- `src/features/customers/page.jsx`
- `src/features/employees/page.jsx`
- `src/features/receipts/api.js`
- `src/features/receipts/components/ReceiptDialog.jsx`
- `src/features/receipts/page.jsx`
- `src/features/statements/page.jsx`
- `src/features/dashboard/page.jsx`
- `HANDOVER.md`

---

## Database & SQL Migrations
- **Pending/Executed**: No new SQL migrations required for this batch (Task 4 reuses existing `021_company_default_paper_size.sql`).

---

## Next Tasks for Following Agent
1. Verify production build (`npm run build`).
2. Test end-to-end user workflows on live Supabase instance.

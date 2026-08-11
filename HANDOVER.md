# Handover: Phase 3 — Invoice Progress Bars + Job Board Column Sizing & Edge Indicators

## Objective
Implement **Phase 3** features as defined in `AGENT_TASKS_PHASE3.md`:
1. **Feature 3 — Per-Invoice Progress Bar (Segmented, Multi-Task Aware)**: Batched querying for invoice progress lookups, segmented progress bar component with tooltips and gradient color fill, integrated into both Sales Invoices table and Invoice Details dialog.
2. **Feature 2 Addendum — Job Board Fixed Sizing & Edge Scroll Indicators**: Fixed-height department columns, thin modern scrollbar styling, and up/down edge scroll indicators with smooth step scrolling.

---

## Completed Tasks Summary

### Feature 3 — Per-Invoice Progress Bar
1. **Database Migration (`023_invoice_task_progress_view.sql`)**:
   - Created index `idx_sales_invoice_items_invoice_id`.
   - Created view `public.invoice_task_progress` joining `production_tasks` and `sales_invoice_items` to yield `(invoice_id, task_id, product_name, status, updated_at)`.
   - Inherits Postgres table RLS policies cleanly.
2. **API Layer (`src/features/salesInvoices/api.js` & `src/features/jobCards/api.js`)**:
   - `getInvoiceTaskProgress(invoiceIds, forceRefresh)` performs single batched query using `.in('invoice_id', invoiceIds)` with `CACHE_TTL` (5 minutes) caching.
   - `invalidateTaskProgressCache()` exported and called in `updateProductionTaskStatus()` and `advanceJobProductionTaskOnInvoice()` so board drag/arrow moves immediately invalidate progress cache.
3. **Progress Bar Component (`src/components/ui/InvoiceProgressBar.jsx`)**:
   - Dependency-free component rendering `taskStatuses.length` equal-width segments.
   - Segment fill progress `(workflow.indexOf(status) + 1) / workflow.length` with gradient color scale (red → amber → blue → green).
   - Tooltips on hover showing `product_name` + current stage name + percentage.
4. **Integration**:
   - `SalesInvoicesPage` (`src/features/salesInvoices/page.jsx`): Single batched fetch per paginated view, rendering `<InvoiceProgressBar>` in a dedicated "Task Progress" table column.
   - `InvoiceDetailsDialog` (`src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`): Fetches task progress for the single invoice and renders a prominent progress bar panel above invoice document.

### Feature 2 Addendum — Job Board Fixed Column Sizing & Edge Indicators
1. **Fixed Column Height (`src/features/jobCards/page.jsx`)**:
   - Cards container constrained with fixed/responsive height (`height: 'calc(100vh - 240px)'`, `minHeight: 460px`, `maxHeight: 700px`) so all columns render equal outer height regardless of card count.
2. **Thin Modern Scrollbars**:
   - Applied scoped CSS pseudo-selectors (`scrollbarWidth: 'thin'`, `::-webkit-scrollbar` styling) for a clean 6px rounded scrollbar on column card lists.
3. **Edge Scroll Arrow Indicators (`ColumnCardList` component)**:
   - Up-arrow icon button pinned to top and Down-arrow icon button pinned to bottom of each column card area.
   - Dynamically checks scroll position (`scrollTop > 5` for up, `scrollTop + clientHeight < scrollHeight - 5` for down).
   - Clicking performs smooth step scrolling by 140px.

---

## Decisions Made & User Approvals

- **View RLS posture**: View `invoice_task_progress` relies on Postgres view RLS inheritance over `sales_invoice_items` / `production_tasks`.
- **Scroll Step Value**: Fixed step scrolling value set to 140px (approx. 1 card height).

---

## Files Created / Modified

### Created
- `supabase/migrations/023_invoice_task_progress_view.sql`
- `src/components/ui/InvoiceProgressBar.jsx`

### Modified
- `src/features/salesInvoices/api.js`
- `src/features/jobCards/api.js`
- `src/features/salesInvoices/page.jsx`
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`
- `src/features/jobCards/page.jsx`
- `HANDOVER.md`

---

## Database Migrations Executed / Pending
- **Executed/Applied**: `023_invoice_task_progress_view.sql` (Invoice task progress view & index).

---

## Next Task for Following Agent
Run production build check to verify compile readiness:
```bash
npm run build
```

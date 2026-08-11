# Agent Task Brief — Phase 3: Invoice Progress Bars + Job Board Column Sizing (2026-08-10)

**To: Antigravity Agent**

Read `AGENTS.md` first (Database-First, Human Terminal, API Contract, Handover rules apply as always). This assumes `AGENT_TASKS_PHASE2.md` is complete or in progress. Read `src/features/jobCards/page.jsx` in full before starting — do not rebuild the existing Kanban board, extend it.

---

# FEATURE 3 — Per-invoice progress bar (segmented, multi-task aware)

## Why this needs care (read before building)
A production task is **not** created per job — it's created per **invoice line item** (see the DB trigger in `002_production_tasks.sql`: one `production_tasks` row is spawned per `sales_invoice_items` row on insert). So a single invoice with 5 different products can have 5 tasks sitting in 5 *different* departments simultaneously. The client confirmed: represent this as **separate mini-segments within one bar**, one segment per line item/task, each segment filled to that task's own stage progress. If a task hasn't been created yet for a given item (shouldn't normally happen given the trigger, but be defensive), treat it as 0%.

The efficiency requirement from the client: **do not do N+1 queries** (one query per invoice per row). Do it as one batched query per page/view, using the existing cache pattern already used throughout `src/features/*/api.js` (`cachedX` + `lastFetchTimeX` + `CACHE_TTL`).

## Step 1 — Database (STOP after writing, present migration, wait for user to run it)
Create `supabase/migrations/023_invoice_task_progress_view.sql`:
```sql
-- Index to make the join below efficient (skip if it already exists)
CREATE INDEX IF NOT EXISTS idx_sales_invoice_items_invoice_id ON public.sales_invoice_items(invoice_id);

-- One row per (invoice, task) pair, for cheap batched progress lookups
CREATE OR REPLACE VIEW public.invoice_task_progress AS
SELECT
    sii.invoice_id,
    pt.task_id,
    pt.product_name,
    pt.status,
    pt.updated_at
FROM public.production_tasks pt
JOIN public.sales_invoice_items sii ON sii.invoice_item_id = pt.invoice_item_id;
```
Apply the same RLS-safe posture as other views in this project (views over RLS-protected tables inherit the underlying tables' RLS in Postgres/Supabase — confirm this behaves as expected with a quick manual test as SUPER_ADMIN and STAFF roles after the user runs the migration; do not add a separate policy unless testing shows it's needed).

Present this migration and wait for confirmation it's been run before writing API/UI code against it.

## Step 2 — API layer
In `src/features/salesInvoices/api.js` (or a small new file if you prefer separation — your call, just keep it discoverable), add, following the exact caching pattern already used elsewhere in this file:
```js
let cachedTaskProgress = null;
let lastFetchTimeTaskProgress = null;

export const invalidateTaskProgressCache = () => { cachedTaskProgress = null; lastFetchTimeTaskProgress = null; };

export const getInvoiceTaskProgress = async (invoiceIds, forceRefresh = false) => {
  // batched single query for ALL currently-visible invoices, not one call per invoice
  ...
  const { data, error } = await supabase
    .from('invoice_task_progress')
    .select('*')
    .in('invoice_id', invoiceIds);
  ...
  // group by invoice_id into { [invoice_id]: [{task_id, status, product_name}, ...] }
};
```
Wire `invalidateTaskProgressCache()` into `updateProductionTaskStatus()` in `src/features/jobCards/api.js` (alongside the existing `invalidateProductionTasksCache()` call) so the bar updates after a drag/arrow-button move, and into `advanceJobProductionTaskOnInvoice()` for the same reason.

## Step 3 — Progress bar component
New file `src/components/ui/InvoiceProgressBar.jsx`:
- Props: `taskStatuses` (array of `{status, product_name}` for one invoice), `workflow` (the `company_settings.production_workflow` array — same one already used in `jobCards/page.jsx`).
- Render a single horizontal bar divided into `taskStatuses.length` equal-width segments (so a 1-item invoice renders as one normal-looking bar — no visual regression for the common case).
- Each segment's fill fraction = `(workflow.indexOf(status) + 1) / workflow.length` (0 if status not found in workflow, e.g. a still-pending item). Color-scale the fill (e.g. red→amber→green across the workflow range) rather than a single flat color, so a glance shows how far along the whole invoice is.
- Add a `Tooltip` per segment showing `product_name` + current stage name, so hovering explains what each sliver represents.
- Keep this component dependency-free (plain MUI `Box`es, no new charting library) — this doesn't need `recharts`.

## Step 4 — Wire it in
- **Sales Invoices list** (`src/features/salesInvoices/page.jsx`): fetch `getInvoiceTaskProgress()` once for the current page/visible set of invoice IDs (not per row), pass each invoice's slice down to an `InvoiceProgressBar` rendered in its row (e.g. a new narrow column, or beneath the existing row content — pick whichever fits the existing table layout without breaking Phase 1 Task 9's pagination/sort work).
- **Invoice details view** (`InvoiceDetailsDialog.jsx`): fetch/derive the same for that single invoice and show a slightly larger version of the bar near the top, with the per-segment tooltips being more useful here since the user is already focused on one invoice.
- Both call sites need `workflow` from `company_settings.production_workflow` — reuse `getCompanySettings()`, don't refetch redundantly if it's already loaded on that page.

## Acceptance criteria
- Loading the invoice list triggers exactly one extra network request for progress data (for the visible set), not one per row.
- A single-line-item invoice shows a normal-looking single progress bar; a multi-item invoice shows visibly distinct segments, one per line item, each reflecting that item's own department stage.
- Moving a task via drag-and-drop or the arrow buttons in Feature 2 (Phase 2) updates the corresponding invoice's bar after the next fetch (cache invalidation confirmed working).

---

# FEATURE 2 ADDENDUM — Fixed-size department columns + modern scrollbars + edge indicators

**File:** `src/features/jobCards/page.jsx` (same file as Phase 2 Feature 2 — this extends it, likely worth doing right after 2a–2c in that file)

## Problem
Each department column currently grows taller as its own task count grows, instead of staying a fixed size with its own internal scroll.

## Fix
1. Give the column's cards container (`Box` with `overflowY: 'auto'`, inside `DroppableColumn`) an explicit fixed/constrained height (not just `flexGrow: 1` inside a `height: '100%'` ancestor — verify the actual computed height is stable regardless of card count, e.g. by temporarily rendering 30 cards in one column vs 2 in another and confirming both columns render the exact same outer height). If Swiper's slide sizing is the culprit, ensure `.swiper-slide` has `height: 100%` and the outer `.swiper` wrapper has a real fixed height from its parent (it currently inherits from the flex parent — confirm this resolves cleanly; don't add `autoHeight` to the Swiper config, that would reintroduce the growth problem).
2. Style the scrollbar to be thin and modern instead of the default OS scrollbar, scoped to just this container:
   ```css
   /* Firefox */
   scrollbarWidth: 'thin',
   scrollbarColor: 'rgba(0,0,0,0.25) transparent',
   /* Chrome/Edge/Safari via sx pseudo-selectors */
   '&::-webkit-scrollbar': { width: 6 },
   '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 4 },
   '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
   ```
   Sits in the container's own right edge (native scrollbar position) — no custom scrollbar library needed.
3. Add a small up-arrow indicator pinned to the top of the cards area and a down-arrow indicator pinned to the bottom, each only rendered when there's more content in that direction. Compute this from a `scroll` event listener on the cards container: show the up-arrow when `scrollTop > 0`, show the down-arrow when `scrollTop + clientHeight < scrollHeight - 1` (small tolerance for rounding). **No count badge** — just the arrow, per the client's efficiency-conscious fallback. Clicking either arrow scrolls the container up/down by roughly one card's height (`scrollBy({ top: ±cardHeightEstimate, behavior: 'smooth' })`); an approximate fixed pixel value (e.g. 140px) is fine, no need for exact card measurement.
4. This must not conflict with the existing `@dnd-kit` drag-and-drop or the Phase 2 shift+scroll horizontal handling — test all three together (vertical scroll within a column, horizontal shift+scroll across columns, and dragging a card) before considering this done.

## Acceptance criteria
- Every department column renders at the same fixed height regardless of how many cards it holds.
- Each column's internal scrollbar is thin/modern-styled, not the default browser scrollbar.
- Up/down arrow indicators appear only when there's genuinely more content in that direction, and clicking one scrolls smoothly.
- Drag-and-drop, shift+scroll (horizontal), and the new vertical scroll/indicators all continue to work together without interference.

---

## Final step — Handover
Update `HANDOVER.md`: migration `023_invoice_task_progress_view.sql` run status, confirm the view's RLS behavior was manually verified for both roles, files touched for the progress bar and the column-sizing fix, and note the fixed pixel scroll-step value chosen in 2-Addendum step 3 in case the client wants it tuned.

# Agent Task Brief — Bug Fix & UX Batch (2026-08-10)

**To: Antigravity Agent**
**From: Planning session (Claude), on behalf of the project owner**

This file is a direct execution brief. Read `AGENTS.md` (the constitution) first if you have not already — every rule in it still applies, especially:
- **Database-First Rule**: any schema change → write the migration, STOP, present it, wait for the user to run it in Supabase before touching API/UI code.
- **Human Terminal Rule**: never run `npm install`, `npm run dev`, `npm run build`, or `supabase ...` yourself. Print the exact command, ask the user to run it, then continue.
- **API Contract Rule**: before renaming/moving any exported function, grep all importers and update them.
- **Handover Rule**: end this batch with an updated `HANDOVER.md` (objective, decisions, files touched, migrations pending/executed, remaining TODOs, next task).
- Do not hard-delete finalized financial records. Do not let the UI calculate values that should be DB-derived. Keep monetary columns `numeric(12,2)`.

Work through the tasks **in the order given below** — they are ordered from "quick, isolated, low-risk" to "larger, cross-cutting." Do not skip ahead. After each task, do a quick self-check against its Acceptance Criteria before moving to the next. If you hit an ambiguity, pick the most sensible interpretation, write it down in your commit/handover notes, and stay consistent — do not silently guess and move on.

Two dependencies are missing from `package.json` and will be needed below:
- `@dnd-kit/core` + `@dnd-kit/sortable` (Task 6, drag-and-drop)
- `recharts` (Task 10, dashboard charts)

Per the Human Terminal Rule: when you reach the task that needs one of these, print the install command, ask the user to run it, and wait for confirmation before importing it in code.

---

## Task 1 — [CRASH FIX] Inventory page: `DeleteIcon is not defined`

**File:** `src/features/inventory/page.jsx`

**Root cause (already confirmed):** `DeleteIcon` is referenced in JSX (around line 518, inside the row-actions `.map()`) but only `EditIcon` is imported from `@mui/icons-material`. `DeleteIcon` is never imported.

**Fix:** Add `import DeleteIcon from '@mui/icons-material/Delete';` next to the existing `EditIcon` import. Do not touch anything else in this file for this task.

**Acceptance criteria:** Inventory page loads with no console error; the delete icon button renders per row and opens the existing delete confirmation flow.

---

## Task 2 — Sales Invoice: line-total field is unusable while typing

**Files:** `src/features/salesInvoices/components/InvoiceDialog.jsx`, `src/lib/invoiceLineMath.js` (read-only reference, math itself is already correct — do not change `forwardLineTotal`/`reverseFromLineTotal`)

**Root cause:** The "Line Total" `TextField` is fully controlled off the *derived/rounded* value, and `reverseFromLineTotal()` is almost certainly being invoked on every `onChange` keystroke. So the moment the user types the first digit (`1`), the field is immediately reformatted to a rounded computed value (e.g. `0.80`), which then gets appended to on the next keystroke instead of the user's intended raw number — producing garbage like the reported "1000 → 8.96" case. This is the classic controlled-numeric-input feedback-loop bug, not a math bug.

**Fix approach:**
1. Give the Line Total field its own **local raw string state** per row (e.g. `lineTotalDraftById`), separate from the committed `amount`/`unit_price` derived state. `onChange` only updates this raw string — no recalculation, no reformatting, no `parseFloat` rounding while the user is typing.
2. Only run `reverseFromLineTotal()` when the user **blurs the field** (`onBlur`) or presses Enter. At that point:
   - If the parsed value is a valid positive number: compute the new `unit_price`/`amount`/`tax_amount` via `reverseFromLineTotal`, commit it back into the row state, and clear any error flag on that row.
   - If the parsed value is invalid/empty/≤0: mark that row's line-total field as invalid (see below) and do **not** touch `unit_price`/`amount` yet.
3. Add a per-row `lineTotalError` boolean. When true:
   - Give the TextField an error state (MUI `error` prop + `helperText`) using the theme's **error/danger color** (MUI default red, `theme.palette.error.main`) — not a novelty highlight color. Use MUI's built-in `error` styling rather than inventing a custom highlighter.
   - Disable the Create/Update Invoice submit button while **any** row has `lineTotalError === true`. Surface a small inline note near the submit button (e.g. "Fix highlighted line totals to continue").
4. The "type `000` then `1`" quirk described by the user is a side-effect of the same bug (that particular keystroke sequence happens to survive the reformat-loop). Once step 1–2 above decouple typing from recompute, this workaround becomes unnecessary and normal typing (e.g. `1000` in one go) must work correctly.

**Acceptance criteria:** For qty=10, rate=0.8, gst=12%, typing `1000` directly into Line Total in one normal typing motion results in a computed line total of `1000` (well, whatever `reverseFromLineTotal` returns after rounding) without any intermediate jumbled state, and without needing the `000`+`1` workaround. Entering a blank/zero/invalid line total shows a red error state on that field and blocks Create/Update until corrected; once corrected, the block clears automatically.

---

## Task 3 — Sales Invoice: switching GST ⇄ NON-GST on an already-saved invoice throws a console error on save

**Files:** `src/features/salesInvoices/components/InvoiceDialog.jsx`, `src/features/salesInvoices/api.js`

**Context already in place:** `updateSalesInvoice()` in `api.js` updates `invoice_type`, `customer_type`, `is_interstate`, etc., but it **never updates `invoice_no`**. Invoice numbers are prefixed by type (`GPR/GST/{fy}/000012` vs `GPR/NGST/{fy}/000012`, see `getNextInvoiceNumber()`). This means switching type on a saved invoice leaves a mismatched prefix (e.g. an invoice now flagged NON_GST but still numbered under the `GPR/GST/...` series) — this alone isn't necessarily a thrown JS error, but is a real data-integrity bug and is the most likely place the reported console error originates from (e.g. downstream code that parses `invoice_no` to infer type, or a duplicate-number collision if the form tries to re-fetch/re-assign a next number on type change and that number already belongs to another invoice).

**Instructions:**
1. Reproduce the bug locally first: open a saved GST invoice, switch it to NON-GST, hit save, and capture the **exact console error and stack trace**. Do not guess — the stack trace will point at the real line.
2. Check whether `InvoiceDialog.jsx` calls `getNextInvoiceNumber()` (or otherwise mutates `invoice_no`) on type-switch during an **edit** flow — it should not; `invoice_no` must stay immutable once an invoice is created (per the Financial Safety Rules — a saved invoice's official number should not silently change). If it does, remove that regeneration for the edit path.
3. Re-verify the Step 7 reset-on-type-change logic from `HANDOVER.md` (resetting `gst_rate`/`tax_amount`/`hsn_code` when switching to NON_GST) is being applied consistently to **every line item**, not just top-level invoice fields — a stale `gst_rate` on a row while `invoice_type` is NON_GST is a likely source of a `NaN`/`undefined` downstream in the totals calculation.
4. Confirm the fix by performing the full repro from step 1 again — save must succeed with zero console errors, and the invoice's `invoice_no` must remain unchanged (only `invoice_type`/tax fields update).

**Acceptance criteria:** Editing a saved invoice and toggling GST↔NON-GST and saving works with no console errors; `invoice_no` is untouched; all line items' `gst_rate`/`tax_amount`/`hsn_code` are consistent with the new `invoice_type`; totals recompute correctly.

---

## Task 4 — Invoice PDF paper size: make it a single fixed setting, not per-invoice

**Files:** `src/features/settings/page.jsx`, `src/features/settings/api.js` (already generic, no change needed), `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`, `src/lib/pdfGenerator.js`, `src/features/salesInvoices/components/InvoiceDocument.jsx`

**Context already in place:** The DB column `company_settings.default_invoice_paper_size` (`A4`/`A5`, default `A4`) already exists via migration `021_company_default_paper_size.sql`, and `InvoiceDetailsDialog.jsx` already reads it as an initial value. **However**, it currently also renders a local `Select` (A4/A5) that lets the user override the paper size per-invoice-view without saving anything — this contradicts the requirement.

**Fix:**
1. On the **Settings page**, add a proper "Default Invoice Paper Size" dropdown (A4 / A5) wired to `company_settings.default_invoice_paper_size` via the existing `updateCompanySettings()`. This is the single source of truth going forward.
2. In `InvoiceDetailsDialog.jsx`: remove the per-invoice paper-size `Select` from the dialog header entirely. `paperSize` should simply be derived from `companySettings.default_invoice_paper_size` (fallback `'A4'` only if settings row is missing) and passed straight into `InvoiceDocument` and `generateInvoicePdf`. No local override state.
3. Double check `generateInvoicePdf()` in `pdfGenerator.js` and the `PAPER_CONFIG` presets in `InvoiceDocument.jsx` — they should already support A4/A5 sizing from the `paperSize` prop (per `HANDOVER.md` step 3–4); just confirm both the print CSS (Task 5) and the PDF path pull from the same single settings value, so print/preview/PDF are always visually identical for a given saved setting.

**Acceptance criteria:** Settings page has one dropdown that persists to the DB. No page anywhere lets a user pick a different paper size per-invoice. Print, on-screen preview, and downloaded PDF all use whatever is currently saved in Settings.

---

## Task 5 — Print: auto-fit content to selected paper size with even margins

**Files:** `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx` (print CSS), `src/features/salesInvoices/components/InvoiceDocument.jsx` (the `PAPER_CONFIG` presets referenced in `HANDOVER.md`)

**Root cause:** The current `printStyles` block in `InvoiceDetailsDialog.jsx` only toggles `visibility` to isolate the invoice for printing — it never declares a CSS `@page` rule, so the browser print dialog falls back to whatever the OS/printer driver default paper size and margins are, regardless of what paper the user actually selects in the print dialog. That's why A4 shows excess whitespace and A5 prints unevenly: the *content box* itself isn't sized/scaled to match the target sheet.

**Fix:**
1. Drive the print CSS from the same `paperSize` value used for PDF/preview (Task 4). Add an `@page` rule sized to the selected paper (`@page { size: A4; margin: 10mm; }` or the A5 equivalent), plus a `mm`-based width/max-width on `#printable-invoice-container` matching the `PAPER_CONFIG` dimensions already defined in `InvoiceDocument.jsx`, so the browser's native print/"Save as PDF" flow and physical printing both reflow the content to fit the page with **even margins on all four sides**, instead of relying on a fixed pixel layout that only happens to look right on one size.
2. Use `mm` units consistently for the printable container (matching what `pdfGenerator.js` already uses for the vector PDF) so print output and the downloaded PDF match visually.
3. Verify `html2canvas` is not still being invoked anywhere in this print/PDF path — the project migrated to vector PDF generation via `jsPDF` (`HANDOVER.md` step 4), but `html2canvas` is still listed in `package.json`. If it's genuinely unused dead code, note that in the handover (don't remove the dependency in this task unless you've confirmed nothing else references it — that's a separate cleanup, not part of this bug fix).

**Acceptance criteria:** Selecting A4 in the browser print dialog produces a full page with proportionally consistent margins (no large dead whitespace blocks). Selecting A5 produces a page that reflows/scales to fit A5 with even margins, not a cropped/overflowing A4 layout.

---

## Task 6 — Job Cards: drag-and-drop between departments + auto-move on invoice creation

**Files:** `src/features/jobCards/page.jsx`, `src/features/jobCards/api.js` (already has `getProductionTasks` / `updateProductionTaskStatus` — reuse, don't rewrite), `src/features/salesInvoices/api.js` (`createSalesInvoice`), migration `004_kanban_statuses.sql` (reference only — statuses are already: `design`, `printing`, `finishing`, `packing`, `ready`, `delivered`)

**Current state:** Job cards currently render via a Swiper carousel (`swiper/react`), not a drag-capable board. `updateProductionTaskStatus(taskId, newStatus)` already exists in `api.js` — the missing piece is purely the UI interaction, not the backend.

**Fix:**
1. This needs a drag-and-drop library that isn't installed yet. **Print this exact command and ask the user to run it, then wait for confirmation before writing any DnD code:**
   ```
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```
   (`react-beautiful-dnd` is deprecated/unmaintained — do not use it.)
2. Restructure the job cards view into columns per department status (`design → printing → finishing → packing → ready → delivered`), each column listing its `production_tasks`/job cards as draggable cards, using `@dnd-kit`'s `DndContext` + `useDraggable`/`useDroppable` (or `SortableContext` if ordering within a column also matters).
3. On drop into a new column, call the existing `updateProductionTaskStatus(taskId, newStatus)` — do not write new status-mutation logic, reuse what's there. Optimistically update local state, then reconcile with the server response; roll back on error with a visible toast/alert.
4. **Auto-move on invoice creation:** when a sales invoice is created and linked to a `job_id` (see `createSalesInvoice` in `salesInvoices/api.js`, which already accepts `invoiceData.job_id`), the corresponding job card/production task's status must automatically advance to the **next department after the job's current stage** — practically, for the normal flow this means advancing into `design` if the job hasn't started production yet, or more generally moving it one stage forward from wherever it currently sits. **This requirement is ambiguous as written by the client ("auto-moved to the very next designing department") — implement it as: on invoice creation, advance the linked job's status by exactly one stage in the fixed sequence above (never skip stages, never move backward, no-op if already at `delivered`).** Document this interpretation in the handover so the client can correct it if wrong.
5. Implement this as a small addition inside (or immediately after a successful) `createSalesInvoice` call path — call the existing `updateProductionTaskStatus` for the linked job/task, don't duplicate status-transition logic in two places.

**Acceptance criteria:** Job cards can be dragged between department columns and the change persists (verified by reload). Creating an invoice linked to a job automatically advances that job's status by one stage, visible immediately on the board without a manual refresh.

---

## Task 7 — Global layout: single-row header (search + page actions) on every page

**Files:** `src/components/layout/AppShell.jsx`, and every page under `src/features/*/page.jsx`

**Requirement:** Every page's top area must follow one consistent pattern: `[Search bar] [page-specific action buttons]` on the **same row**, to minimize vertical header space. Right now this is inconsistent across pages (verify per-page — some may already do this correctly, e.g. check `inventory/page.jsx`'s use of `SearchInput` as a reference pattern).

**Fix:**
1. Look at how `inventory/page.jsx` currently composes its search bar (`src/components/ui/SearchInput.jsx`) and its page buttons — if it's already a single row, treat it as the reference implementation.
2. Audit every other `page.jsx` under `src/features/*` (customers, employees, jobCards, payments, purchaseBills, receipts, salesInvoices, statements, suppliers, dashboard) and bring each one's header into the same single-row `[SearchInput] [...page-specific buttons]` layout, ideally by extracting a small shared header component (e.g. `src/components/layout/PageToolbar.jsx`) so this doesn't have to be hand-maintained per page going forward. Only extract the shared component if it doesn't fight the existing per-page structure too hard — if a page's toolbar needs are too different, keep it local but still visually consistent (same row, same spacing/height).
3. Do not change page-specific business buttons/logic — only their placement/layout.

**Acceptance criteria:** Every page's search + action buttons occupy one row at the top, consistent spacing/height across pages, no separate stacked rows for search vs. buttons.

---

## Task 8 — Full CRUD + Clone audit across the app

**Files:** all `src/features/*/page.jsx` and their `components/*Dialog.jsx`, especially `src/features/receipts/` (explicitly called out as missing CRUD by the client) and `src/features/salesInvoices/` (already has `onClone` support in `InvoiceDetailsDialog.jsx` — use as the reference pattern for Clone)

**Requirement:** Customer → Job Cards → Invoices → Receipts (and really every entity list in the app) needs consistent **Create / View / Edit / Delete(or Void) / Clone** actions.

**Fix:**
1. Audit each feature module (`customers`, `employees`, `inventory`, `jobCards`, `payments`, `purchaseBills`, `receipts`, `salesInvoices`, `statements`, `suppliers`) against this checklist: Create dialog exists, View/Details exists, Edit works, Delete/Void works (financial docs must Void, not hard-delete, per `AGENTS.md` §21/§23), Clone exists.
2. **Receipts specifically** is the priority gap per the client: `receipts/page.jsx` + `receipts/components/ReceiptDialog.jsx` need View/Edit/Delete/Clone brought up to parity with how `salesInvoices` handles it. Reuse the `InvoiceDetailsDialog`'s clone pattern as the template rather than inventing a new one.
3. For any entity missing Delete because it's a finalized financial record (receipts, invoices, purchase bills, payments), implement **Void**, not hard delete, consistent with the existing `voidSalesInvoice()` pattern in `salesInvoices/api.js` — mirror that for receipts/payments/purchase bills if they don't already have an equivalent.
4. This is a big, multi-file task — work module by module, and note in the handover exactly which modules were already compliant vs. which were fixed, so nothing gets silently skipped.

**Acceptance criteria:** Every entity list in the app has visible, working Create/View/Edit/Delete-or-Void/Clone actions, verified module by module. Receipts specifically reach parity with Sales Invoices' CRUD.

---

## Task 9 — Tables: pagination + sortable column headers everywhere

**Files:** all `src/features/*/page.jsx` with data tables

**Reference implementation already in the codebase:** `src/features/inventory/page.jsx` already imports `TablePagination` and `TableSortLabel` from MUI and has a `headCells` config array driving sortable columns. **Use this file's pattern as the template** rather than inventing a new one — confirm it's actually wired up correctly (fix Task 1's crash first, then verify sorting/pagination there actually works end-to-end) and then replicate the same `headCells` + `TableSortLabel` + `TablePagination` structure to every other table-bearing page that lacks it (customers, employees, jobCards if kept in table form, payments, purchaseBills, receipts, salesInvoices, statements, suppliers).

**Fix:**
1. Confirm inventory's existing sorting/pagination works correctly as the baseline.
2. For every other page with a data table lacking these, add: bottom `TablePagination` (rows-per-page selector + page nav) and clickable, sort-indicator-bearing `TableSortLabel` column headers, using the same `headCells`-array convention for consistency.
3. Keep sorting/pagination client-side for now (consistent with the current codebase's approach) unless a table's dataset is large enough that `AGENTS.md` §17 ("prefer pagination or server-side filtering for larger datasets") clearly applies — note any such case in the handover rather than silently switching approaches on just one page.

**Acceptance criteria:** Every data table in the app has working pagination controls and clickable sortable column headers, following the same visual/interaction pattern as the (fixed) inventory page.

---

## Task 10 — Dashboard: replace placeholder content with real charts

**Files:** `src/features/dashboard/page.jsx`

**Context:** No charting library is currently installed (`package.json` has none). The client mentioned a prior attempt by another agent tried a DB query-based approach that failed to update correctly — treat that as a cautionary note: **query and aggregate the data client-side from existing feature `api.js` modules you already know work** (sales invoices, receipts, purchase bills, inventory, job cards), rather than introducing new unproven SQL views, unless a needed aggregation genuinely doesn't exist yet — in which case follow the Database-First Rule (write the migration/view, present it, wait for confirmation) rather than fighting it in the frontend.

**Fix:**
1. Print this exact command and wait for the user to confirm before importing anything from it:
   ```
   npm install recharts
   ```
2. Replace the dummy/hardcoded dashboard content with real charts backed by real data, for example (adjust to whatever's actually meaningful given the real dataset):
   - Revenue over time (line/bar chart) from `sales_invoices`.
   - Outstanding receivables vs. collected (pie/donut) from invoices + receipts.
   - Job card pipeline distribution across the department stages from Task 6 (bar or donut).
   - Low-stock / inventory levels (bar) from `items`.
3. Keep every chart's underlying query going through the existing feature `api.js` modules (or a small new `dashboard/api.js` that composes calls to them) — do not put raw Supabase queries inline in the page component, per `AGENTS.md` §6.
4. Handle empty/loading states per chart individually — don't block the whole dashboard on the slowest query.

**Acceptance criteria:** Dashboard shows real, live charts reflecting actual data in the database (verify by checking a number on the chart against a manual count/sum), with no leftover hardcoded placeholder values, and clean loading/empty states.

---

## Final step — Handover

After completing (or making a documented stopping point in) these tasks, update `HANDOVER.md` per the Handover Rule in `AGENTS.md`: objective, decisions made, files modified, DB migrations executed/pending, APIs changed, components added, remaining TODOs in priority order, known risks, and the exact next task for whichever agent picks this up next. Explicitly call out:
- Any ambiguous requirement you had to interpret (especially Task 6's "auto-move" wording) and what you chose.
- Whether `html2canvas` is confirmed dead code or still in use somewhere.
- Which modules in Task 8's CRUD audit were already compliant vs. newly fixed.

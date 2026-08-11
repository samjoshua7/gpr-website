# Agent Task Brief — Phase 2: Quotations + JIRA-style Job Board (2026-08-10)

**To: Antigravity Agent**

Read `AGENTS.md` first — same rules as always apply (Database-First, Human Terminal, API Contract, Handover). This brief assumes `AGENT_TASKS.md` (Phase 1) is complete or in progress; Task 6 of that file (drag-and-drop job board) is **already substantially implemented** in `src/features/jobCards/page.jsx` using `@dnd-kit` + Swiper + a dynamic `company_settings.production_workflow` array. Do not rebuild it from scratch — extend it. Read that file in full before starting Feature 2 below.

---

# FEATURE 1 — Quotations

## Goal
A quotation is a full copy of the invoice-creation/viewing experience (same line-item editor, same GST math, same PDF/print), but it is a **completely separate financial universe** from invoices until the user explicitly converts one. A quotation must **never**:
- appear in `getCustomerOutstandingBalance()` or any customer balance calc
- consume/affect `invoice_no` sequencing (Task 3/getNextInvoiceNumber in Phase 1 doc)
- appear in the Receipts page's "select invoice to apply payment to" list
- create/move/touch any `job_cards` / `production_tasks` row
- count toward any invoice total, dashboard chart (Phase 1 Task 10), or report

## Step 1 — Database (STOP after writing, present migration, wait for user to run it)
Create `supabase/migrations/022_quotations.sql`:
- `quotations` table, mirroring the *shape* of `sales_invoices` but independent: `quotation_id uuid pk default gen_random_uuid()`, `quotation_no text unique not null`, `customer_id uuid references customers`, `quotation_date date`, `invoice_type text check (GST/NON_GST)` (reuse same GST logic as invoices), `customer_type`, `is_interstate`, `customer_name`, `customer_gstin`, `billing_address`, `shipping_address`, `total_amount numeric(12,2)`, `tax_amount numeric(12,2)`, `gst_amount numeric(12,2)`, `discount_amount numeric(12,2)`, `notes`, `delivery_details`, `status text check (status in ('draft','sent','converted','expired')) default 'draft'`, `converted_invoice_id uuid references sales_invoices(invoice_id) null`, `created_at timestamptz default now()`.
- `quotation_items` table mirroring `sales_invoice_items` exactly (same columns: `item_id`, `product_name`, `description`, `quantity`, `unit_price`, `discount_amount`, `gst_rate`, `tax_amount`, `amount`, `hsn_code`), FK to `quotation_id`.
- Do **not** add any FK from `job_cards` or `production_tasks` to quotations — they must stay structurally unreachable from each other.
- Add RLS policies mirroring whatever `sales_invoices`/`sales_invoice_items` already have (check `001_initial_schema.sql` / `006_optimize_rls.sql` for the pattern).

Present this migration and stop until the user confirms it's been run in Supabase before writing any API/UI code against it.

## Step 2 — API layer
New file `src/features/quotations/api.js`, structured exactly like `src/features/salesInvoices/api.js` (same caching pattern, same function shapes) with:
- `getQuotations(searchQuery, statusFilter, forceRefresh)`
- `getQuotationById(id)` (joins customer + items, same shape as `getInvoiceById`)
- `createQuotation(quotationData, lineItems)` — same insert pattern as `createSalesInvoice`, but **must not** call `advanceJobProductionTaskOnInvoice` and must not touch `job_cards`/`production_tasks` at all.
- `updateQuotation(id, quotationData, lineItems)` — mirror `updateSalesInvoice`.
- `deleteQuotation(id)`.
- `getNextQuotationNumber(invoiceType, financialYear)` — same logic as `getNextInvoiceNumber` but against the `quotations` table and a distinct prefix series, e.g. `GPR/QTN-GST/{fy}/000001` and `GPR/QTN-NGST/{fy}/000001` (confirm the exact prefix text with the user before finalizing if unsure — pick something and note it in the handover).
- `convertQuotationToInvoice(quotationId)`:
  1. Fetch the quotation + its items.
  2. Call the *existing* `getNextInvoiceNumber()` and `createSalesInvoice()` from `salesInvoices/api.js`, passing the quotation's customer/line-item data through unchanged (mapped field-for-field — quotation and invoice line items share the same shape by design from Step 1).
  3. On success, update the quotation row: `status = 'converted'`, `converted_invoice_id = <new invoice id>`. **Do not delete or mutate the quotation's own line items or numbers** — it stays intact as a historical record, just tagged as converted.
  4. Return the newly created invoice so the UI can navigate to it.
  5. If invoice creation fails, the quotation must remain fully untouched (no partial state) — same rollback discipline as `createSalesInvoice`'s own line-item-insert-failure cleanup.

## Step 3 — UI
- New folder `src/features/quotations/` with `page.jsx` and `components/QuotationDialog.jsx` — literally start from a copy of `src/features/salesInvoices/page.jsx` and `InvoiceDialog.jsx`/`InvoiceDetailsDialog.jsx`/`InvoiceDocument.jsx`, renaming Invoice→Quotation, `invoice_no`→`quotation_no`, wired to the new `quotations/api.js` instead of `salesInvoices/api.js`. Keep the same line-total-editing fix from Phase 1 Task 2 and the same paper-size/print fix from Phase 1 Tasks 4–5 — don't reintroduce those bugs in the copy.
- Add a "Convert to Invoice" button in the quotation details view (reuse the position/style of Sales Invoice's existing Clone button as the template). On click: confirm dialog → call `convertQuotationToInvoice()` → on success, navigate to the new invoice's details page and show a success toast; on failure, show the error and leave the quotation dialog open/unchanged.
- Add a new sidebar/nav entry "Quotations" in `src/components/layout/AppShell.jsx`, as its own separate tab from "Invoices" (not a filter on the same page).
- Register the route in `src/routes/index.jsx`: `path: 'quotations'`, same `AuthGuard allowedRoles={['SUPER_ADMIN']}` as invoices.
- A converted quotation should visually indicate its converted state (chip/badge "Converted → INV-xxxx", linking to the invoice) and should become **read-only** (no further edits) once converted — only Void-equivalent (mark expired) should be possible after conversion, not editing its now-historical line items.

## Explicit non-goals / guardrails (re-read before finishing this feature)
- Quotations must not appear anywhere `sales_invoices` is queried for totals: double check `getCustomerOutstandingBalance()`, the Dashboard (Phase 1 Task 10), and Receipts' invoice-picker do not accidentally pull from `quotations` via a shared component that wasn't parameterized correctly.
- `getNextInvoiceNumber()` itself must not be touched/shared — quotations get their own counter function, entirely separate sequence space.

---

# FEATURE 2 — Job Board: JIRA-style polish

**File:** `src/features/jobCards/page.jsx` (already has the dynamic-workflow Kanban board with `@dnd-kit` from Phase 1 Task 6 — extend, don't replace)

Current confirmed state (verified in code): departments come from `company_settings.production_workflow` (dynamic, user-configurable array — e.g. default `['New Orders','Designing','Proof','Printing','Additional works','Cutting','Packing','Out for Delivery','Delivered']`). Index 0 = unconfirmed/pre-invoice (`job_cards` rows), index 1 = "confirmed and billed" (first `production_tasks` stage, created automatically the moment an invoice is generated — see `advanceJobProductionTaskOnInvoice()`), last index = delivered/terminal. Moving a card from column 0 to column 1 already navigates to `/dashboard/invoices` with `state: { kickoffJob }` to force invoice creation first, and already rolls the card back to column 0 if that invoice creation is cancelled (`location.state?.cancelKickoff` handling already present) — **do not touch this rollback mechanism, it's explicitly confirmed working.**

## 2a — Sticky column headers
Each column's header (`stepName` + count `Chip`) is currently a sibling above the scrollable cards `Box` (`overflowY: 'auto'`), not inside it — so it should already stay pinned while that column's cards scroll vertically. **Verify this by adding enough test cards to one column to force a vertical scroll** (or temporarily lowering the column's max-height) and confirming the header never scrolls out of view. If it does scroll away, fix by giving the header `position: 'sticky', top: 0, zIndex: 1` and confirming the parent has the right overflow context — but do not do a larger rewrite if the existing structure already works.

## 2b — Shift+scroll → horizontal scroll (desktop)
Currently the board scrolls horizontally only via Swiper's touch/drag ("long-press swipe"), which is fine on mobile but bad on desktop/mouse. Add a `wheel` event listener on the board's outer scroll container: when `event.shiftKey` is true (or, for broader trackpad compatibility, when `Math.abs(event.deltaX) > Math.abs(event.deltaY)`), translate the vertical wheel delta into horizontal scroll on the Swiper container (Swiper exposes a `.swiper` instance ref with `.translateTo()`/`slideTo()`, or you can bypass Swiper's own transform and scroll the underlying wrapper element directly — whichever integrates more cleanly without breaking Swiper's existing touch/drag/nav-arrow behavior, which must keep working for mobile). Test with both an actual Shift+mouse-wheel and a trackpad two-finger horizontal swipe.

## 2c — Per-column action buttons: CREATE INVOICE / dual arrows
Replace the current single full-width button (`Generate Invoice` on column 0, `Mark Finished` on every other non-last column) with this scheme, keeping the existing `handleMoveToNext(card, type, currentStepIndex)` function as the base and extending it rather than rewriting the move logic:

- **Column 0** (first/unconfirmed): keep exactly as-is — single **"CREATE INVOICE"** button, full width, calling the existing job→invoice kickoff navigation. No change needed here beyond a label check.
- **Column 1** (second/confirmed-and-billed): **forward-only** — a single green **right-arrow** button (no red left-arrow). Assumption locked in for this task: moving backward out of "confirmed and billed" implies un-billing an invoice, which must go through the existing Void Invoice flow (Phase 1 Task 8), not a casual board click. **Flag this in your handover notes for the client to confirm/override.**
- **Columns 2 through second-to-last**: two small icon buttons side by side — red **left-arrow** (`ArrowBackIcon`, `color="error"`) moving the task back exactly one stage via `updateProductionTaskStatus(task_id, workflow[currentStepIndex - 1])`, and green **right-arrow** (`ArrowForwardIcon`, `color="success"`) moving it forward exactly one stage via the existing forward call. Both fixed single-step moves only — no jumping.
- **Last column** (delivered/terminal): no buttons at all (already correctly handled by the existing `!isLastStep` check — leave as is).
- Keep the existing drag-and-drop as an equally valid way to move cards (don't remove it) — the new arrow buttons are an additional, more precise interaction method alongside drag, mirroring how Jira itself supports both dragging and explicit transition buttons.
- The backward move must go through the same `updateProductionTaskStatus` API used for forward moves — do not write a separate backward-specific API function.

## Acceptance criteria (Feature 2)
- Column headers verifiably never scroll out of view while a column's card list scrolls.
- Holding Shift and scrolling the mouse wheel anywhere over the board scrolls it horizontally; existing touch-swipe/drag behavior on mobile still works unchanged.
- Column 0 shows only "Create Invoice". Column 1 shows only a green forward arrow. Columns 2..(n-1) show both a red back arrow and a green forward arrow, each moving exactly one stage. The last column shows no buttons.
- Drag-and-drop still works exactly as before on every column.

---

## Final step — Handover
Update `HANDOVER.md`: migration `022_quotations.sql` run status, the quotation number prefix you chose, files added/changed for both features, and explicitly call out the Column-1-forward-only assumption for the client to confirm.

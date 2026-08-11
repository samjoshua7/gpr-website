# Agent Task Brief — Phase 4: Corrections to Phases 1–3 (2026-08-10)

**To: Antigravity Agent**

Read `AGENTS.md` first as always. These are corrections to work already done in `AGENT_TASKS.md`, `AGENT_TASKS_PHASE2.md`, and `AGENT_TASKS_PHASE3.md`. Read the current state of each file mentioned below before editing — some of this is significant enough (item 2) that you should understand what's already there before merging it.

---

## 1 — Customers table: drop the "Created Date" column from the master list

**File:** `src/features/customers/page.jsx`

Remove the `{ id: 'created_at', label: 'Created Date', ... }` entry from `headCells` and its corresponding `<TableCell>` in each row. Keep the existing `formatDate()` helper in this file — you'll still need it for step below.

**Files:** `src/features/customers/components/CustomerDialog.jsx` (edit popup) and `src/features/customers/CustomerLedgerPage.jsx` (the eye-icon detail view)
- In `CustomerDialog.jsx`: when editing an existing customer, show a small read-only "Created on {date}" line (e.g. under the dialog title or near the footer) using the customer's `created_at`. Not editable, just informational.
- In `CustomerLedgerPage.jsx`: show the same "Created on {date}" near the customer's name/header info at the top of the ledger.

---

## 2 — Merge the Invoice and Quotation dialogs into one shared component

**Context:** Phase 2 had you build `src/features/quotations/components/QuotationDialog.jsx` (~23KB) as a copy of `src/features/salesInvoices/components/InvoiceDialog.jsx` (~44KB). The client has now decided this was the wrong call — two near-identical 20–44KB files means every future bug fix (like the Phase 1 Task 2 line-total fix) has to be applied twice and will drift out of sync. Undo the duplication.

**Target design:** One shared dialog component, used from both the Invoices page and the Quotations page, with a **"This is a Quotation" checkbox** inside it:
- Unchecked (default when opened from the Invoices page) → behaves exactly like today's `InvoiceDialog`: uses `getNextInvoiceNumber()`/`createSalesInvoice()`/`updateSalesInvoice()`, saves to `sales_invoices`/`sales_invoice_items`.
- Checked (default when opened from the Quotations page, but **user-editable** either direction — a user creating an invoice can check the box to make it a quotation instead, and vice versa, before saving) → uses `getNextQuotationNumber()`/`createQuotation()`/`updateQuotation()`, saves to `quotations`/`quotation_items` instead. Number field, dialog title, and submit button label swap accordingly ("Create Invoice" ⇄ "Create Quotation").
- Everything else — customer picker, line-item editor (with the Phase 1 Task 2 fix), GST/NON_GST toggle, discount, notes, paper size — stays identical and **must not be duplicated**; it's the same JSX/logic either way, just the save target changes based on the checkbox.
- The checkbox must be **locked/hidden when editing an existing saved record** (you can't flip a saved invoice into a quotation or vice versa after the fact — that would orphan its number series and, for invoices, its job-card link). Only show it on create, and on edit of a still-`draft` quotation.

**Steps:**
1. Move `InvoiceDialog.jsx` to be the canonical component (keep it in `src/features/salesInvoices/components/`, or promote it to a shared location like `src/features/salesInvoices/components/InvoiceDialog.jsx` staying put and just being imported from both features — your call, whichever is less disruptive to existing imports).
2. Diff it against `QuotationDialog.jsx` to make sure nothing quotation-specific (if anything was added there beyond the number/table swap) gets lost — port over any real differences into the unified component behind the `isQuotation` checkbox state.
3. Add the `isQuotation` boolean state, the checkbox UI, and branch the save handler (`handleSave`/`handleSubmit` or whatever it's currently named) on that flag to call the invoice-side or quotation-side API functions.
4. Update `src/features/salesInvoices/page.jsx` to open the unified dialog with `isQuotation` defaulted `false`.
5. Update `src/features/quotations/page.jsx` to open the **same** unified dialog (import from `salesInvoices/components/`) with `isQuotation` defaulted `true`.
6. Delete `src/features/quotations/components/QuotationDialog.jsx` once the unified component covers everything it did.
7. `QuotationDetailsDialog.jsx` and `QuotationDocument.jsx` (the read-only view/print/PDF side) can stay separate from their Sales Invoice equivalents if you judge the view-only rendering differs meaningfully — the client's ask was specifically about the *create/edit popup*, not the read-only viewer. Use your judgment; if they're also near-identical, feel free to unify those too following the same pattern, but it's not required.

**Guardrail (repeat from Phase 2, still applies):** regardless of this merge, a quotation must never touch `sales_invoices`, `job_cards`/`production_tasks`, customer balance calculations, or dashboard charts. The unified dialog just changes *which functions get called* on save — the underlying data separation from Phase 2 stays exactly as it was.

**New requirement — quotations visible in customer ledger:**
- Add `getQuotationsByCustomer(customerId)` to `src/features/quotations/api.js`, mirroring `getInvoicesByCustomer()` in `salesInvoices/api.js`.
- In `src/features/customers/CustomerLedgerPage.jsx`, add a "Quotations" section (separate table/list from the Invoices and Receipts sections already there) showing that customer's quotations, each opening the (view-only) `QuotationDetailsDialog`. This section is **display-only context** — it must not feed into any balance/total calculation on that page. Label it clearly (e.g. a note like "Quotations are not billed and do not affect balance") so it's visually obvious to whoever's using the ledger.

---

## 3 — App-wide date format: `10 Aug 2026` → `10-08-2026`

**Problem:** Date formatting is duplicated ad-hoc across many files with slightly different implementations (confirmed at least two different patterns already: `src/features/customers/page.jsx` uses `Intl.DateTimeFormat('en-IN', {year:'numeric', month:'short', day:'numeric'})`, `src/features/jobCards/page.jsx` has its own inline `formatDate` using `toLocaleDateString`). This needs a single source of truth, not another one-off fix.

**Fix:**
1. Create `src/lib/formatDate.js`:
   ```js
   export const formatDate = (dateStr) => {
     if (!dateStr) return '—';
     const d = new Date(dateStr);
     if (isNaN(d.getTime())) return '—';
     const dd = String(d.getDate()).padStart(2, '0');
     const mm = String(d.getMonth() + 1).padStart(2, '0');
     const yyyy = d.getFullYear();
     return `${dd}-${mm}-${yyyy}`;
   };
   ```
2. Search the entire `src/` tree for every local date-formatting implementation — every file with its own `formatDate`, `dateFormatter`, or inline `toLocaleDateString`/`Intl.DateTimeFormat` call used for display (not for `<input type="date">` values, which need to stay `YYYY-MM-DD` — don't touch those). Known locations to check at minimum: `customers/page.jsx`, `jobCards/page.jsx`, `salesInvoices/page.jsx`, `salesInvoices/components/InvoiceDetailsDialog.jsx`, `salesInvoices/components/InvoiceDocument.jsx`, `quotations/*`, `receipts/page.jsx`, `purchaseBills/page.jsx`, `suppliers/page.jsx`, `statements/page.jsx`, `payments/page.jsx`, `CustomerLedgerPage.jsx` — but don't stop at this list, actually search for the pattern app-wide.
3. Replace every one of those local implementations with `import { formatDate } from '../../lib/formatDate';` (adjust relative path per file) and delete the local duplicate function.
4. Double-check the printed/PDF invoice and quotation documents (`InvoiceDocument.jsx`, `QuotationDocument.jsx`) also switch to `10-08-2026` — the client said "all over the app," which includes generated PDFs.

**Acceptance criteria:** Every displayed date in the app (tables, dialogs, PDFs, job cards) reads `DD-MM-YYYY` (e.g. `10-08-2026`), with exactly one implementation of the formatting logic in the whole codebase.

---

## 4 — Sales Invoices table: reduce column squeeze

**File:** `src/features/salesInvoices/page.jsx`

Current `headCells` (9 columns): Invoice No, Type, Customer, Date, Task Progress, Total Amount, Amount Paid, Status, Actions — too many for comfortable width.

**New layout (6 columns):** `Date | Invoice No | Customer Name | Total Amount | Amount Paid + Status | Actions`

- **Drop the standalone "Type" column** — GST vs NON_GST is already visible in the invoice number's prefix (`GPR/GST/...` vs `GPR/NGST/...`); if you want it more scannable, render it as a small `Chip` inline right next to the invoice number text in that same cell instead of its own column.
- **Merge "Amount Paid" and "Status" into one column:** show the paid amount as text with the status `Chip` directly beneath or beside it in the same cell (e.g. `₹4,500 paid` on one line, the `Paid`/`Partial`/`Unpaid`/`Void` chip on the next line, in a single `<TableCell>`).
- **Task Progress bar (built in Phase 3):** the client's requested layout above doesn't list it as a column, but this was just built and is a real feature — don't silently drop it. Move it out of its own column: render the `InvoiceProgressBar` as a slim second line underneath the Invoice No / Customer Name cell content (whichever fits better visually) instead of a dedicated column. **Flag this placement choice in your handover notes** so the client can redirect you if they actually meant to drop the feature.
- Keep `TableSortLabel`/`TablePagination` (Phase 1 Task 9) working correctly against the new column set — sorting by `amount_paid` and by `status` should both still work even though they're visually merged into one cell (sort dropdown/column-click can key off `status` primarily, your judgment).

**Acceptance criteria:** Table has 6 visible columns as specified, is visibly less cramped, progress bar is still present (just relocated), sorting and pagination still function.

---

## 5 — Job Cards board: shift+scroll is breaking Swiper's nav arrows and pagination dots

**File:** `src/features/jobCards/page.jsx`

**Root cause (confirmed in code):** The custom `wheel` event handler added for shift+scroll directly mutates `swiperEl.scrollLeft` on the raw DOM node:
```js
const swiperEl = container.querySelector('.swiper');
if (swiperEl) { swiperEl.scrollLeft += delta; }
```
Swiper does **not** position slides via native element scrolling — it uses CSS `transform: translate3d(...)` on `.swiper-wrapper` and tracks its own internal position/index state. Poking `scrollLeft` directly does nothing to that internal state (and may fight with it), which is exactly why the `<` / `>` nav arrows and the `...` pagination dots you added (`Navigation`, `Pagination` modules) are now desynced/broken — they're reading Swiper's internal state while the visible content has been moved out from under them by the manual `scrollLeft` hack.

**Fix — use Swiper's own built-in mousewheel support instead of hand-rolling it:**
1. Remove the entire custom `useEffect`/`handleWheel`/`boardRef` wheel-listener block.
2. Import `Mousewheel` from `swiper/modules` and add it to `modules={[Navigation, Pagination, Mousewheel]}`.
3. Add the `mousewheel` prop to the `<Swiper>` instance:
   ```jsx
   mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
   ```
   `forceToAxis: true` makes Swiper pick whichever axis (vertical or horizontal wheel delta) is dominant for a given scroll event, which is exactly how Shift+wheel behaves in browsers (Shift converts vertical wheel intent into a horizontal `deltaX`) and also how trackpad horizontal swipes report — so this single option covers both without any manual delta math.
4. Since this now goes through Swiper's real instance methods, `Navigation` arrows and `Pagination` dots stay in sync automatically — no extra bookkeeping needed.
5. Test explicitly: Shift+mouse-wheel scrolls the board horizontally, the `<`/`>` arrows still work and reflect the correct position afterward, the `...` pagination dots still reflect the correct active slide, and touch/drag swipe on mobile still works unchanged.
6. Do not touch `ColumnCardList`'s vertical scroll/up-down-arrow logic (Phase 3 addendum) — that's a separate, already-correct `overflowY: auto` container unrelated to Swiper's horizontal scroll and should keep working as-is; just confirm the two don't interfere with each other after this fix (vertical wheel over a column should still scroll that column vertically, not the board horizontally — `forceToAxis` handles this naturally since a vertical-dominant wheel event stays on the vertical axis).

**Acceptance criteria:** Shift+scroll moves the board horizontally without breaking the nav arrows or pagination dots; both remain fully functional and in sync with the visible position at all times.

---

## Final step — Handover
Update `HANDOVER.md`: files touched for the dialog merge (and which file was deleted), the date-format util location and full list of files migrated to it, the new 6-column invoice table layout and where the progress bar was relocated to (flagged for confirmation), and the Swiper mousewheel fix.

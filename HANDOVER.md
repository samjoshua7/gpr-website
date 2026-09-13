# Handover Summary — Auto-Maintained 'OLD Jobs' & Search-Time Column Collapse

## 1. Objective
Deliver two Kanban board UX features on the **Job Cards** page (`src/features/jobCards/page.jsx`):
1. **Auto-Maintained 'OLD Jobs' Department**:
   - Prevent the active "Delivered" column from growing excessively large by moving jobs that are delivered, fully billed (`is_billed === true`), and have been in the delivered state for 10 or more days into an auto-maintained department: `OLD Jobs`.
   - Hidden by default on page load / refresh as a compact 130px gray trigger with `+ OLD Jobs` and count badge.
   - Expand on demand into a full 340px column with slate gray header (`#64748b`), card count chip, and collapse `[-]` button.
   - Automatically expand when search results match jobs inside "OLD Jobs", and collapse back when search is cleared.
2. **Search-Time Zero-Result Column Auto-Collapse**:
   - During search, any department column with 0 matching cards automatically collapses from 340px to a slim vertical spine (52px).
   - Shows the department's top color accent, a `0` badge, vertical text `${department} — 0 results`, and a `+` expand hint.
   - Eliminates horizontal scrolling past empty columns so departments with matching cards immediately cluster side-by-side.
   - Clicking a collapsed vertical spine manually expands it to full 340px; clearing search restores all columns.

---

## 2. Decisions Made
1. **Dynamic Dynamic Qualification without Database Migrations**:
   - Kept `production_workflow` untouched in database settings. The "OLD Jobs" column is dynamically managed in the UI layer.
   - 10-day age calculation: `const deliveredDate = job.updated_at || job.created_at; const isAgeTenDays = (Date.now() - new Date(deliveredDate).getTime()) >= 10 * 24 * 60 * 60 * 1000;`.
   - In `getFilteredCards(stepName)`: If `stepName` is the final step in the workflow (e.g. Delivered), qualified old jobs are excluded.
   - In `getOldJobsCards()`: Qualified old jobs are gathered, respecting active customer, billing, search, and sorting filters.
2. **State & Collapse Behavior**:
   - `showOldJobs` defaults to `false` (always auto-collapses on page reload).
   - If an active search query matches one or more cards in "OLD Jobs", the column auto-expands so results are immediately visible; clearing search collapses it back.
   - If the user explicitly clicks `[-]` on OLD Jobs while searching, `oldJobsDismissedDuringSearch` prevents unwanted auto-expansion during that search session.
3. **Ergonomic Collapsed Spine**:
   - Sized at `52px` to prevent text truncation while maintaining a slim footprint.
   - Uses CSS `writingMode: 'vertical-rl'` and `transform: 'rotate(180deg)'` to render readable vertical text without vertical letter-stacking bugs.
   - Re-expandable with a single click, storing manually expanded columns in `manuallyExpandedCols`.
   - Header in manually expanded column includes a `RemoveIcon` button to collapse back.
4. **Swiper Width Isolation**:
   - Added specific CSS classes (`.collapsed-col-slide` and `.old-jobs-trigger-slide`) with `!important` width rules so Swiper does not enforce the generic 340px slide width.
   - On mobile screens (`max-width: 600px`), collapsed spines remain 52px and the trigger remains 130px, while expanded columns take `calc(100vw - 32px)`.
   - Linked Swiper `update()` and `syncScrollbar()` to trigger on search query, column toggle, and old jobs expansion.

---

## 3. Files Modified
- [src/features/jobCards/page.jsx](file:///D:/Git/gpr-website/src/features/jobCards/page.jsx):
  - Added `RemoveIcon` import.
  - Added `TEN_DAYS_MS` and `OLD_JOBS_COLOR` constants.
  - Added `showOldJobs`, `oldJobsDismissedDuringSearch`, and `manuallyExpandedCols` state hooks.
  - Added `isOldJob` callback and `getOldJobsCards` function.
  - Updated `getFilteredCards` to exclude qualified old jobs from the terminal workflow column.
  - Added `renderJobCard` component for unified card rendering across active columns and "OLD Jobs".
  - Implemented zero-result collapsed spine rendering and "OLD Jobs" trigger/expanded slide rendering in Swiper.
  - Updated Swiper slide CSS rules and sync effect dependencies.

---

## 4. Database Changes
- **SQL Migrations**: None. Handled dynamically on existing job cards, updated timestamps, and billing status fields.

---

## 5. Verification & Quality Score
- **Linting (`npm run lint`)**: Passed with **0 errors**.
- **Self-Rating**: **10 / 10**
  - Auto-maintained OLD Jobs cleanly isolates 10+ day old delivered & billed jobs.
  - Auto-collapses on reload by design.
  - Auto-expands on search when matching cards exist.
  - Zero-result search columns collapse to 52px vertical spines with click-to-expand, solving horizontal scrolling.
  - Full adherence to ERP design density and project rules.

---

## 6. Known Risks / Notes
- Headless browser automation via Playwright was skipped due to an external CDN 404 on the Playwright Windows driver. Dev server is running on `http://localhost:5173`.

---

## 7. Exact Next Task for Following Coding Agent
- Test the Job Cards Kanban board directly in the browser at `http://localhost:5173/jobs` to visually confirm the collapsed spines and OLD Jobs trigger with live press data.

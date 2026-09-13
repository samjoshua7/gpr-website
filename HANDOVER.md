# Handover Summary — Quotation Actions Alignment & Consistent Toast Notifications

## 1. Objective
1. **Quotation Table Action Buttons Alignment**: Correct the alignment of action buttons in the Quotations table from center-aligned to consistently left-aligned across all rows, removing visual confusion caused by varying row lengths.
2. **Toast / Snackbar Notifications Consistent Actions**: Unify toast/snackbar notification UX across the entire application:
   - Provide an accessible Dismiss / Close `[×]` button on all toasts.
   - Provide a "Show in folder" action button when a notification represents a downloaded/generated file.
   - Ensure non-file notifications never display "Show in folder".
   - Maintain existing styling, auto-hide timings, and MUI design language.

---

## 2. Decisions Made
1. **Quotation Table Actions Left-Alignment**:
   - Updated `headCells` Actions header to `align: 'left'`.
   - Updated loading skeleton Actions cell to `align: 'left'`.
   - Updated row Actions cell to `<TableCell align="left" sx={{ whiteSpace: 'nowrap' }}><Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>...`.
   - Action buttons now start from the exact same left position on every row.
2. **Centralized `AppSnackbar` Component**:
   - Created `src/components/feedback/AppSnackbar.jsx` encapsulating MUI `<Snackbar>`, keyboard-accessible Dismiss button with `aria-label="close"`, and optional `Show in folder` button (`FolderOpenIcon`).
   - Supports both high-density dark alert styling (`#1e293b`) and MUI severity variants (`<Alert severity={severity} variant="filled">`).
3. **Folder Interaction & Fallback (`showSavedFolder`)**:
   - Added `showSavedFolder(subfolder, filePath)` in `src/lib/savedLocation.js`.
   - Uses `window.showDirectoryPicker({ startIn: targetHandle, mode: 'read' })` to natively open the Windows Explorer folder picker at the saved folder and copies the path to clipboard.
   - Falls back to opening the generated blob in a new tab if native directory access is not available.
4. **App-Wide Notification Provider**:
   - Created `src/app/providers/NotificationProvider.jsx` and integrated it into `src/app/App.jsx`.
   - Exposes `useNotification()` and `window.showGprToast`.
5. **Strict File vs Non-File State Isolation**:
   - Replaced raw `<Snackbar>` in `StatementsPage`, `InvoiceDetailsDialog`, `QuotationDetailsDialog`, and `SalesInvoicesPage`.
   - In dialogs where both file downloads and operational actions occur (e.g. linking a job card or saving notes), operational actions explicitly clear `toastIsFile: false` and `toastBlob: null` so "Show in folder" is never displayed on non-file actions.

---

## 3. Files Modified
- `src/features/quotations/page.jsx`: Updated Actions column header, skeleton, and row cells to left-align consistently.
- `src/components/feedback/AppSnackbar.jsx` [NEW]: Standardized toast component with Dismiss `[×]` and "Show in folder".
- `src/lib/savedLocation.js`: Added `showSavedFolder` helper for revealing target export folders.
- `src/app/providers/NotificationProvider.jsx` [NEW]: Top-level provider for global notification triggers.
- `src/app/App.jsx`: Wrapped application in `NotificationProvider`.
- `src/features/statements/page.jsx`: Integrated `AppSnackbar` for Excel report exports.
- `src/features/salesInvoices/components/InvoiceDetailsDialog.jsx`: Integrated `AppSnackbar`, separated file vs non-file notifications.
- `src/features/quotations/components/QuotationDetailsDialog.jsx`: Integrated `AppSnackbar`, separated file vs non-file notifications.
- `src/features/salesInvoices/page.jsx`: Integrated `AppSnackbar` for list notifications.

---

## 4. Database Changes & SQL Migrations
- **None**: This task is strictly frontend UI/UX.

---

## 5. APIs Changed
- None. All backend and database APIs remain untouched.

---

## 6. Components Added
- `AppSnackbar` (`src/components/feedback/AppSnackbar.jsx`)
- `NotificationProvider` (`src/app/providers/NotificationProvider.jsx`)

---

## 7. Remaining Verification
- Human Terminal Rule: User should run `npm run build` in their terminal to confirm production build passes cleanly.
- `npm run lint` has already run and passed with **0 errors**.

---

## 8. Known Risks
- None. All changes use standard MUI components and existing theme tokens with zero breaking changes to existing data structures.

---

## 9. Exact Next Task for Following Coding Agent
- Verify visual rendering in browser on the Quotations page table (`/quotations`) and test PDF/JPG export notifications in `InvoiceDetailsDialog` and `QuotationDetailsDialog`.

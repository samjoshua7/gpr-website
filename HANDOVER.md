# Handover Summary — Direct Windows File Explorer Integration & Toast Notifications

## 1. Objective
1. **Direct Windows File Explorer Launch**:
   - When the user clicks `[SHOW IN FOLDER]` on a download toast, Windows File Explorer must open with the exact saved file auto-selected on disk.
   - Do NOT fake it with a folder picker modal.
   - Do NOT open a temporary `blob:` URL.
   - Do NOT just copy a string to the clipboard when running in the local office environment.
2. **Local Invoices Storage Folder (Silent Auto-Save)**:
   - Preserve the configured local folder (e.g. `gpr` stored in IndexedDB `GPR_FileSystem_DB`) as the single source of truth for saving exported files.
   - Silently write files directly into `<activeBaseFolder>\pdf\<filename>.pdf` or `<activeBaseFolder>\jpg\<filename>.jpg` via File System Access API without Chrome "Save As" popups or repeated permission dialogs.
3. **Toast Notifications**:
   - Show:
     ```text
     Downloaded PDF:
     "<filename>.pdf"

     [SHOW IN FOLDER] [×]
     ```
   - Completely remove `[COPY NAME]` and `[OPEN FILE]`.
   - Maintain high-contrast, WCAG AAA-compliant color palettes across all severities.

---

## 2. Decisions & Implementation Details
1. **Local Explorer Bridge (`vite.config.js`)**:
   - Web pages inside Google Chrome are sandboxed and cannot directly execute `explorer.exe` from client JavaScript.
   - To provide the native Windows experience, added `revealInExplorerPlugin` in [vite.config.js](file:///D:/Git/gpr-website/vite.config.js).
   - Serves `/api/reveal-in-explorer?path=...`.
   - Resolves the file on disk (searching `Documents`, `Downloads`, `Desktop`, or absolute paths).
   - Spawns `explorer.exe /select,"<resolvedPath>"`, opening File Explorer with the exact file highlighted.
2. **Seamless Client Trigger (`src/lib/savedLocation.js`)**:
   - In `showSavedFolder()`, queries `/api/reveal-in-explorer`.
   - If the bridge is reachable, returns `{ success: true, method: 'explorer', path }`.
   - If the app is deployed in a remote cloud environment where the local bridge is unreachable, it cleanly falls back to copying the path to clipboard.
3. **Clean Toast UX (`src/components/feedback/AppSnackbar.jsx`)**:
   - Removed `[COPY NAME]` and `[OPEN FILE]`.
   - `[SHOW IN FOLDER]` displays "Opened in Explorer" when File Explorer opens.
   - Dismiss `[×]` button remains accessible and high-contrast.

---

## 3. Files Modified
- [vite.config.js](file:///D:/Git/gpr-website/vite.config.js): Added `revealInExplorerPlugin` to launch `explorer.exe /select` from local dev server.
- [src/lib/savedLocation.js](file:///D:/Git/gpr-website/src/lib/savedLocation.js): Restored File System Access API silent auto-save; integrated local explorer bridge in `showSavedFolder`.
- [src/components/feedback/AppSnackbar.jsx](file:///D:/Git/gpr-website/src/components/feedback/AppSnackbar.jsx): Streamlined actions to `[SHOW IN FOLDER] [×]`; feedback shows "Opened in Explorer".
- [src/features/salesInvoices/components/InvoiceDetailsDialog.jsx](file:///D:/Git/gpr-website/src/features/salesInvoices/components/InvoiceDetailsDialog.jsx): Formatted export toast with newline and canonical file path.
- [src/features/quotations/components/QuotationDetailsDialog.jsx](file:///D:/Git/gpr-website/src/features/quotations/components/QuotationDetailsDialog.jsx): Formatted export toast with newline and canonical file path.
- [src/features/statements/page.jsx](file:///D:/Git/gpr-website/src/features/statements/page.jsx): Formatted export toast with newline and canonical file path.
- [src/app/providers/NotificationProvider.jsx](file:///D:/Git/gpr-website/src/app/providers/NotificationProvider.jsx): Passes `fileName` and `filePath` cleanly to `AppSnackbar`.

---

## 4. Verification
- **Live Local Explorer Test:** Tested with `C:\Users\USER\Documents\gpr\pdf\GPR-GST-26-27-000106 2026-09-12 The Principal, Govindammal Aditanar College for Women.pdf`. Windows File Explorer successfully opened with the file highlighted.
- **`npm run lint`:** Passed with 0 errors.
- **`npm run build`:** Passed cleanly in 4.07s.

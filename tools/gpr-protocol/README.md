# GPR Windows File Explorer Protocol (`gpr-explorer://`)

This directory contains the lightweight, zero-dependency Windows desktop integration for **GPR Offset Printers**.

It allows the cloud-deployed version of the app (on Vercel or any remote domain) to trigger **Windows File Explorer** on the user's PC with the exact downloaded invoice/statement file auto-selected.

---

## 1. Quick Setup (1-Time per PC)

1. Double-click `register-protocol.bat`.
2. A command window will confirm that `gpr-explorer://` has been registered in Windows Registry (`HKEY_CURRENT_USER`).
   - **No Administrator rights required.**
   - **No UAC prompts.**
   - **No background service or terminal server needed.**
3. On your first click of **Show in folder** in Chrome or Edge:
   - The browser will ask: *"Open GPR File Explorer?"*
   - Check the box: **"Always allow <your-domain> to open links of this type in the associated app"**.
   - Click **Open**.
4. From then on, clicking **Show in folder** instantly opens Windows File Explorer and selects your file.

---

## 2. How It Works

1. In the web app (both local and Vercel cloud deployments), clicking **Show in folder** triggers:
   `gpr-explorer://select?path=<encoded_file_path>`
2. Windows immediately delegates the URI to `gpr-explorer.vbs` via `wscript.exe`.
3. `gpr-explorer.vbs` runs silently without any flashing command prompt, URL-decodes the path, resolves the file in the user's `Documents\gpr\...` folder, and executes:
   `explorer.exe /select,"<resolved_file_path>"`

---

## 3. Uninstallation

If you ever need to remove the protocol handler, simply double-click `unregister-protocol.bat`.

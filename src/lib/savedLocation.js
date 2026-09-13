const DB_NAME = 'GPR_FileSystem_DB';
const STORE_NAME = 'handles';
const KEY_NAME = 'last_save_directory';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Formats a clean, standardized filename for PDF and JPG exports:
 * Pattern: "{Invoice_No} {Invoice_Date} {Customer_Name}.{ext}"
 * e.g. "GPR-GST-26-27-000040 2026-08-22 Sri Meenakshi Traders.pdf"
 */
export function formatExportFileName(invoice, extension = 'pdf') {
  const cleanInvoiceNo = (invoice?.invoice_no || 'INVOICE')
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();

  const cleanDate = (invoice?.invoice_date || new Date().toISOString().split('T')[0])
    .replace(/[/\\?%*:|"<>]/g, '-')
    .trim();

  const cleanCustomerName = (invoice?.customer_name || invoice?.customers?.name || 'Customer')
    .replace(/[/\\?%*:|"<>]/g, '')
    .trim();

  return `${cleanInvoiceNo} ${cleanDate} ${cleanCustomerName}.${extension.toLowerCase()}`;
}

export async function saveSavedDirectoryHandle(handle) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(handle, KEY_NAME);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Failed to save directory handle in IndexedDB:', err);
    return false;
  }
}

export async function getSavedDirectoryHandle() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(KEY_NAME);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Failed to get directory handle from IndexedDB:', err);
    return null;
  }
}

export async function clearSavedDirectoryHandle() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(KEY_NAME);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = (event) => reject(event.target.error);
    });
  } catch (err) {
    console.error('Failed to clear directory handle from IndexedDB:', err);
    return false;
  }
}

/**
 * Checks and requests readwrite permission on a stored directory handle.
 */
export async function verifyDirectoryPermission(dirHandle, readWrite = true) {
  if (!dirHandle) return false;
  const options = {};
  if (readWrite) {
    options.mode = 'readwrite';
  }

  try {
    if ((await dirHandle.queryPermission(options)) === 'granted') {
      return true;
    }
    if ((await dirHandle.requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (err) {
    console.warn('Directory permission request error:', err);
  }
  return false;
}

/**
 * Prompts user to pick the base invoices folder (e.g. C:\gpr_invoices) once.
 * Automatically prepares 'pdf' and 'jpg' subdirectories.
 */
export async function pickAndSaveDirectoryHandle() {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('File System Access API is not supported in this browser.');
  }

  const dirHandle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'documents',
  });

  if (dirHandle) {
    // Automatically create/ensure 'pdf', 'jpg', and 'accounts' subdirectories
    await dirHandle.getDirectoryHandle('pdf', { create: true });
    await dirHandle.getDirectoryHandle('jpg', { create: true });
    await dirHandle.getDirectoryHandle('accounts', { create: true });
    await saveSavedDirectoryHandle(dirHandle);
    return dirHandle;
  }

  return null;
}

/**
 * Writes file directly into the configured local invoice storage folder (Silent Auto-Save).
 * Uses the active directory handle stored in IndexedDB.
 * If no folder has been configured yet, prompts the user to select one once,
 * stores the handle in IndexedDB, and silently writes subsequent exports.
 *
 * @param {Object} options
 * @param {Blob} options.fileBlob - The file data blob (PDF, JPG, or XLSX).
 * @param {string} options.fileName - Structured filename.
 * @param {string} [options.subfolder] - Subfolder name ('pdf', 'jpg', or 'accounts').
 * @returns {Promise<{ success: boolean, method: 'direct' | 'download', baseFolder?: string, fileName: string, path: string }>}
 */
export async function saveExportFile({ fileBlob, fileName, subfolder = 'pdf' }) {
  if (!fileBlob) throw new Error('No file blob provided.');

  // 1. Existing Local Storage System (File System Access API)
  if ('showDirectoryPicker' in window) {
    try {
      let rootDir = await getSavedDirectoryHandle();

      // If no directory configured yet or permission expired, prompt once for setup
      if (!rootDir || !(await verifyDirectoryPermission(rootDir, true))) {
        rootDir = await pickAndSaveDirectoryHandle();
      }

      if (rootDir && (await verifyDirectoryPermission(rootDir, true))) {
        const targetSubdir = await rootDir.getDirectoryHandle(subfolder, { create: true });
        const fileHandle = await targetSubdir.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(fileBlob);
        await writable.close();

        const formattedPath = `${rootDir.name}\\${subfolder}\\${fileName}`;
        return {
          success: true,
          method: 'direct',
          baseFolder: rootDir.name,
          subfolder,
          fileName,
          path: formattedPath,
        };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Folder selection was cancelled. Please configure a local storage folder to save invoices.');
      } else {
        console.error('Direct local storage write failed:', err);
        throw new Error(`Failed to write file to local folder: ${err.message}`);
      }
    }
  }

  // 2. Fallback for legacy browsers without File System Access API
  const url = URL.createObjectURL(fileBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }, 1500);

  return {
    success: true,
    method: 'download',
    fileName,
    path: fileName,
  };
}

/**
 * Opens Windows File Explorer with the saved file auto-selected.
 *
 * Environment Strategy:
 * 1. Local Environment (Vite Dev Server on localhost/127.0.0.1):
 *    Directly calls the Node.js bridge `/api/reveal-in-explorer` which spawns `explorer.exe /select,"..."`.
 *    Inspects Content-Type and HTTP status to prevent SPA fallback confusion.
 *
 * 2. Deployed / Cloud Environment (Vercel, custom domain):
 *    Cloud servers cannot spawn desktop applications on client PCs.
 *    Dispatches the registered Windows protocol `gpr-explorer://select?path=...`.
 *    Also safely copies the path to clipboard as an immediate convenience.
 *    Logs clear, helpful diagnostics to the developer console.
 *
 * 3. Fallback / Diagnostics:
 *    If the endpoint returns non-JSON or fails, logs explicit warnings distinguishing
 *    between "Show in Folder succeeded" vs "Not available in this environment".
 *
 * @param {string} subfolder - 'pdf' | 'jpg' | 'accounts'
 * @param {string} filePath - local file path (e.g. "gpr\\pdf\\filename.pdf")
 * @returns {Promise<{ success: boolean, method: 'explorer' | 'protocol' | 'unavailable' | 'clipboard' | 'unsupported', path: string, message?: string }>}
 */
export async function showSavedFolder(subfolder = '', filePath = '') {
  if (!filePath) {
    return { success: false, method: 'unsupported', path: '' };
  }

  const isLocalHost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  // 1. In Local Development: Use the local Node.js explorer bridge
  if (isLocalHost) {
    try {
      const resp = await fetch(`/api/reveal-in-explorer?path=${encodeURIComponent(filePath)}`);
      const contentType = resp.headers.get('content-type') || '';

      if (resp.ok && contentType.includes('application/json')) {
        const data = await resp.json();
        if (data?.success) {
          console.info('[SavedLocation] Local Explorer bridge opened Windows File Explorer for:', data.path || filePath);
          return { success: true, method: 'explorer', path: data.path || filePath };
        }
      }

      // If the response is not valid JSON (e.g. HTML from a misconfigured server or 404/500)
      if (!contentType.includes('application/json')) {
        console.warn(
          `[SavedLocation] Local Explorer bridge returned non-JSON response (HTTP ${resp.status}, Content-Type: ${contentType}). ` +
          `Ensure the Vite dev server with revealInExplorerPlugin is active.`
        );
      } else {
        const errData = await resp.json().catch(() => null);
        console.warn(`[SavedLocation] Local Explorer bridge failed (HTTP ${resp.status}):`, errData?.error || 'Unknown error');
      }
    } catch (err) {
      console.warn('[SavedLocation] Local Explorer bridge request failed:', err.message);
    }
  }

  // 2. In Deployed / Cloud Environments (or if local bridge was unavailable):
  // Attempt the registered Windows Desktop URI protocol `gpr-explorer://`
  if (typeof window !== 'undefined') {
    try {
      const protocolUrl = `gpr-explorer://select?path=${encodeURIComponent(filePath)}`;
      
      // Dispatch protocol via a hidden iframe to avoid leaving the current page
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = protocolUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        } catch {
          // ignore
        }
      }, 2000);

      // Copy path to clipboard as a reliable safety net
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(filePath).catch(() => {});
      }

      if (!isLocalHost) {
        console.info(
          `[SavedLocation] Deployed environment detected (${window.location.hostname}). ` +
          `Dispatched desktop protocol "gpr-explorer://". ` +
          `If Windows File Explorer did not open, run "tools/gpr-protocol/register-protocol.bat" once on this computer.`
        );
      }

      return {
        success: true,
        method: 'protocol',
        path: filePath,
        message: 'Opening Windows File Explorer via gpr-explorer protocol (path also copied).',
      };
    } catch (protocolErr) {
      console.warn('[SavedLocation] Protocol dispatch error:', protocolErr);
    }
  }

  // 3. Last-resort fallback: copy to clipboard and inform caller of environment restriction
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(filePath);
      console.info('[SavedLocation] Direct Explorer opening unavailable. Copied path to clipboard:', filePath);
      return {
        success: false,
        method: 'unavailable',
        path: filePath,
        message: 'Direct desktop Explorer opening is not supported in this environment. File path copied to clipboard.',
      };
    } catch (err) {
      console.warn('[SavedLocation] Clipboard write error:', err);
    }
  }

  return { success: false, method: 'unsupported', path: filePath };
}




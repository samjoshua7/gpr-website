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
 * Opens Windows File Explorer with the saved file selected (via local bridge),
 * or copies the saved file path to clipboard if running in a remote/pure-browser environment.
 * DOES NOT invoke window.showDirectoryPicker() so no permission dialog appears.
 *
 * @param {string} subfolder - 'pdf' | 'jpg' | 'accounts'
 * @param {string} filePath - local file path (e.g. "gpr\\pdf\\filename.pdf")
 * @returns {Promise<{ success: boolean, method: 'explorer' | 'clipboard' | 'unsupported', path: string }>}
 */
export async function showSavedFolder(subfolder = '', filePath = '') {
  if (filePath) {
    // 1. Try local bridge endpoint (opens Windows File Explorer with file auto-selected)
    try {
      const resp = await fetch(`/api/reveal-in-explorer?path=${encodeURIComponent(filePath)}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success) {
          return { success: true, method: 'explorer', path: data.path || filePath };
        }
      }
    } catch {
      // Local bridge endpoint not reachable in remote/cloud deployment
    }

    // 2. Safe fallback: copy exact path to clipboard
    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(filePath);
        return { success: true, method: 'clipboard', path: filePath };
      } catch (err) {
        console.warn('Clipboard write error:', err);
      }
    }
  }

  return { success: false, method: 'unsupported', path: filePath };
}




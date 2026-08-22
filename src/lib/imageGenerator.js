import html2canvas from 'html2canvas';

/**
 * Generates a high-resolution JPEG Blob from a target HTML DOM Element.
 * @param {HTMLElement} element - The invoice container DOM element.
 * @param {number} scale - Pixel ratio multiplier (default 2.5 for crisp 300 DPI output).
 * @param {number} quality - JPEG compression quality from 0.0 to 1.0 (default 0.95).
 * @returns {Promise<Blob>}
 */
export async function generateInvoiceJpg(element, scale = 2.5, quality = 0.95) {
  if (!element) {
    throw new Error('Invoice printable container element not found.');
  }

  // Clone or capture target element with crisp rendering parameters
  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
    imageTimeout: 15000,
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to generate JPG image blob from canvas.'));
        }
      },
      'image/jpeg',
      quality
    );
  });
}

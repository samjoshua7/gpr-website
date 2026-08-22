import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { amountInWords } from './amountInWords';
import { formatDate } from './formatDate';
import { generateQrDataUrl, buildUpiPaymentUri } from './qrCode';

function loadImageAsBase64(url) {
  if (!url) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve({
          dataUrl: canvas.toDataURL('image/png'),
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      } catch (err) {
        console.warn('Failed to convert image to canvas', err);
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

export async function generateInvoicePdf(invoice, companySettings, paperSize = 'A4') {
  if (!invoice) return null;

  const isA5 = paperSize === 'A5';
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: isA5 ? 'a5' : 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = isA5 ? 8 : 12;
  const contentWidth = pageWidth - margin * 2;

  const isGst = invoice.invoice_type === 'GST';
  const items = invoice.items || [];
  const customer = invoice.customers || {};

  // Financial calculations
  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.unit_price) || 0;
    return sum + q * r;
  }, 0);

  const discountAmount = parseFloat(invoice.discount_amount) || 0;
  const taxableValue = Math.max(0, subtotal - discountAmount);

  const isInterstate = !!invoice.is_interstate;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isGst) {
    items.forEach((item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.unit_price) || 0;
      const itemSubtotal = q * r;
      const itemTaxable = subtotal > 0 ? (itemSubtotal / subtotal) * taxableValue : 0;
      const gstRate = parseFloat(item.gst_rate) || 0;
      const itemTax = (itemTaxable * gstRate) / 100;

      if (isInterstate) {
        igst += itemTax;
      } else {
        cgst += itemTax / 2;
        sgst += itemTax / 2;
      }
    });
  }

  const totalTax = cgst + sgst + igst;
  const grandTotal = parseFloat(invoice.total_amount) || (taxableValue + totalTax);
  const roundOff = grandTotal - (taxableValue + totalTax);

  const formatCurrency = (amt) => {
    return 'INR ' + (amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Load logo and signature images concurrently if available
  const [logoImg, sigImg] = await Promise.all([
    loadImageAsBase64(companySettings?.logo_url),
    loadImageAsBase64(companySettings?.signatory_image_url),
  ]);

  let y = margin + 2;

  // --- Header ---
  // Left side: Company Name, Phone, Email, Address, GSTIN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 12 : 15);
  doc.text(companySettings?.company_name || 'G.P.R Offset Printers', margin, y);

  y += isA5 ? 4.5 : 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 8 : 9.5);
  let contactStr = '';
  if (companySettings?.phone) contactStr += `Phone: ${companySettings.phone}   `;
  if (companySettings?.email) contactStr += `Email: ${companySettings.email}`;
  if (contactStr) {
    doc.text(contactStr, margin, y);
    y += isA5 ? 3.5 : 4.5;
  }

  if (companySettings?.address) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA5 ? 7 : 8.5);
    const addrLines = doc.splitTextToSize(companySettings.address, contentWidth * 0.65);
    doc.text(addrLines, margin, y);
    y += addrLines.length * (isA5 ? 3 : 4);
  }

  if (companySettings?.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 7.5 : 9);
    doc.setTextColor(25, 118, 210);
    doc.text(`GSTIN: ${companySettings.gstin}`, margin, y);
    doc.setTextColor(0, 0, 0);
    y += isA5 ? 4 : 5;
  }

  // Right side: Logo (if available)
  if (logoImg) {
    const maxLogoWidth = isA5 ? 35 : 50;
    const maxLogoHeight = isA5 ? 15 : 20;
    const ratio = Math.min(maxLogoWidth / logoImg.width, maxLogoHeight / logoImg.height);
    const w = logoImg.width * ratio;
    const h = logoImg.height * ratio;
    doc.addImage(logoImg.dataUrl, 'PNG', pageWidth - margin - w, margin, w, h);
  }

  // --- Blue Line & Invoice Title ---
  y = Math.max(y, margin + (isA5 ? 16 : 22));
  doc.setDrawColor(25, 118, 210);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);

  y += isA5 ? 4.5 : 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 10 : 12);
  const title = isGst ? 'TAX INVOICE' : 'RETAIL BILL / INVOICE';
  doc.text(title, pageWidth / 2, y, { align: 'center' });

  y += isA5 ? 3.5 : 4.5;

  // --- Billed To & Invoice Details Cards ---
  const cardWidth = (contentWidth - 4) / 2;
  const cardHeight = isA5 ? 24 : 28;

  // Billed To Box
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, cardWidth, cardHeight, 1, 1);

  let cy = y + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA5 ? 6.5 : 7.5);
  doc.setTextColor(100, 100, 100);
  doc.text('BILLED TO:', margin + 3, cy);

  cy += isA5 ? 3.5 : 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 8 : 9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.customer_name || customer.name || 'N/A', margin + 3, cy);

  if (invoice.billing_address || customer.address) {
    cy += isA5 ? 3.5 : 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA5 ? 6.5 : 7.5);
    const custAddr = doc.splitTextToSize(invoice.billing_address || customer.address, cardWidth - 6);
    doc.text(custAddr[0] || '', margin + 3, cy);
  }

  if (invoice.customer_gstin || customer.gstin) {
    cy += isA5 ? 3.5 : 4;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 6.5 : 7.5);
    doc.setTextColor(25, 118, 210);
    doc.text(`GSTIN: ${invoice.customer_gstin || customer.gstin}`, margin + 3, cy);
    doc.setTextColor(0, 0, 0);
  }

  // Invoice Details Box
  const rightCardX = margin + cardWidth + 4;
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(rightCardX, y, cardWidth, cardHeight, 1, 1);

  cy = y + 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA5 ? 7 : 8);
  doc.setTextColor(100, 100, 100);
  doc.text('Invoice No:', rightCardX + 3, cy);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.invoice_no || '', rightCardX + cardWidth - 3, cy, { align: 'right' });

  cy += isA5 ? 4 : 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Date:', rightCardX + 3, cy);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const formattedDate = formatDate(invoice.invoice_date);
  doc.text(formattedDate, rightCardX + cardWidth - 3, cy, { align: 'right' });

  if (isGst) {
    cy += isA5 ? 4 : 5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Place of Supply:', rightCardX + 3, cy);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(isInterstate ? 'Inter-State' : 'Intra-State', rightCardX + cardWidth - 3, cy, { align: 'right' });
  }

  cy += isA5 ? 4 : 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Status:', rightCardX + 3, cy);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(invoice.status === 'paid' ? 46 : 211, invoice.status === 'paid' ? 125 : 47, invoice.status === 'paid' ? 50 : 47);
  doc.text((invoice.status || 'UNPAID').toUpperCase(), rightCardX + cardWidth - 3, cy, { align: 'right' });
  doc.setTextColor(0, 0, 0);

  y += cardHeight + 4;

  // --- Line Items Table via autoTable ---
  const headCols = ['#', 'Item / Description', ...(isGst ? ['HSN/SAC'] : []), 'Qty', 'Rate', ...(isGst ? ['GST %'] : []), 'Amount'];

  const bodyRows = items.map((item, idx) => {
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.unit_price) || 0;
    const lineTotal = qty * rate;
    const prodName = item.product_name || item.description;
    const desc = item.description && item.description !== prodName ? `\n${item.description}` : '';

    return [
      idx + 1,
      `${prodName}${desc}`,
      ...(isGst ? [item.hsn_code || '-'] : []),
      qty,
      rate.toFixed(2),
      ...(isGst ? [`${item.gst_rate || 0}%`] : []),
      lineTotal.toFixed(2),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [headCols],
    body: bodyRows,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: isA5 ? 7.5 : 8.5,
      cellPadding: isA5 ? 1.5 : 2,
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 'auto' },
      [headCols.length - 1]: { halign: 'right', fontStyle: 'bold' },
    },
  });

  y = doc.lastAutoTable.finalY + 4;

  // --- Totals Summary Box (Right) ---
  const summaryWidth = isA5 ? 65 : 80;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFontSize(isA5 ? 7.5 : 8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', summaryX + 2, y + 4);
  doc.text(formatCurrency(subtotal), summaryX + summaryWidth - 2, y + 4, { align: 'right' });
  y += 5;

  if (discountAmount > 0) {
    doc.setTextColor(211, 47, 47);
    doc.text('Discount:', summaryX + 2, y + 4);
    doc.text(`- ${formatCurrency(discountAmount)}`, summaryX + summaryWidth - 2, y + 4, { align: 'right' });
    doc.setTextColor(0, 0, 0);
    y += 5;
  }

  // NOTE: Taxable Amount display row is REMOVED per Step 3 requirement.

  if (isGst) {
    if (isInterstate) {
      doc.text('IGST:', summaryX + 2, y + 4);
      doc.text(formatCurrency(igst), summaryX + summaryWidth - 2, y + 4, { align: 'right' });
      y += 5;
    } else {
      doc.text('CGST:', summaryX + 2, y + 4);
      doc.text(formatCurrency(cgst), summaryX + summaryWidth - 2, y + 4, { align: 'right' });
      y += 5;
      doc.text('SGST:', summaryX + 2, y + 4);
      doc.text(formatCurrency(sgst), summaryX + summaryWidth - 2, y + 4, { align: 'right' });
      y += 5;
    }
  }

  if (roundOff !== 0) {
    doc.text('Round Off:', summaryX + 2, y + 4);
    doc.text(roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2), summaryX + summaryWidth - 2, y + 4, { align: 'right' });
    y += 5;
  }

  // Draw outline box around summary breakdown
  const summaryBoxHeight = y - (doc.lastAutoTable.finalY + 4) + 2;
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(summaryX, doc.lastAutoTable.finalY + 4, summaryWidth, summaryBoxHeight, 1, 1);

  y += 8;

  // Ensure bottom block doesn't overflow page height
  if (y > pageHeight - (isA5 ? 30 : 40)) {
    doc.addPage();
    y = margin + 10;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  // --- Bottom Block: UPI QR (Left), Grand Total + Amount in Words (Center), Signatory (Right) ---
  const upiUri =
    companySettings?.upi_enabled !== false
      ? buildUpiPaymentUri({
          companySettings,
          amount: grandTotal,
          invoiceNo: invoice.invoice_no,
        })
      : null;

  const qrDataUrl = upiUri ? generateQrDataUrl(upiUri, 150) : null;
  const qrSize = isA5 ? 16 : 20;

  let centerBlockX = margin;
  let centerBlockWidth = contentWidth * 0.58;

  if (qrDataUrl) {
    // Draw QR Code
    doc.addImage(qrDataUrl, 'PNG', margin, y + 2, qrSize, qrSize);

    // Beside QR text info
    const infoX = margin + qrSize + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isA5 ? 6 : 7);
    doc.setTextColor(25, 118, 210);
    doc.text('SCAN TO PAY', infoX, y + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(isA5 ? 4.5 : 5.5);
    doc.setTextColor(100, 100, 100);
    doc.text('UPI • GPay • PhonePe', infoX, y + 7.5);

    if (companySettings?.upi_mode === 'bank_account' && companySettings?.bank_account_no) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isA5 ? 4.5 : 5.5);
      doc.setTextColor(0, 0, 0);
      doc.text(`A/C: ${companySettings.bank_account_no}`, infoX, y + 11);
      doc.setFont('helvetica', 'normal');
      doc.text(`IFSC: ${companySettings.bank_ifsc || ''}`, infoX, y + 14);
    } else {
      const upiText = `UPI: ${companySettings?.upi_id || companySettings?.upi_phone || ''}`;
      const wrappedUpi = doc.splitTextToSize(upiText, isA5 ? 24 : 32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(isA5 ? 4.5 : 5.5);
      doc.setTextColor(0, 0, 0);
      doc.text(wrappedUpi, infoX, y + 11);
    }

    centerBlockX = margin + (isA5 ? 46 : 58);
    centerBlockWidth = contentWidth - (isA5 ? 46 : 58) - (isA5 ? 36 : 44);
  }

  // Grand Total numeric stacked above Amount in Words
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 7 : 8);
  doc.setTextColor(100, 100, 100);
  doc.text('GRAND TOTAL:', centerBlockX, y + 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 11 : 14);
  doc.setTextColor(25, 118, 210);
  doc.text(formatCurrency(grandTotal), centerBlockX, y + (isA5 ? 6.5 : 8));

  const wordsY = y + (isA5 ? 10 : 12.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 6 : 7);
  doc.setTextColor(100, 100, 100);
  doc.text('AMOUNT IN WORDS:', centerBlockX, wordsY);

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(isA5 ? 6.5 : 7.5);
  doc.setTextColor(0, 0, 0);
  const wordsText = doc.splitTextToSize(amountInWords(grandTotal), centerBlockWidth);
  doc.text(wordsText, centerBlockX, wordsY + (isA5 ? 3 : 3.5));

  // Authorized Signatory Block (Right)
  const sigX = pageWidth - margin - (isA5 ? 32 : 38);
  let sigY = y + 2;

  if (sigImg) {
    const maxSigWidth = isA5 ? 28 : 36;
    const maxSigHeight = isA5 ? 10 : 13;
    const sigRatio = Math.min(maxSigWidth / sigImg.width, maxSigHeight / sigImg.height);
    const sw = sigImg.width * sigRatio;
    const sh = sigImg.height * sigRatio;
    doc.addImage(sigImg.dataUrl, 'PNG', sigX + ((isA5 ? 32 : 38) - sw) / 2, sigY, sw, sh);
    sigY += sh + 1;
  } else {
    sigY += isA5 ? 8 : 10;
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(sigX, sigY, sigX + (isA5 ? 32 : 38), sigY);
  sigY += 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isA5 ? 6.5 : 7.5);
  doc.text(companySettings?.signatory_name || 'Authorized Signatory', sigX + (isA5 ? 16 : 19), sigY, { align: 'center' });

  sigY += 2.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isA5 ? 5.5 : 6.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`For ${companySettings?.company_name || 'G.P.R Offset Printers'}`, sigX + (isA5 ? 16 : 19), sigY, { align: 'center' });

  return doc.output('blob');
}

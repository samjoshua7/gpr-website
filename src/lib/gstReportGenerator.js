import * as XLSX from 'xlsx';

/**
 * Standard GST State Code to Name mapping (GSTN Standard)
 */
export const STATE_CODE_MAP = {
  '01': '01-Jammu and Kashmir',
  '02': '02-Himachal Pradesh',
  '03': '03-Punjab',
  '04': '04-Chandigarh',
  '05': '05-Uttarakhand',
  '06': '06-Haryana',
  '07': '07-Delhi',
  '08': '08-Rajasthan',
  '09': '09-Uttar Pradesh',
  '10': '10-Bihar',
  '11': '11-Sikkim',
  '12': '12-Arunachal Pradesh',
  '13': '13-Nagaland',
  '14': '14-Manipur',
  '15': '15-Mizoram',
  '16': '16-Tripura',
  '17': '17-Meghalaya',
  '18': '18-Assam',
  '19': '19-West Bengal',
  '20': '20-Jharkhand',
  '21': '21-Odisha',
  '22': '22-Chhattisgarh',
  '23': '23-Madhya Pradesh',
  '24': '24-Gujarat',
  '26': '26-Dadra and Nagar Haveli and Daman and Diu',
  '27': '27-Maharashtra',
  '28': '28-Andhra Pradesh (Old)',
  '29': '29-Karnataka',
  '30': '30-Goa',
  '31': '31-Lakshadweep',
  '32': '32-Kerala',
  '33': '33-Tamil Nadu',
  '34': '34-Puducherry',
  '35': '35-Andaman and Nicobar Islands',
  '36': '36-Telangana',
  '37': '37-Andhra Pradesh',
  '38': '38-Ladakh',
  '97': '97-Other Territory',
};

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Formats a date string or Date object into GSTN required format: "DD-MMM-YYYY" (e.g. 22-Aug-2026)
 */
export function formatGstnDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Determines Place of Supply (POS) string from GSTIN or interstate flag
 */
export function getPlaceOfSupply(gstin, isInterstate, defaultStateCode = '33') {
  if (gstin && gstin.length >= 2) {
    const code = gstin.substring(0, 2);
    if (STATE_CODE_MAP[code]) return STATE_CODE_MAP[code];
  }
  if (isInterstate) {
    return '97-Other Territory';
  }
  return STATE_CODE_MAP[defaultStateCode] || '33-Tamil Nadu';
}

/**
 * Transforms sales invoice records and line items into official GSTN GSTR-1 datasets.
 */
export function buildGstr1Datasets({ invoices = [], companySettings = {}, startDate = '', endDate = '' }) {
  const companyGstin = companySettings?.gstin || '';
  const defaultStateCode = companyGstin.length >= 2 ? companyGstin.substring(0, 2) : '33';

  // Filter for valid invoices within range
  const filteredInvoices = invoices.filter(inv => {
    if (inv.status === 'void') return false;
    if (startDate && new Date(inv.invoice_date) < new Date(startDate)) return false;
    if (endDate && new Date(inv.invoice_date) > new Date(endDate)) return false;
    return true;
  });

  const b2bRows = [];
  const b2csMap = {}; // Key: `${pos}_${rate}` -> { pos, rate, taxableValue, cess }
  const b2clRows = [];
  const hsnMap = {}; // Key: `${hsn}_${rate}` -> { hsn, description, uqc, qty, totalVal, taxableVal, igst, cgst, sgst, cess }

  let b2bTotalTaxable = 0;
  let b2bTotalGst = 0;
  let b2cTotalTaxable = 0;
  let b2cTotalGst = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  filteredInvoices.forEach(inv => {
    const isGst = inv.invoice_type === 'GST';
    if (!isGst) return; // Only GST invoices are reported in GSTR-1

    const customerGstin = (inv.customer_gstin || inv.customers?.gstin || '').trim().toUpperCase();
    const customerName = (inv.customer_name || inv.customers?.name || 'Customer').trim();
    const invoiceNo = (inv.invoice_no || '').trim();
    const invoiceDate = formatGstnDate(inv.invoice_date);
    const invoiceVal = parseFloat(inv.total_amount || 0);
    const isInterstate = !!inv.is_interstate;
    const pos = getPlaceOfSupply(customerGstin, isInterstate, defaultStateCode);

    const isB2B = inv.customer_type === 'B2B' || (customerGstin && customerGstin.length === 15);

    const items = inv.items && inv.items.length > 0
      ? inv.items
      : [{
          hsn_code: '4911',
          product_name: 'Printing Work',
          description: 'Printing Work',
          quantity: 1,
          gst_rate: parseFloat(inv.total_amount) > 0 ? ((parseFloat(inv.tax_amount || 0) / (parseFloat(inv.total_amount) - parseFloat(inv.tax_amount || 0))) * 100) || 18 : 18,
          amount: parseFloat(inv.total_amount || 0),
          tax_amount: parseFloat(inv.tax_amount || 0),
        }];

    items.forEach(item => {
      const rate = parseFloat(item.gst_rate || 0);
      const lineTotal = parseFloat(item.amount || 0);
      const lineTax = parseFloat(item.tax_amount || 0);
      const taxable = lineTax > 0 && rate > 0
        ? parseFloat((lineTotal - lineTax).toFixed(2))
        : (rate > 0 ? parseFloat((lineTotal / (1 + rate / 100)).toFixed(2)) : lineTotal);

      let itemIgst = 0;
      let itemCgst = 0;
      let itemSgst = 0;

      if (isInterstate) {
        itemIgst = lineTax > 0 ? lineTax : parseFloat(((taxable * rate) / 100).toFixed(2));
        totalIgst += itemIgst;
      } else {
        const halfTax = lineTax > 0 ? lineTax / 2 : parseFloat(((taxable * (rate / 2)) / 100).toFixed(2));
        itemCgst = parseFloat(halfTax.toFixed(2));
        itemSgst = parseFloat(halfTax.toFixed(2));
        totalCgst += itemCgst;
        totalSgst += itemSgst;
      }

      // --- 1. Classify into B2B or B2C ---
      if (isB2B) {
        b2bTotalTaxable += taxable;
        b2bTotalGst += (itemIgst + itemCgst + itemSgst);

        b2bRows.push({
          'GSTIN/UIN of Recipient': customerGstin,
          'Receiver Name': customerName,
          'Invoice Number': invoiceNo,
          'Invoice date': invoiceDate,
          'Invoice Value': invoiceVal,
          'Place Of Supply': pos,
          'Reverse Charge': 'N',
          'Applicable % of Tax Rate': '',
          'Invoice Type': 'Regular',
          'E-Commerce GSTIN': '',
          'Rate': rate,
          'Taxable Value': taxable,
          'Cess Amount': 0.00,
        });
      } else {
        // B2C Invoice
        b2cTotalTaxable += taxable;
        b2cTotalGst += (itemIgst + itemCgst + itemSgst);

        // B2C Large: Inter-State > ₹2,50,000
        if (isInterstate && invoiceVal > 250000) {
          b2clRows.push({
            'Invoice Number': invoiceNo,
            'Invoice date': invoiceDate,
            'Invoice Value': invoiceVal,
            'Place Of Supply': pos,
            'Applicable % of Tax Rate': '',
            'Rate': rate,
            'Taxable Value': taxable,
            'Cess Amount': 0.00,
            'E-Commerce GSTIN': '',
          });
        } else {
          // B2C Small (Aggregated by POS + Rate)
          const key = `${pos}_${rate}`;
          if (!b2csMap[key]) {
            b2csMap[key] = {
              'Type': 'OE',
              'Place Of Supply': pos,
              'Applicable % of Tax Rate': '',
              'Rate': rate,
              'Taxable Value': 0,
              'Cess Amount': 0.00,
              'E-Commerce GSTIN': '',
            };
          }
          b2csMap[key]['Taxable Value'] = parseFloat((b2csMap[key]['Taxable Value'] + taxable).toFixed(2));
        }
      }

      // --- 2. HSN Summary (12) ---
      const rawHsn = (item.hsn_code || '4911').trim();
      const hsnKey = `${rawHsn}_${rate}`;
      const desc = item.product_name || item.description || 'Printing Work';
      const qty = parseFloat(item.quantity || 1);

      if (!hsnMap[hsnKey]) {
        hsnMap[hsnKey] = {
          'HSN': rawHsn,
          'Description': desc,
          'UQC': 'NOS',
          'Total Quantity': 0,
          'Total Value': 0,
          'Taxable Value': 0,
          'Integrated Tax Amount': 0,
          'Central Tax Amount': 0,
          'State/UT Tax Amount': 0,
          'Cess Amount': 0.00,
        };
      }

      hsnMap[hsnKey]['Total Quantity'] += qty;
      hsnMap[hsnKey]['Total Value'] = parseFloat((hsnMap[hsnKey]['Total Value'] + lineTotal).toFixed(2));
      hsnMap[hsnKey]['Taxable Value'] = parseFloat((hsnMap[hsnKey]['Taxable Value'] + taxable).toFixed(2));
      hsnMap[hsnKey]['Integrated Tax Amount'] = parseFloat((hsnMap[hsnKey]['Integrated Tax Amount'] + itemIgst).toFixed(2));
      hsnMap[hsnKey]['Central Tax Amount'] = parseFloat((hsnMap[hsnKey]['Central Tax Amount'] + itemCgst).toFixed(2));
      hsnMap[hsnKey]['State/UT Tax Amount'] = parseFloat((hsnMap[hsnKey]['State/UT Tax Amount'] + itemSgst).toFixed(2));
    });
  });

  const b2csRows = Object.values(b2csMap);
  const hsnRows = Object.values(hsnMap);

  // --- 3. Document Summary (13 - docs) ---
  const allInvoices = invoices.filter(inv => {
    if (startDate && new Date(inv.invoice_date) < new Date(startDate)) return false;
    if (endDate && new Date(inv.invoice_date) > new Date(endDate)) return false;
    return true;
  });

  const validNumbers = allInvoices.map(i => i.invoice_no).filter(Boolean);
  const cancelledCount = allInvoices.filter(i => i.status === 'void').length;
  const docsRows = [
    {
      'Nature of Document': 'Invoices for outward supply',
      'Sr. No. From': validNumbers.length > 0 ? validNumbers[validNumbers.length - 1] : '—',
      'Sr. No. To': validNumbers.length > 0 ? validNumbers[0] : '—',
      'Total Number': allInvoices.length,
      'Cancelled': cancelledCount,
    }
  ];

  return {
    b2b: b2bRows,
    b2cs: b2csRows,
    b2cl: b2clRows,
    hsn: hsnRows,
    docs: docsRows,
    summary: {
      totalGstInvoices: filteredInvoices.length,
      b2bCount: b2bRows.length,
      b2cCount: filteredInvoices.filter(i => i.customer_type !== 'B2B' && !(i.customer_gstin && i.customer_gstin.length === 15)).length,
      b2bTaxable: parseFloat(b2bTotalTaxable.toFixed(2)),
      b2bGst: parseFloat(b2bTotalGst.toFixed(2)),
      b2cTaxable: parseFloat(b2cTotalTaxable.toFixed(2)),
      b2cGst: parseFloat(b2cTotalGst.toFixed(2)),
      totalTaxable: parseFloat((b2bTotalTaxable + b2cTotalTaxable).toFixed(2)),
      totalGst: parseFloat((b2bTotalGst + b2cTotalGst).toFixed(2)),
      cgst: parseFloat(totalCgst.toFixed(2)),
      sgst: parseFloat(totalSgst.toFixed(2)),
      igst: parseFloat(totalIgst.toFixed(2)),
    }
  };
}

/**
 * Generates an Excel Blob for GSTR-1 offline utility upload or individual sheets.
 *
 * @param {Object} datasets - Result of buildGstr1Datasets()
 * @param {'all' | 'b2b' | 'b2cs' | 'hsn'} mode - Export type
 * @returns {Blob}
 */
export function generateGstr1ExcelBlob(datasets, mode = 'all') {
  const wb = XLSX.utils.book_new();

  if (mode === 'all') {
    // 1. b2b sheet
    const wsB2B = XLSX.utils.json_to_sheet(datasets.b2b.length > 0 ? datasets.b2b : [{ 'GSTIN/UIN of Recipient': '' }]);
    XLSX.utils.book_append_sheet(wb, wsB2B, 'b2b');

    // 2. b2cs sheet
    const wsB2CS = XLSX.utils.json_to_sheet(datasets.b2cs.length > 0 ? datasets.b2cs : [{ 'Type': '' }]);
    XLSX.utils.book_append_sheet(wb, wsB2CS, 'b2cs');

    // 3. b2cl sheet
    const wsB2CL = XLSX.utils.json_to_sheet(datasets.b2cl.length > 0 ? datasets.b2cl : [{ 'Invoice Number': '' }]);
    XLSX.utils.book_append_sheet(wb, wsB2CL, 'b2cl');

    // 4. hsn sheet
    const wsHSN = XLSX.utils.json_to_sheet(datasets.hsn.length > 0 ? datasets.hsn : [{ 'HSN': '' }]);
    XLSX.utils.book_append_sheet(wb, wsHSN, 'hsn');

    // 5. docs sheet
    const wsDOCS = XLSX.utils.json_to_sheet(datasets.docs);
    XLSX.utils.book_append_sheet(wb, wsDOCS, 'docs');
  } else if (mode === 'b2b') {
    const ws = XLSX.utils.json_to_sheet(datasets.b2b);
    XLSX.utils.book_append_sheet(wb, ws, 'b2b');
  } else if (mode === 'b2cs') {
    const ws = XLSX.utils.json_to_sheet(datasets.b2cs);
    XLSX.utils.book_append_sheet(wb, ws, 'b2cs');
  } else if (mode === 'hsn') {
    const ws = XLSX.utils.json_to_sheet(datasets.hsn);
    XLSX.utils.book_append_sheet(wb, ws, 'hsn');
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

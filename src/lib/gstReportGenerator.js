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
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Formats a date string or Date object into GSTN required format: "DD-MMM-YYYY" (e.g. 17-Apr-2026)
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
 * Formats date into DD/MM/YYYY format expected by tax-filing Sales Register
 */
export function formatSalesRegisterDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Derives Indian Financial Year string (e.g. "2026-2027") from date
 */
export function getFinancialYear(dateInput) {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '2026-2027';
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  return month >= 4 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

/**
 * Derives Tax Period label (e.g. "Apr 2026" or "Apr 2026 - May 2026")
 */
export function getTaxPeriodLabel(startDate, endDate) {
  if (!startDate) return formatGstnDate(new Date());
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return '';
  const month = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  if (endDate) {
    const dEnd = new Date(endDate);
    if (!isNaN(dEnd.getTime())) {
      if (d.getMonth() === dEnd.getMonth() && d.getFullYear() === dEnd.getFullYear()) {
        return `${month} ${year}`;
      }
      return `${month} ${year} - ${MONTH_NAMES[dEnd.getMonth()]} ${dEnd.getFullYear()}`;
    }
  }
  return `${month} ${year}`;
}

/**
 * Maps unit names to standard GST Unique Quantity Codes (UQC)
 */
export function mapUnitToUqc(unit) {
  if (!unit) return 'PCS-PIECES';
  const u = String(unit).trim().toLowerCase();
  if (u.includes('piece') || u === 'pcs' || u === 'pc') return 'PCS-PIECES';
  if (u.includes('sheet') || u === 'sht') return 'OTH-OTHERS';
  if (u.includes('box') || u === 'pkt' || u === 'pack') return 'BOX-BOXES';
  if (u.includes('kg') || u.includes('kilo')) return 'KGS-KILOGRAMS';
  if (u.includes('meter') || u === 'm' || u === 'mtr') return 'MTR-METRES';
  if (u.includes('set')) return 'SET-SETS';
  if (u.includes('nos') || u.includes('number')) return 'NOS-NUMBERS';
  if (u.includes('ream')) return 'OTH-OTHERS';
  return 'PCS-PIECES';
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
  const companyGstin = (companySettings?.gstin || '').trim().toUpperCase();
  const defaultStateCode = companyGstin.length >= 2 ? companyGstin.substring(0, 2) : '33';
  const legalName = (companySettings?.company_name || 'G.P.R Offset Printers').trim();

  // All invoices in selected date range (including void for document registry)
  const allInvoicesInPeriod = invoices.filter((inv) => {
    if (startDate && new Date(inv.invoice_date) < new Date(startDate)) return false;
    if (endDate && new Date(inv.invoice_date) > new Date(endDate)) return false;
    return true;
  });

  // Active (non-void) invoices for outward supply calculations
  const activeInvoices = allInvoicesInPeriod.filter((inv) => inv.status !== 'void');

  // Datasets
  const b2bMap = {}; // Key: `${invoiceNo}_${rate}`
  const b2csMap = {}; // Key: `${pos}_${rate}`
  const b2clMap = {}; // Key: `${invoiceNo}_${rate}`

  const hsnB2bMap = {}; // Key: `${hsn}_${rate}_${uqc}`
  const hsnB2cMap = {}; // Key: `${hsn}_${rate}_${uqc}`
  const consolidatedHsnMap = {}; // Key: `${hsn}_${rate}_${uqc}`

  // Exempt / Nil-Rated / Non-GST accumulators
  // 1: Inter-State supplies to registered persons
  // 2: Intra-State supplies to registered persons
  // 3: Inter-State supplies to unregistered persons
  // 4: Intra-State supplies to unregistered persons
  const exempCategories = {
    interReg: { nil: 0, exempt: 0, nonGst: 0 },
    intraReg: { nil: 0, exempt: 0, nonGst: 0 },
    interUnreg: { nil: 0, exempt: 0, nonGst: 0 },
    intraUnreg: { nil: 0, exempt: 0, nonGst: 0 },
  };

  let b2bTotalTaxable = 0;
  let b2bTotalIgst = 0;
  let b2bTotalCgst = 0;
  let b2bTotalSgst = 0;
  let b2bTotalInvoiceVal = 0;
  const b2bRecipientsSet = new Set();
  const b2bInvoicesSet = new Set();

  let b2clTotalTaxable = 0;
  let b2clTotalIgst = 0;
  let b2clTotalInvoiceVal = 0;
  const b2clInvoicesSet = new Set();

  let b2csTotalTaxable = 0;
  let b2csTotalValue = 0;
  let b2csTotalIgst = 0;
  let b2csTotalCgst = 0;
  let b2csTotalSgst = 0;

  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  let totalOutwardPeriodTurnover = 0;

  activeInvoices.forEach((inv) => {
    const isGst = inv.invoice_type === 'GST';
    const invoiceVal = parseFloat(inv.total_amount || 0);
    totalOutwardPeriodTurnover += invoiceVal;

    const customerGstin = (inv.customer_gstin || inv.customers?.gstin || '').trim().toUpperCase();
    const customerName = (inv.customer_name || inv.customers?.name || 'Customer').trim();
    const invoiceNo = (inv.invoice_no || '').trim();
    const invoiceDate = formatGstnDate(inv.invoice_date);
    const isInterstate = !!inv.is_interstate;
    const pos = getPlaceOfSupply(customerGstin, isInterstate, defaultStateCode);

    // B2B: explicitly marked or has valid 15-character GSTIN
    const isB2B = inv.customer_type === 'B2B' || (customerGstin && customerGstin.length === 15);

    // Fallback if no line items exist on older invoices
    const items = (inv.items && inv.items.length > 0)
      ? inv.items
      : [{
          hsn_code: '4911',
          product_name: 'Printing Work',
          description: 'Printing Work',
          quantity: 1,
          gst_rate: isGst ? 18 : 0,
          amount: invoiceVal,
          tax_amount: parseFloat(inv.tax_amount || inv.gst_amount || 0),
        }];

    if (!isGst) {
      // Non-GST invoice -> record in exemp
      const categoryKey = isInterstate
        ? (isB2B ? 'interReg' : 'interUnreg')
        : (isB2B ? 'intraReg' : 'intraUnreg');
      exempCategories[categoryKey].nonGst += invoiceVal;
      return;
    }

    // GST Invoice processing
    items.forEach((item) => {
      const rate = parseFloat(item.gst_rate || 0);
      const lineTotal = parseFloat(item.amount || 0);
      const lineTax = parseFloat(item.tax_amount || 0);
      const qty = parseFloat(item.quantity || 1);
      const rawHsn = (item.hsn_code || '4911').trim();
      const desc = (item.product_name || item.description || 'Printing Work').trim();
      const uqc = mapUnitToUqc(item.inventory_item?.unit || item.unit);

      const taxable = lineTax > 0 && rate > 0
        ? parseFloat((lineTotal - lineTax).toFixed(2))
        : (rate > 0 ? parseFloat((lineTotal / (1 + rate / 100)).toFixed(2)) : lineTotal);

      let itemIgst = 0;
      let itemCgst = 0;
      let itemSgst = 0;

      if (rate > 0) {
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
      } else {
        // Zero-rated / Nil-rated supply
        const categoryKey = isInterstate
          ? (isB2B ? 'interReg' : 'interUnreg')
          : (isB2B ? 'intraReg' : 'intraUnreg');
        exempCategories[categoryKey].nil += taxable;
      }

      // 1. Classification: B2B vs B2C
      if (isB2B) {
        b2bTotalTaxable += taxable;
        b2bTotalIgst += itemIgst;
        b2bTotalCgst += itemCgst;
        b2bTotalSgst += itemSgst;

        if (!b2bInvoicesSet.has(invoiceNo)) {
          b2bInvoicesSet.add(invoiceNo);
          b2bTotalInvoiceVal += invoiceVal;
        }
        if (customerGstin) {
          b2bRecipientsSet.add(customerGstin);
        }

        // Group by Invoice Number + Rate
        const b2bKey = `${invoiceNo}_${rate}`;
        if (!b2bMap[b2bKey]) {
          b2bMap[b2bKey] = {
            'GSTIN/UIN of Recipient': customerGstin,
            'Receiver Name': customerName,
            'Invoice Number': invoiceNo,
            'Invoice date': invoiceDate,
            'Invoice Value': invoiceVal,
            'Place Of Supply': pos,
            'Reverse Charge': 'N',
            'Applicable % of Tax Rate': '',
            'Invoice Type': 'Regular B2B',
            'E-Commerce GSTIN': '',
            'Rate': rate,
            'Taxable Value': 0,
            'Cess Amount': 0.00,
          };
        }
        b2bMap[b2bKey]['Taxable Value'] = parseFloat((b2bMap[b2bKey]['Taxable Value'] + taxable).toFixed(2));

        // Accumulate into HSN(B2B)
        accumulateHsn(hsnB2bMap, rawHsn, desc, uqc, qty, lineTotal, rate, taxable, itemIgst, itemCgst, itemSgst);
      } else {
        // B2C
        if (isInterstate && invoiceVal > 250000) {
          // B2C Large
          if (!b2clInvoicesSet.has(invoiceNo)) {
            b2clInvoicesSet.add(invoiceNo);
            b2clTotalInvoiceVal += invoiceVal;
          }
          b2clTotalTaxable += taxable;
          b2clTotalIgst += itemIgst;

          // Group by Invoice Number + Rate
          const b2clKey = `${invoiceNo}_${rate}`;
          if (!b2clMap[b2clKey]) {
            b2clMap[b2clKey] = {
              'Invoice Number': invoiceNo,
              'Invoice date': invoiceDate,
              'Invoice Value': invoiceVal,
              'Place Of Supply': pos,
              'Applicable % of Tax Rate': '',
              'Rate': rate,
              'Taxable Value': 0,
              'Cess Amount': 0.00,
              'E-Commerce GSTIN': '',
            };
          }
          b2clMap[b2clKey]['Taxable Value'] = parseFloat((b2clMap[b2clKey]['Taxable Value'] + taxable).toFixed(2));
        } else {
          // B2C Small (Aggregated by POS + Rate)
          b2csTotalTaxable += taxable;
          b2csTotalValue += lineTotal;
          b2csTotalIgst += itemIgst;
          b2csTotalCgst += itemCgst;
          b2csTotalSgst += itemSgst;

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

        // Accumulate into HSN(B2C)
        accumulateHsn(hsnB2cMap, rawHsn, desc, uqc, qty, lineTotal, rate, taxable, itemIgst, itemCgst, itemSgst);
      }

      // Consolidated across all invoices (itemSummary)
      accumulateHsn(consolidatedHsnMap, rawHsn, desc, uqc, qty, lineTotal, rate, taxable, itemIgst, itemCgst, itemSgst);
    });
  });

  const b2bRows = Object.values(b2bMap);
  const b2clRows = Object.values(b2clMap);
  const b2csRows = Object.values(b2csMap);
  const hsnB2bRows = Object.values(hsnB2bMap);
  const hsnB2cRows = Object.values(hsnB2cMap);
  const itemSummaryRows = Object.values(consolidatedHsnMap);

  // Document Summary (13 - docs)
  // Sort invoices by date then invoice number for numbering range
  const sortedInvoices = [...allInvoicesInPeriod].sort((a, b) => {
    const dComp = new Date(a.invoice_date) - new Date(b.invoice_date);
    if (dComp !== 0) return dComp;
    return String(a.invoice_no || '').localeCompare(String(b.invoice_no || ''), undefined, { numeric: true });
  });

  const validInvoiceNos = sortedInvoices.map((i) => i.invoice_no).filter(Boolean);
  const cancelledCount = allInvoicesInPeriod.filter((i) => i.status === 'void').length;
  const srNoFrom = validInvoiceNos.length > 0 ? validInvoiceNos[0] : '—';
  const srNoTo = validInvoiceNos.length > 0 ? validInvoiceNos[validInvoiceNos.length - 1] : '—';

  const docsRows = [
    {
      'Nature of Document': 'Invoices for outward supply',
      'Sr. No. From': srNoFrom,
      'Sr. No. To': srNoTo,
      'Total Number': allInvoicesInPeriod.length,
      'Cancelled': cancelledCount,
    },
  ];

  // Exemp Rows (8)
  const exempRows = [
    {
      'Description': 'Inter-State supplies to registered persons',
      'Nil Rated Supplies': parseFloat(exempCategories.interReg.nil.toFixed(2)),
      'Exempted (other than nil rated/non GST supply)': parseFloat(exempCategories.interReg.exempt.toFixed(2)),
      'Non-GST Supplies': parseFloat(exempCategories.interReg.nonGst.toFixed(2)),
    },
    {
      'Description': 'Intra-State supplies to registered persons',
      'Nil Rated Supplies': parseFloat(exempCategories.intraReg.nil.toFixed(2)),
      'Exempted (other than nil rated/non GST supply)': parseFloat(exempCategories.intraReg.exempt.toFixed(2)),
      'Non-GST Supplies': parseFloat(exempCategories.intraReg.nonGst.toFixed(2)),
    },
    {
      'Description': 'Inter-State supplies to unregistered persons',
      'Nil Rated Supplies': parseFloat(exempCategories.interUnreg.nil.toFixed(2)),
      'Exempted (other than nil rated/non GST supply)': parseFloat(exempCategories.interUnreg.exempt.toFixed(2)),
      'Non-GST Supplies': parseFloat(exempCategories.interUnreg.nonGst.toFixed(2)),
    },
    {
      'Description': 'Intra-State supplies to unregistered persons',
      'Nil Rated Supplies': parseFloat(exempCategories.intraUnreg.nil.toFixed(2)),
      'Exempted (other than nil rated/non GST supply)': parseFloat(exempCategories.intraUnreg.exempt.toFixed(2)),
      'Non-GST Supplies': parseFloat(exempCategories.intraUnreg.nonGst.toFixed(2)),
    },
  ];

  const exempSummary = {
    totalNilRated: parseFloat((exempCategories.interReg.nil + exempCategories.intraReg.nil + exempCategories.interUnreg.nil + exempCategories.intraUnreg.nil).toFixed(2)),
    totalExempted: 0.00,
    totalNonGst: parseFloat((exempCategories.interReg.nonGst + exempCategories.intraReg.nonGst + exempCategories.interUnreg.nonGst + exempCategories.intraUnreg.nonGst).toFixed(2)),
  };

  const periodLabel = getTaxPeriodLabel(startDate, endDate);
  const financialYear = getFinancialYear(startDate || new Date());

  const b2bTotalGst = b2bTotalIgst + b2bTotalCgst + b2bTotalSgst;
  const b2csTotalGst = b2csTotalIgst + b2csTotalCgst + b2csTotalSgst;
  const b2cTotalTaxable = b2csTotalTaxable + b2clTotalTaxable;
  const b2cTotalGst = b2csTotalGst + b2clTotalIgst;

  // Chronologically sorted active invoices for Sales Register
  const sortedActiveInvoices = [...activeInvoices].sort((a, b) => {
    const dComp = new Date(a.invoice_date) - new Date(b.invoice_date);
    if (dComp !== 0) return dComp;
    return String(a.invoice_no || '').localeCompare(String(b.invoice_no || ''), undefined, { numeric: true });
  });

  const salesRegisterRows = [];
  let salesRegisterTotalTaxable = 0;
  let salesRegisterTotalValue = 0;

  sortedActiveInvoices.forEach((inv) => {
    const customerGstin = (inv.customer_gstin || inv.customers?.gstin || '').trim().toUpperCase();
    const customerName = (inv.customer_name || inv.customers?.name || 'Customer').trim();
    const invoiceNo = (inv.invoice_no || '').trim();
    const invoiceDate = formatSalesRegisterDate(inv.invoice_date);
    const invoiceVal = parseFloat(inv.total_amount || 0);
    const isGst = inv.invoice_type === 'GST';

    salesRegisterTotalValue += invoiceVal;

    const items = (inv.items && inv.items.length > 0)
      ? inv.items
      : [{
          hsn_code: '4911',
          product_name: 'Printing Work',
          description: 'Printing Work',
          quantity: 1,
          gst_rate: isGst ? 18 : 0,
          amount: invoiceVal,
          tax_amount: parseFloat(inv.tax_amount || inv.gst_amount || 0),
        }];

    if (!isGst) {
      salesRegisterTotalTaxable += invoiceVal;
      salesRegisterRows.push({
        'GSTIN/UIN': customerGstin || '',
        'Party Name': customerName,
        'Transaction Type': 'Sale',
        'Invoice No.': invoiceNo,
        'Invoice Date': invoiceDate,
        'Invoice Value': invoiceVal,
        'Rate': 0,
        'Cess Rate': 0,
        'Taxable Value': invoiceVal,
      });
      return;
    }

    // GST Invoice: Group items by tax rate to handle multi-rate invoices accurately
    const invRateMap = {};
    items.forEach((item) => {
      const rate = parseFloat(item.gst_rate || 0);
      const lineTotal = parseFloat(item.amount || 0);
      const lineTax = parseFloat(item.tax_amount || 0);
      const taxable = lineTax > 0 && rate > 0
        ? parseFloat((lineTotal - lineTax).toFixed(2))
        : (rate > 0 ? parseFloat((lineTotal / (1 + rate / 100)).toFixed(2)) : lineTotal);

      if (!invRateMap[rate]) {
        invRateMap[rate] = 0;
      }
      invRateMap[rate] = parseFloat((invRateMap[rate] + taxable).toFixed(2));
    });

    Object.entries(invRateMap).forEach(([rStr, taxableAmt]) => {
      salesRegisterTotalTaxable += taxableAmt;
      salesRegisterRows.push({
        'GSTIN/UIN': customerGstin || '',
        'Party Name': customerName,
        'Transaction Type': 'Sale',
        'Invoice No.': invoiceNo,
        'Invoice Date': invoiceDate,
        'Invoice Value': invoiceVal,
        'Rate': parseFloat(rStr),
        'Cess Rate': 0,
        'Taxable Value': taxableAmt,
      });
    });
  });

  return {
    // Primary tables
    salesRegister: salesRegisterRows,
    b2b: b2bRows,
    b2cs: b2csRows,
    b2cl: b2clRows,
    cdnr: [],
    cdnur: [],
    exp: [],
    at: [],
    atadj: [],
    hsn: itemSummaryRows, // For backwards compatibility with UI
    hsnB2b: hsnB2bRows,
    hsnB2c: hsnB2cRows,
    itemSummary: itemSummaryRows,
    docs: docsRows,
    exemp: exempRows,
    exempSummary,

    // Metadata & Summary Metrics
    companyInfo: {
      gstin: companyGstin,
      legalName,
      tradeName: legalName,
      financialYear,
      periodLabel,
      totalOutwardPeriodTurnover: parseFloat(totalOutwardPeriodTurnover.toFixed(2)),
    },

    summary: {
      salesRegisterCount: salesRegisterRows.length,
      salesRegisterInvoiceCount: sortedActiveInvoices.length,
      salesRegisterTotalValue: parseFloat(salesRegisterTotalValue.toFixed(2)),
      salesRegisterTaxable: parseFloat(salesRegisterTotalTaxable.toFixed(2)),
      totalGstInvoices: activeInvoices.filter((i) => i.invoice_type === 'GST').length,
      b2bCount: b2bRows.length,
      b2bInvoiceCount: b2bInvoicesSet.size,
      b2bRecipientsCount: b2bRecipientsSet.size,
      b2bInvoiceValue: parseFloat(b2bTotalInvoiceVal.toFixed(2)),
      b2bTaxable: parseFloat(b2bTotalTaxable.toFixed(2)),
      b2bIgst: parseFloat(b2bTotalIgst.toFixed(2)),
      b2bCgst: parseFloat(b2bTotalCgst.toFixed(2)),
      b2bSgst: parseFloat(b2bTotalSgst.toFixed(2)),
      b2bGst: parseFloat(b2bTotalGst.toFixed(2)),

      b2clCount: b2clRows.length,
      b2clInvoiceCount: b2clInvoicesSet.size,
      b2clInvoiceValue: parseFloat(b2clTotalInvoiceVal.toFixed(2)),
      b2clTaxable: parseFloat(b2clTotalTaxable.toFixed(2)),
      b2clIgst: parseFloat(b2clTotalIgst.toFixed(2)),

      b2csCount: b2csRows.length,
      b2csTaxable: parseFloat(b2csTotalTaxable.toFixed(2)),
      b2csTotalValue: parseFloat(b2csTotalValue.toFixed(2)),
      b2csIgst: parseFloat(b2csTotalIgst.toFixed(2)),
      b2csCgst: parseFloat(b2csTotalCgst.toFixed(2)),
      b2csSgst: parseFloat(b2csTotalSgst.toFixed(2)),
      b2csGst: parseFloat(b2csTotalGst.toFixed(2)),

      b2cCount: b2csRows.length + b2clRows.length,
      b2cTaxable: parseFloat(b2cTotalTaxable.toFixed(2)),
      b2cGst: parseFloat(b2cTotalGst.toFixed(2)),

      totalTaxable: parseFloat((b2bTotalTaxable + b2clTotalTaxable + b2csTotalTaxable).toFixed(2)),
      totalGst: parseFloat((totalIgst + totalCgst + totalSgst).toFixed(2)),
      cgst: parseFloat(totalCgst.toFixed(2)),
      sgst: parseFloat(totalSgst.toFixed(2)),
      igst: parseFloat(totalIgst.toFixed(2)),
      totalDocs: allInvoicesInPeriod.length,
      cancelledDocs: cancelledCount,
    },
  };
}

function accumulateHsn(targetMap, rawHsn, desc, uqc, qty, lineTotal, rate, taxable, igst, cgst, sgst) {
  const key = `${rawHsn}_${rate}_${uqc}`;
  if (!targetMap[key]) {
    targetMap[key] = {
      'HSN': rawHsn,
      'Description': desc,
      'UQC': uqc,
      'Total Quantity': 0,
      'Total Value': 0,
      'Rate': rate,
      'Taxable Value': 0,
      'Integrated Tax Amount': 0,
      'Central Tax Amount': 0,
      'State/UT Tax Amount': 0,
      'Cess Amount': 0.00,
    };
  }

  targetMap[key]['Total Quantity'] = parseFloat((targetMap[key]['Total Quantity'] + qty).toFixed(2));
  targetMap[key]['Total Value'] = parseFloat((targetMap[key]['Total Value'] + lineTotal).toFixed(2));
  targetMap[key]['Taxable Value'] = parseFloat((targetMap[key]['Taxable Value'] + taxable).toFixed(2));
  targetMap[key]['Integrated Tax Amount'] = parseFloat((targetMap[key]['Integrated Tax Amount'] + igst).toFixed(2));
  targetMap[key]['Central Tax Amount'] = parseFloat((targetMap[key]['Central Tax Amount'] + cgst).toFixed(2));
  targetMap[key]['State/UT Tax Amount'] = parseFloat((targetMap[key]['State/UT Tax Amount'] + sgst).toFixed(2));
}

/**
 * Builds an Excel worksheet using SheetJS AOA with optional column width configuration
 */
function createWorksheetFromAoa(aoa, colWidths = []) {
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  if (colWidths.length > 0) {
    ws['!cols'] = colWidths.map((w) => ({ wch: w }));
  }
  return ws;
}

/**
 * Calculates sums for HSN rows
 */
function summarizeHsnRows(rows) {
  let totalVal = 0;
  let totalTaxable = 0;
  let totalIgst = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  rows.forEach((r) => {
    totalVal += parseFloat(r['Total Value'] || 0);
    totalTaxable += parseFloat(r['Taxable Value'] || 0);
    totalIgst += parseFloat(r['Integrated Tax Amount'] || 0);
    totalCgst += parseFloat(r['Central Tax Amount'] || 0);
    totalSgst += parseFloat(r['State/UT Tax Amount'] || 0);
  });
  return {
    count: rows.length,
    totalVal: parseFloat(totalVal.toFixed(2)),
    taxable: parseFloat(totalTaxable.toFixed(2)),
    igst: parseFloat(totalIgst.toFixed(2)),
    cgst: parseFloat(totalCgst.toFixed(2)),
    sgst: parseFloat(totalSgst.toFixed(2)),
  };
}

/**
 * Generates an Excel Blob matching the GSTR-1 reference workbook (14 sheets) or individual sheets.
 *
 * @param {Object} datasets - Result of buildGstr1Datasets()
 * @param {'all' | 'b2b' | 'b2cs' | 'hsn'} mode - Export type
 * @returns {Blob}
 */
export function generateGstr1ExcelBlob(datasets, mode = 'all') {
  const wb = XLSX.utils.book_new();
  const { summary, companyInfo } = datasets;
  const itemSummaryTotals = summarizeHsnRows(datasets.itemSummary);

  // Helper builders for each of the 14 sheets

  // 1. Cover Summary Sheet
  function buildCoverSheet() {
    const aoa = [
      ['GSTR-1 - Details of outward supplies of goods or services'],
      [],
      ['Year', companyInfo.financialYear, 'Tax Period', companyInfo.periodLabel],
      ['1. GSTIN', companyInfo.gstin],
      ['2.a Legal name of the registered person.', companyInfo.legalName],
      ['2.b Trade name, if any', companyInfo.tradeName],
      ['3.a Aggregate turnover of the preceeding Financial Year', 0.00],
      ['3.b Aggregate turnover for the period', companyInfo.totalOutwardPeriodTurnover],
      [],
      ['Summary of Outward Supplies'],
      ['Section', 'Description', 'No. of Records', 'Total Value', 'Taxable Value', 'Integrated Tax', 'Central Tax', 'State/UT Tax', 'Cess'],
      ['4A, 4B, 4C, 6B, 6C - B2B Invoices', 'Supplies to registered persons', summary.b2bInvoiceCount, summary.b2bInvoiceValue, summary.b2bTaxable, summary.b2bIgst, summary.b2bCgst, summary.b2bSgst, 0.00],
      ['5A, 5B - B2C Large', 'Inter-state supplies to unregistered persons > 2.5 Lakhs', summary.b2clInvoiceCount, summary.b2clInvoiceValue, summary.b2clTaxable, summary.b2clIgst, 0.00, 0.00, 0.00],
      ['7 - B2C Small', 'Other supplies to unregistered persons', summary.b2csCount, summary.b2csTotalValue, summary.b2csTaxable, summary.b2csIgst, summary.b2csCgst, summary.b2csSgst, 0.00],
      ['9B - CDNR', 'Credit/Debit Notes to registered persons', 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      ['9B - CDNUR', 'Credit/Debit Notes to unregistered persons', 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      ['6A - EXP', 'Export Invoices', 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      ['11A(1), 11A(2) - AT', 'Advance Received', 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      ['11B(1), 11B(2) - ATADJ', 'Advance Adjusted', 0, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
      ['8 - EXEMP', 'Nil rated, exempted and non GST outward supplies', 4, datasets.exempSummary.totalNilRated + datasets.exempSummary.totalNonGst, datasets.exempSummary.totalNilRated + datasets.exempSummary.totalNonGst, 0.00, 0.00, 0.00, 0.00],
      ['12 - HSN', 'HSN-wise summary of outward supplies', datasets.itemSummary.length, itemSummaryTotals.totalVal, itemSummaryTotals.taxable, summary.igst, summary.cgst, summary.sgst, 0.00],
      ['13 - DOCS', 'Documents issued during the tax period', summary.totalDocs, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00],
    ];
    return createWorksheetFromAoa(aoa, [35, 45, 16, 16, 16, 16, 16, 16, 12]);
  }

  // 2. B2B Sheet (b2b,sez,de)
  function buildB2bSheet() {
    const aoa = [
      ['Summary For B2B, SEZ, DE (4A, 4B, 4C, 6B, 6C)'],
      ['No. of Recipients', 'No. of Invoices', 'Total Invoice Value', 'Total Taxable Value', 'Total Cess'],
      [summary.b2bRecipientsCount, summary.b2bInvoiceCount, summary.b2bInvoiceValue, summary.b2bTaxable, 0.00],
      [],
      [
        'GSTIN/UIN of Recipient',
        'Receiver Name',
        'Invoice Number',
        'Invoice date',
        'Invoice Value',
        'Place Of Supply',
        'Reverse Charge',
        'Applicable % of Tax Rate',
        'Invoice Type',
        'E-Commerce GSTIN',
        'Rate',
        'Taxable Value',
        'Cess Amount',
      ],
      ...datasets.b2b.map((r) => [
        r['GSTIN/UIN of Recipient'],
        r['Receiver Name'],
        r['Invoice Number'],
        r['Invoice date'],
        r['Invoice Value'],
        r['Place Of Supply'],
        r['Reverse Charge'],
        r['Applicable % of Tax Rate'],
        r['Invoice Type'],
        r['E-Commerce GSTIN'],
        r['Rate'],
        r['Taxable Value'],
        r['Cess Amount'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [18, 28, 16, 14, 14, 18, 14, 14, 16, 18, 10, 14, 12]);
  }

  // 3. B2CL Sheet
  function buildB2clSheet() {
    const aoa = [
      ['Summary For B2CL (5A, 5B)'],
      ['No. of Invoices', 'Total Invoice Value', 'Total Taxable Value', 'Total Cess'],
      [summary.b2clInvoiceCount, summary.b2clInvoiceValue, summary.b2clTaxable, 0.00],
      [],
      [
        'Invoice Number',
        'Invoice date',
        'Invoice Value',
        'Place Of Supply',
        'Applicable % of Tax Rate',
        'Rate',
        'Taxable Value',
        'Cess Amount',
        'E-Commerce GSTIN',
      ],
      ...datasets.b2cl.map((r) => [
        r['Invoice Number'],
        r['Invoice date'],
        r['Invoice Value'],
        r['Place Of Supply'],
        r['Applicable % of Tax Rate'],
        r['Rate'],
        r['Taxable Value'],
        r['Cess Amount'],
        r['E-Commerce GSTIN'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [16, 14, 14, 18, 14, 10, 14, 12, 18]);
  }

  // 4. B2CS Sheet
  function buildB2csSheet() {
    const aoa = [
      ['Summary For B2CS (7)'],
      ['Total Taxable Value', 'Total Cess'],
      [summary.b2csTaxable, 0.00],
      [],
      [
        'Type',
        'Place Of Supply',
        'Applicable % of Tax Rate',
        'Rate',
        'Taxable Value',
        'Cess Amount',
        'E-Commerce GSTIN',
      ],
      ...datasets.b2cs.map((r) => [
        r['Type'],
        r['Place Of Supply'],
        r['Applicable % of Tax Rate'],
        r['Rate'],
        r['Taxable Value'],
        r['Cess Amount'],
        r['E-Commerce GSTIN'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [10, 20, 14, 10, 14, 12, 18]);
  }

  // 5. CDNR Sheet
  function buildCdnrSheet() {
    const aoa = [
      ['Summary For CDNR (9B)'],
      ['No. of Recipients', 'No. of Notes', 'Total Note Value', 'Total Taxable Value', 'Total Cess'],
      [0, 0, 0.00, 0.00, 0.00],
      [],
      [
        'GSTIN/UIN of Recipient',
        'Receiver Name',
        'Note Number',
        'Note Date',
        'Note Type',
        'Place Of Supply',
        'Reverse Charge',
        'Note Supply Type',
        'Note Value',
        'Applicable % of Tax Rate',
        'Rate',
        'Taxable Value',
        'Cess Amount',
      ],
    ];
    return createWorksheetFromAoa(aoa, [18, 26, 16, 14, 12, 18, 14, 16, 14, 14, 10, 14, 12]);
  }

  // 6. CDNUR Sheet
  function buildCdnurSheet() {
    const aoa = [
      ['Summary For CDNUR (9B)'],
      ['No. of Notes/Vouchers', 'Total Note Value', 'Total Taxable Value', 'Total Cess'],
      [0, 0.00, 0.00, 0.00],
      [],
      [
        'UR Type',
        'Note Number',
        'Note Date',
        'Note Type',
        'Place Of Supply',
        'Note Value',
        'Applicable % of Tax Rate',
        'Rate',
        'Taxable Value',
        'Cess Amount',
      ],
    ];
    return createWorksheetFromAoa(aoa, [12, 16, 14, 12, 18, 14, 14, 10, 14, 12]);
  }

  // 7. EXP Sheet
  function buildExpSheet() {
    const aoa = [
      ['Summary For EXP (6A)'],
      ['No. of Invoices', 'Total Invoice Value', 'No. of Shipping Bill', 'Total Taxable Value'],
      [0, 0.00, 0, 0.00],
      [],
      [
        'Export Type',
        'Invoice Number',
        'Invoice date',
        'Invoice Value',
        'Port Code',
        'Shipping Bill Number',
        'Shipping Bill Date',
        'Rate',
        'Taxable Value',
      ],
    ];
    return createWorksheetFromAoa(aoa, [14, 16, 14, 14, 12, 20, 16, 10, 14]);
  }

  // 8. AT Sheet (Advance Received)
  function buildAtSheet() {
    const aoa = [
      ['Summary For AT (11A(1), 11A(2))'],
      ['Total Advance Received', 'Total Cess'],
      [0.00, 0.00],
      [],
      [
        'Place Of Supply',
        'Applicable % of Tax Rate',
        'Rate',
        'Gross Advance Received',
        'Cess Amount',
      ],
    ];
    return createWorksheetFromAoa(aoa, [20, 14, 10, 18, 12]);
  }

  // 9. ATADJ Sheet (Advance Adjusted)
  function buildAtadjSheet() {
    const aoa = [
      ['Summary For ATADJ (11B(1), 11B(2))'],
      ['Total Advance Adjusted', 'Total Cess'],
      [0.00, 0.00],
      [],
      [
        'Place Of Supply',
        'Applicable % of Tax Rate',
        'Rate',
        'Gross Advance Adjusted',
        'Cess Amount',
      ],
    ];
    return createWorksheetFromAoa(aoa, [20, 14, 10, 18, 12]);
  }

  // 10. EXEMP Sheet
  function buildExempSheet() {
    const aoa = [
      ['Summary For Nil rated, exempted and non GST outward supplies (8)'],
      ['Total Nil Rated Supplies', 'Total Exempted Supplies', 'Total Non-GST Supplies'],
      [datasets.exempSummary.totalNilRated, datasets.exempSummary.totalExempted, datasets.exempSummary.totalNonGst],
      [],
      [
        'Description',
        'Nil Rated Supplies',
        'Exempted (other than nil rated/non GST supply)',
        'Non-GST Supplies',
      ],
      ...datasets.exemp.map((r) => [
        r['Description'],
        r['Nil Rated Supplies'],
        r['Exempted (other than nil rated/non GST supply)'],
        r['Non-GST Supplies'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [45, 20, 24, 20]);
  }

  // Generic HSN table builder
  function buildGenericHsnSheet(title, rows) {
    const s = summarizeHsnRows(rows);
    const aoa = [
      [title],
      ['No. of HSN', 'Total Value', 'Total Taxable Value', 'Total Integrated Tax', 'Total Central Tax', 'Total State/UT Tax', 'Total Cess'],
      [s.count, s.totalVal, s.taxable, s.igst, s.cgst, s.sgst, 0.00],
      [],
      [
        'HSN',
        'Description',
        'UQC',
        'Total Quantity',
        'Total Value',
        'Rate',
        'Taxable Value',
        'Integrated Tax Amount',
        'Central Tax Amount',
        'State/UT Tax Amount',
        'Cess Amount',
      ],
      ...rows.map((r) => [
        r['HSN'],
        r['Description'],
        r['UQC'],
        r['Total Quantity'],
        r['Total Value'],
        r['Rate'],
        r['Taxable Value'],
        r['Integrated Tax Amount'],
        r['Central Tax Amount'],
        r['State/UT Tax Amount'],
        r['Cess Amount'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [12, 28, 14, 14, 14, 10, 14, 16, 16, 16, 12]);
  }

  // 14. Document Summary Sheet
  function buildDocsSheet() {
    const aoa = [
      ['Summary of documents issued during the tax period (13)'],
      [],
      [
        'Nature of Document',
        'Sr. No. From',
        'Sr. No. To',
        'Total Number',
        'Cancelled',
      ],
      ...datasets.docs.map((r) => [
        r['Nature of Document'],
        r['Sr. No. From'],
        r['Sr. No. To'],
        r['Total Number'],
        r['Cancelled'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [32, 18, 18, 14, 14]);
  }

  // 1b. Sales Register Sheet (All Outward Supplies - Transaction Level)
  function buildSalesRegisterSheet() {
    const aoa = [
      [
        'GSTIN/UIN',
        'Party Name',
        'Transaction Type',
        'Invoice No.',
        'Invoice Date',
        'Invoice Value',
        'Rate',
        'Cess Rate',
        'Taxable Value',
      ],
      ...(datasets.salesRegister || []).map((r) => [
        r['GSTIN/UIN'],
        r['Party Name'],
        r['Transaction Type'],
        r['Invoice No.'],
        r['Invoice Date'],
        r['Invoice Value'],
        r['Rate'],
        r['Cess Rate'],
        r['Taxable Value'],
      ]),
    ];
    return createWorksheetFromAoa(aoa, [18, 35, 16, 16, 14, 16, 10, 10, 16]);
  }

  // Append sheets based on mode
  if (mode === 'all') {
    // 15 sheets including complete transaction Sales Register + 14 statutory portal sheets
    XLSX.utils.book_append_sheet(wb, buildCoverSheet(), 'GSTR1 Report');
    XLSX.utils.book_append_sheet(wb, buildSalesRegisterSheet(), 'Sales Register');
    XLSX.utils.book_append_sheet(wb, buildB2bSheet(), 'b2b,sez,de');
    XLSX.utils.book_append_sheet(wb, buildB2clSheet(), 'b2cl');
    XLSX.utils.book_append_sheet(wb, buildB2csSheet(), 'b2cs');
    XLSX.utils.book_append_sheet(wb, buildCdnrSheet(), 'cdnr');
    XLSX.utils.book_append_sheet(wb, buildCdnurSheet(), 'cdnur');
    XLSX.utils.book_append_sheet(wb, buildExpSheet(), 'exp');
    XLSX.utils.book_append_sheet(wb, buildAtSheet(), 'at');
    XLSX.utils.book_append_sheet(wb, buildAtadjSheet(), 'atadj');
    XLSX.utils.book_append_sheet(wb, buildExempSheet(), 'exemp');
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For HSN(B2B) (12)', datasets.hsnB2b), 'hsn(b2b)');
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For HSN(B2C) (12)', datasets.hsnB2c), 'hsn(b2c)');
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For Consolidated Item / HSN (12)', datasets.itemSummary), 'itemSummary');
    XLSX.utils.book_append_sheet(wb, buildDocsSheet(), 'docs');
  } else if (mode === 'sales_register') {
    XLSX.utils.book_append_sheet(wb, buildSalesRegisterSheet(), 'Sales Register');
  } else if (mode === 'b2b') {
    XLSX.utils.book_append_sheet(wb, buildB2bSheet(), 'b2b,sez,de');
  } else if (mode === 'b2cs') {
    XLSX.utils.book_append_sheet(wb, buildB2csSheet(), 'b2cs');
  } else if (mode === 'hsn') {
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For Consolidated Item / HSN (12)', datasets.itemSummary), 'itemSummary');
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For HSN(B2B) (12)', datasets.hsnB2b), 'hsn(b2b)');
    XLSX.utils.book_append_sheet(wb, buildGenericHsnSheet('Summary For HSN(B2C) (12)', datasets.hsnB2c), 'hsn(b2c)');
  }

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

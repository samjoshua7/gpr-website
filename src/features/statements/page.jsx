import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  TextField,
  Autocomplete,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  TablePagination,
  Card,
  CardContent,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';

import {
  fetchTransactionsReportApi,
  fetchCustomerStatementReportApi,
  fetchGstrReportDataApi,
  getStatementCustomers,
} from './api';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SearchInput } from '../../components/ui/SearchInput';
import PageToolbar from '../../components/layout/PageToolbar';
import { HighlightText } from '../../components/ui/HighlightText';
import { formatDate } from '../../lib/formatDate';
import { buildGstr1Datasets, generateGstr1ExcelBlob } from '../../lib/gstReportGenerator';
import { saveExportFile } from '../../lib/savedLocation';
import AppSnackbar from '../../components/feedback/AppSnackbar';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

const getLocalDateString = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultDateRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  return {
    from: getLocalDateString(start),
    to: getLocalDateString(end),
  };
};

export const StatementsPage = () => {
  // Navigation: 0: All Transactions, 1: Customer Statement, 2: GSTR Reports
  const [tabIndex, setTabIndex] = useState(0);

  // Customer options for selector
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // --- TAB 0: ALL TRANSACTIONS STATE ---
  const [allTxFromDate, setAllTxFromDate] = useState(() => getDefaultDateRange().from);
  const [allTxToDate, setAllTxToDate] = useState(() => getDefaultDateRange().to);
  const [allTxStatusFilter, setAllTxStatusFilter] = useState('all');
  const [allTxSortOrder, setAllTxSortOrder] = useState('newest');
  const [allTxSearch, setAllTxSearch] = useState('');
  const [allTxPage, setAllTxPage] = useState(0);
  const [allTxRowsPerPage, setAllTxRowsPerPage] = useState(25);

  const [allTxReport, setAllTxReport] = useState(null); // { rows, fromDate, toDate }
  const [allTxLoading, setAllTxLoading] = useState(false);
  const [allTxError, setAllTxError] = useState(null);

  // --- TAB 1: CUSTOMER STATEMENT STATE ---
  const [custSelectedCustomer, setCustSelectedCustomer] = useState(null);
  const [custFromDate, setCustFromDate] = useState(() => getDefaultDateRange().from);
  const [custToDate, setCustToDate] = useState(() => getDefaultDateRange().to);
  const [custStatusFilter, setCustStatusFilter] = useState('all');
  const [custSortOrder, setCustSortOrder] = useState('newest');
  const [custSearch, setCustSearch] = useState('');
  const [custPage, setCustPage] = useState(0);
  const [custRowsPerPage, setCustRowsPerPage] = useState(25);

  const [custReport, setCustReport] = useState(null); // { customer, rows, fromDate, toDate, totalInvoiced, totalReceived, netBalance }
  const [custLoading, setCustLoading] = useState(false);
  const [custError, setCustError] = useState(null);

  // --- TAB 2: GSTR REPORTS STATE ---
  const [gstrFromDate, setGstrFromDate] = useState(() => getDefaultDateRange().from);
  const [gstrToDate, setGstrToDate] = useState(() => getDefaultDateRange().to);
  const [gstrSubTab, setGstrSubTab] = useState(0); // 0: Sales Register, 1: B2B, 2: B2CL, 3: B2CS, 4: CDNR/CDNUR, 5: EXP/AT, 6: EXEMP, 7: HSN, 8: Docs
  const [gstrHsnType, setGstrHsnType] = useState('consolidated'); // 'consolidated' | 'b2b' | 'b2c'

  const [gstrReport, setGstrReport] = useState(null); // { datasets, fromDate, toDate, periodLabel }
  const [gstrLoading, setGstrLoading] = useState(false);
  const [gstrError, setGstrError] = useState(null);
  const [exportingGst, setExportingGst] = useState(false);

  // Toast feedback
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastBlob, setToastBlob] = useState(null);
  const [toastPath, setToastPath] = useState('');

  // Load lightweight customer list once on mount (only id, name, phone, gstin, opening_balance)
  useEffect(() => {
    let isMounted = true;
    setLoadingCustomers(true);
    getStatementCustomers()
      .then((data) => {
        if (isMounted) {
          setCustomers(data);
          setLoadingCustomers(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load customer list:', err);
        if (isMounted) setLoadingCustomers(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Tab Switch (never triggers any fetch)
  const handleTabChange = (e, newIndex) => {
    setTabIndex(newIndex);
  };

  // --- ALL TRANSACTIONS FETCH & DERIVED DATA ---
  const handleFetchAllTransactions = async () => {
    setAllTxLoading(true);
    setAllTxError(null);
    try {
      const data = await fetchTransactionsReportApi({
        startDate: allTxFromDate,
        endDate: allTxToDate,
      });

      const rawData = [];

      (data.invoices || []).forEach((inv) => {
        rawData.push({
          id: inv.invoice_id,
          date: new Date(inv.invoice_date),
          type: 'Invoice',
          refNo: inv.invoice_no,
          customerName: inv.customers?.name,
          customerId: inv.customer_id,
          amount: parseFloat(inv.total_amount || 0),
          status: inv.status,
        });
      });

      (data.receipts || []).forEach((rec) => {
        rawData.push({
          id: rec.receipt_id,
          date: new Date(rec.receipt_date),
          type: 'Receipt',
          refNo: rec.receipt_no,
          customerName: rec.customers?.name,
          customerId: rec.customer_id,
          amount: parseFloat(rec.amount || 0),
          status: 'completed',
          paymentMethod: rec.mode,
        });
      });

      let totalInvoiced = 0;
      let totalReceived = 0;
      rawData.forEach((item) => {
        if (item.type === 'Invoice' && item.status !== 'void') {
          totalInvoiced += item.amount;
        } else if (item.type === 'Receipt') {
          totalReceived += item.amount;
        }
      });

      setAllTxReport({
        rows: rawData,
        fromDate: allTxFromDate,
        toDate: allTxToDate,
        totalInvoiced,
        totalReceived,
      });
      setAllTxPage(0);
    } catch (err) {
      console.error(err);
      setAllTxError(err.message || 'Failed to fetch transactions');
    } finally {
      setAllTxLoading(false);
    }
  };

  const filteredAllTxData = useMemo(() => {
    if (!allTxReport) return [];
    let list = [...allTxReport.rows];

    if (allTxStatusFilter !== 'all') {
      list = list.filter((r) => {
        if (r.type === 'Receipt') return true;
        return r.status === allTxStatusFilter;
      });
    }

    list.sort((a, b) => {
      if (allTxSortOrder === 'newest') return b.date - a.date;
      if (allTxSortOrder === 'oldest') return a.date - b.date;
      if (allTxSortOrder === 'highest') return b.amount - a.amount;
      if (allTxSortOrder === 'lowest') return a.amount - b.amount;
      return 0;
    });

    if (allTxSearch.trim()) {
      const q = allTxSearch.trim().toLowerCase();
      list = list.filter((r) =>
        (r.refNo || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [allTxReport, allTxStatusFilter, allTxSortOrder, allTxSearch]);

  const paginatedAllTxData = useMemo(() => {
    const start = allTxPage * allTxRowsPerPage;
    return filteredAllTxData.slice(start, start + allTxRowsPerPage);
  }, [filteredAllTxData, allTxPage, allTxRowsPerPage]);

  const handleExportAllTxPDF = async () => {
    if (!allTxReport || filteredAllTxData.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.text('All Transactions Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Period: ${formatDate(allTxReport.fromDate)} to ${formatDate(allTxReport.toDate)}`, 14, 22);

      const tableColumn = ['Date', 'Type', 'Ref No', 'Customer', 'Status', 'Amount'];
      const tableRows = filteredAllTxData.map((row) => [
        formatDate(row.date),
        row.type,
        row.refNo || '',
        row.customerName || '',
        row.status || '',
        row.amount ? row.amount.toFixed(2) : '0.00',
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 28,
      });

      const fileName = `all_transactions_${allTxReport.fromDate}_to_${allTxReport.toDate}.pdf`;
      const blob = doc.output('blob');
      const result = await saveExportFile({
        fileBlob: blob,
        fileName,
        subfolder: 'accounts',
      });

      if (result.success) {
        const exportedName = result.fileName || fileName;
        setToastMessage(`Downloaded Transactions Report:\n"${exportedName}"`);
        setToastBlob(blob);
        setToastPath(result.path || exportedName);
        setToastOpen(true);
      }
    } catch (err) {
      console.error('Failed to export all transactions PDF:', err);
      alert('Failed to export PDF: ' + err.message);
    }
  };

  // --- CUSTOMER STATEMENT FETCH & DERIVED DATA ---
  const handleFetchCustomerStatement = async () => {
    if (!custSelectedCustomer) {
      setCustError('Please select a customer first.');
      return;
    }
    setCustLoading(true);
    setCustError(null);
    try {
      const data = await fetchCustomerStatementReportApi({
        customerId: custSelectedCustomer.customer_id,
        startDate: custFromDate,
        endDate: custToDate,
      });

      const rawData = [];
      let totalInvoiced = 0;
      let totalReceived = 0;

      (data.invoices || []).forEach((inv) => {
        const amt = parseFloat(inv.total_amount || 0);
        if (inv.status !== 'void') {
          totalInvoiced += amt;
        }
        rawData.push({
          id: inv.invoice_id,
          date: new Date(inv.invoice_date),
          type: 'Invoice',
          refNo: inv.invoice_no,
          customerName: custSelectedCustomer.name,
          customerId: custSelectedCustomer.customer_id,
          amount: amt,
          status: inv.status,
        });
      });

      (data.receipts || []).forEach((rec) => {
        const amt = parseFloat(rec.amount || 0);
        totalReceived += amt;
        rawData.push({
          id: rec.receipt_id,
          date: new Date(rec.receipt_date),
          type: 'Receipt',
          refNo: rec.receipt_no,
          customerName: custSelectedCustomer.name,
          customerId: custSelectedCustomer.customer_id,
          amount: amt,
          status: 'completed',
          paymentMethod: rec.mode,
        });
      });

      setCustReport({
        customer: custSelectedCustomer,
        rows: rawData,
        fromDate: custFromDate,
        toDate: custToDate,
        totalInvoiced,
        totalReceived,
        netBalance: totalInvoiced - totalReceived,
      });
      setCustPage(0);
    } catch (err) {
      console.error(err);
      setCustError(err.message || 'Failed to fetch customer statement');
    } finally {
      setCustLoading(false);
    }
  };

  const filteredCustData = useMemo(() => {
    if (!custReport) return [];
    let list = [...custReport.rows];

    if (custStatusFilter !== 'all') {
      list = list.filter((r) => {
        if (r.type === 'Receipt') return true;
        return r.status === custStatusFilter;
      });
    }

    list.sort((a, b) => {
      if (custSortOrder === 'newest') return b.date - a.date;
      if (custSortOrder === 'oldest') return a.date - b.date;
      if (custSortOrder === 'highest') return b.amount - a.amount;
      if (custSortOrder === 'lowest') return a.amount - b.amount;
      return 0;
    });

    if (custSearch.trim()) {
      const q = custSearch.trim().toLowerCase();
      list = list.filter((r) =>
        (r.refNo || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [custReport, custStatusFilter, custSortOrder, custSearch]);

  const paginatedCustData = useMemo(() => {
    const start = custPage * custRowsPerPage;
    return filteredCustData.slice(start, start + custRowsPerPage);
  }, [filteredCustData, custPage, custRowsPerPage]);

  const handleExportCustStatementPDF = async () => {
    if (!custReport || filteredCustData.length === 0) return;
    try {
      const doc = new jsPDF();
      doc.text('Customer Statement', 14, 15);
      doc.setFontSize(10);
      doc.text(`Customer: ${custReport.customer?.name || 'Customer'}`, 14, 22);
      doc.text(`Period: ${formatDate(custReport.fromDate)} to ${formatDate(custReport.toDate)}`, 14, 28);
      doc.text(
        `Total Invoiced: ${formatCurrency(custReport.totalInvoiced)}  |  Total Received: ${formatCurrency(custReport.totalReceived)}  |  Net Movement: ${formatCurrency(custReport.netBalance)}`,
        14,
        34
      );

      const tableColumn = ['Date', 'Type', 'Ref No', 'Status / Mode', 'Amount'];
      const tableRows = filteredCustData.map((row) => [
        formatDate(row.date),
        row.type,
        row.refNo || '',
        row.type === 'Invoice' ? (row.status || '') : (row.paymentMethod || 'Paid'),
        row.amount ? row.amount.toFixed(2) : '0.00',
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
      });

      const safeName = (custReport.customer?.name || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = `statement_${safeName}_${custReport.fromDate}_to_${custReport.toDate}.pdf`;
      const blob = doc.output('blob');
      const result = await saveExportFile({
        fileBlob: blob,
        fileName,
        subfolder: 'accounts',
      });

      if (result.success) {
        const exportedName = result.fileName || fileName;
        setToastMessage(`Downloaded Customer Statement:\n"${exportedName}"`);
        setToastBlob(blob);
        setToastPath(result.path || exportedName);
        setToastOpen(true);
      }
    } catch (err) {
      console.error('Failed to export customer statement PDF:', err);
      alert('Failed to export statement PDF: ' + err.message);
    }
  };

  // --- GSTR-1 REPORTS FETCH & EXPORT ---
  const handleFetchGstrReport = async () => {
    setGstrLoading(true);
    setGstrError(null);
    try {
      const data = await fetchGstrReportDataApi({
        startDate: gstrFromDate,
        endDate: gstrToDate,
      });

      const datasets = buildGstr1Datasets({
        invoices: data.invoices || [],
        companySettings: data.companySettings || {},
        startDate: gstrFromDate,
        endDate: gstrToDate,
      });

      setGstrReport({
        datasets,
        fromDate: gstrFromDate,
        toDate: gstrToDate,
        periodLabel: datasets.companyInfo?.periodLabel || '',
      });
    } catch (err) {
      console.error(err);
      setGstrError(err.message || 'Failed to fetch GSTR-1 report');
    } finally {
      setGstrLoading(false);
    }
  };

  const handleGstrQuickMonth = (monthsBack = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    setGstrFromDate(getLocalDateString(firstDay));
    setGstrToDate(getLocalDateString(lastDay));
  };

  const handleExportGstr1Excel = async (exportType = 'all') => {
    if (!gstrReport || !gstrReport.datasets) return;
    try {
      setExportingGst(true);

      const periodLabel = gstrReport.fromDate && gstrReport.toDate
        ? `${gstrReport.fromDate}_to_${gstrReport.toDate}`
        : 'Report';

      let fileName = `GSTR1_Report_${periodLabel}.xlsx`;
      if (exportType === 'sales_register') fileName = `GST_Sales_Register_${periodLabel}.xlsx`;
      if (exportType === 'b2b') fileName = `GST_B2B_Invoices_${periodLabel}.xlsx`;
      if (exportType === 'b2cs') fileName = `GST_B2C_Summary_${periodLabel}.xlsx`;
      if (exportType === 'hsn') fileName = `GST_HSN_Summary_${periodLabel}.xlsx`;

      const blob = generateGstr1ExcelBlob(gstrReport.datasets, exportType);
      const result = await saveExportFile({
        fileBlob: blob,
        fileName,
        subfolder: 'accounts',
      });

      if (result.success) {
        const exportedName = result.fileName || fileName;
        setToastMessage(`Downloaded GST Report:\n"${exportedName}"`);
        setToastBlob(blob);
        setToastPath(result.path || exportedName);
        setToastOpen(true);
      }
    } catch (err) {
      console.error('Failed to export GSTR-1 Excel:', err);
      alert('Failed to export GSTR-1 Excel: ' + err.message);
    } finally {
      setExportingGst(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageToolbar
        title="Statements & Financial Reports"
        subtitle="Customer statements, ledger balances, and official GST portal GSTR-1 reports"
        action={
          tabIndex === 2 ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportGstr1Excel('all')}
              disabled={exportingGst || !gstrReport || !gstrReport.datasets}
              sx={{ fontWeight: 700 }}
            >
              {exportingGst ? 'Generating GSTR-1...' : 'Export GSTR-1 Excel'}
            </Button>
          ) : tabIndex === 1 ? (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportCustStatementPDF}
              disabled={custLoading || !custReport || filteredCustData.length === 0}
              sx={{ fontWeight: 700 }}
            >
              Export Statement PDF
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportAllTxPDF}
              disabled={allTxLoading || !allTxReport || filteredAllTxData.length === 0}
              sx={{ fontWeight: 700 }}
            >
              Export PDF
            </Button>
          )
        }
      />

      {/* Primary In-Page Switcher: Exactly 3 Tabs */}
      <Paper variant="outlined" sx={{ mb: 1.5, flexShrink: 0, borderRadius: 1.5 }}>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ minHeight: 38 }}
        >
          <Tab label="All Transactions" sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
          <Tab label="Customer Statement" sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
          <Tab
            icon={<TableChartIcon fontSize="small" />}
            iconPosition="start"
            label="GST Reports (GSTR-1 Portal Ready)"
            sx={{
              minHeight: 38,
              py: 0.5,
              fontWeight: 700,
              color: tabIndex === 2 ? 'success.main' : 'inherit',
            }}
          />
        </Tabs>
      </Paper>

      {/* =========================================================================
          TAB 0: ALL TRANSACTIONS
         ========================================================================= */}
      {tabIndex === 0 && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Filter / Action Bar */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, flexShrink: 0, borderRadius: 1.5 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  label="From Date"
                  type="date"
                  size="small"
                  value={allTxFromDate}
                  onChange={(e) => setAllTxFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="To Date"
                  type="date"
                  size="small"
                  value={allTxToDate}
                  onChange={(e) => setAllTxToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleFetchAllTransactions}
                  disabled={allTxLoading}
                  startIcon={allTxLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  sx={{ fontWeight: 700, height: 40 }}
                >
                  {allTxLoading ? 'Fetching...' : 'FETCH TRANSACTIONS'}
                </Button>
              </Grid>

              {allTxReport && (
                <>
                  <Grid item xs={12} sm={1.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={allTxStatusFilter}
                        label="Status"
                        onChange={(e) => setAllTxStatusFilter(e.target.value)}
                      >
                        <MenuItem value="all">All</MenuItem>
                        <MenuItem value="paid">Paid</MenuItem>
                        <MenuItem value="partial">Partially Paid</MenuItem>
                        <MenuItem value="unpaid">Unpaid</MenuItem>
                        <MenuItem value="void">Void</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={1.5}>
                    <FormControl size="small" fullWidth>
                      <InputLabel>Sort By</InputLabel>
                      <Select
                        value={allTxSortOrder}
                        label="Sort By"
                        onChange={(e) => setAllTxSortOrder(e.target.value)}
                      >
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                        <MenuItem value="highest">Highest Amount</MenuItem>
                        <MenuItem value="lowest">Lowest Amount</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </>
              )}
            </Grid>

            {allTxReport && (
              <Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, minWidth: 240 }}>
                  <SearchInput
                    value={allTxSearch}
                    onChange={(val) => setAllTxSearch(val)}
                    placeholder="Search Ref No, Customer..."
                    sx={{ width: '100%' }}
                  />
                </Box>
                <Chip
                  label={`Period: ${formatDate(allTxReport.fromDate)} → ${formatDate(allTxReport.toDate)}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Invoiced: ${formatCurrency(allTxReport.totalInvoiced)}`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Received: ${formatCurrency(allTxReport.totalReceived)}`}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}
          </Paper>

          {allTxError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {allTxError}
            </Alert>
          )}

          {/* Initial / Unfetched State */}
          {!allTxReport && !allTxLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No transaction report generated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450 }}>
                Select a date range and click &quot;Fetch Transactions&quot; to view the transactions for that period.
              </Typography>
            </Paper>
          )}

          {/* Loading State during explicit fetch */}
          {allTxLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={36} sx={{ mb: 2 }} />
              <Typography variant="body1" fontWeight={600}>
                Fetching transactions for selected period...
              </Typography>
            </Paper>
          )}

          {/* Report Displayed */}
          {allTxReport && !allTxLoading && (
            <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Ref No</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Status / Method</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedAllTxData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          No transaction records found in selected date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedAllTxData.map((row, idx) => (
                        <TableRow key={`${row.type}-${row.id}-${idx}`} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.type}
                              size="small"
                              color={row.type === 'Invoice' ? 'primary' : 'success'}
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            <HighlightText text={row.refNo} highlight={allTxSearch} />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>
                            <HighlightText text={row.customerName} highlight={allTxSearch} />
                          </TableCell>
                          <TableCell>
                            {row.type === 'Invoice' ? (
                              <Chip
                                label={row.status}
                                size="small"
                                color={row.status === 'paid' ? 'success' : row.status === 'partial' ? 'warning' : row.status === 'void' ? 'error' : 'default'}
                                sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                                {row.paymentMethod || 'Paid'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: row.type === 'Invoice' ? 'inherit' : 'success.main' }}>
                            {row.type === 'Receipt' ? '+ ' : ''}{formatCurrency(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredAllTxData.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[25, 50, 100]}
                  component="div"
                  count={filteredAllTxData.length}
                  rowsPerPage={allTxRowsPerPage}
                  page={allTxPage}
                  onPageChange={(e, p) => setAllTxPage(p)}
                  onRowsPerPageChange={(e) => {
                    setAllTxRowsPerPage(parseInt(e.target.value, 10));
                    setAllTxPage(0);
                  }}
                  sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
                />
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* =========================================================================
          TAB 1: CUSTOMER STATEMENT
         ========================================================================= */}
      {tabIndex === 1 && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Controls Bar */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, flexShrink: 0, borderRadius: 1.5 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Autocomplete
                  options={customers}
                  loading={loadingCustomers}
                  getOptionLabel={(option) => option.name || ''}
                  value={custSelectedCustomer}
                  onChange={(event, newValue) => {
                    setCustSelectedCustomer(newValue);
                    setCustError(null);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Customer *"
                      size="small"
                      placeholder="Type customer name..."
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={2.5}>
                <TextField
                  label="From Date"
                  type="date"
                  size="small"
                  value={custFromDate}
                  onChange={(e) => setCustFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={2.5}>
                <TextField
                  label="To Date"
                  type="date"
                  size="small"
                  value={custToDate}
                  onChange={(e) => setCustToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleFetchCustomerStatement}
                  disabled={custLoading}
                  startIcon={custLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  sx={{ fontWeight: 700, height: 40 }}
                >
                  {custLoading ? 'Fetching...' : 'FETCH STATEMENT'}
                </Button>
              </Grid>
            </Grid>

            {custReport && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                <Box sx={{ flexGrow: 1, minWidth: 200 }}>
                  <SearchInput
                    value={custSearch}
                    onChange={(val) => setCustSearch(val)}
                    placeholder="Search Ref No..."
                    sx={{ width: '100%' }}
                  />
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={custStatusFilter}
                      label="Status"
                      onChange={(e) => setCustStatusFilter(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="paid">Paid</MenuItem>
                      <MenuItem value="partial">Partially Paid</MenuItem>
                      <MenuItem value="unpaid">Unpaid</MenuItem>
                      <MenuItem value="void">Void</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: 120 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={custSortOrder}
                      label="Sort By"
                      onChange={(e) => setCustSortOrder(e.target.value)}
                    >
                      <MenuItem value="newest">Newest</MenuItem>
                      <MenuItem value="oldest">Oldest</MenuItem>
                      <MenuItem value="highest">Highest Amount</MenuItem>
                      <MenuItem value="lowest">Lowest Amount</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Chip
                  label={`Period: ${formatDate(custReport.fromDate)} → ${formatDate(custReport.toDate)}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Invoiced: ${formatCurrency(custReport.totalInvoiced)}`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Received: ${formatCurrency(custReport.totalReceived)}`}
                  color="success"
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
                <Chip
                  label={`Net Movement: ${formatCurrency(custReport.netBalance)}`}
                  color={custReport.netBalance > 0 ? 'warning' : 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              </Box>
            )}
          </Paper>

          {custError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              {custError}
            </Alert>
          )}

          {/* Initial / Unfetched State */}
          {!custReport && !custLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No customer statement generated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450 }}>
                Select a customer, choose the date range, and click &quot;Fetch Statement&quot;.
              </Typography>
            </Paper>
          )}

          {/* Loading State during explicit fetch */}
          {custLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CircularProgress size={36} sx={{ mb: 2 }} />
              <Typography variant="body1" fontWeight={600}>
                Fetching customer statement...
              </Typography>
            </Paper>
          )}

          {/* Customer Statement Table Displayed */}
          {custReport && !custLoading && (
            <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={800}>
                    {custReport.customer.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {custReport.customer.phone ? `Phone: ${custReport.customer.phone} • ` : ''}
                    {custReport.customer.gstin ? `GSTIN: ${custReport.customer.gstin}` : 'Unregistered / Regular'}
                  </Typography>
                </Box>
                <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary" display="block">
                    Opening Balance: {formatCurrency(custReport.customer.opening_balance)}
                  </Typography>
                </Box>
              </Box>

              <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Ref No</TableCell>
                      <TableCell sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Status / Mode</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'grey.100' }}>Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedCustData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          No transactions found for this customer in the selected date range.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCustData.map((row, idx) => (
                        <TableRow key={`${row.type}-${row.id}-${idx}`} hover>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(row.date)}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.type}
                              size="small"
                              color={row.type === 'Invoice' ? 'primary' : 'success'}
                              variant="outlined"
                              sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>
                            <HighlightText text={row.refNo} highlight={custSearch} />
                          </TableCell>
                          <TableCell>
                            {row.type === 'Invoice' ? (
                              <Chip
                                label={row.status}
                                size="small"
                                color={row.status === 'paid' ? 'success' : row.status === 'partial' ? 'warning' : row.status === 'void' ? 'error' : 'default'}
                                sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Typography variant="body2" sx={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>
                                {row.paymentMethod || 'Paid'}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: row.type === 'Invoice' ? 'inherit' : 'success.main' }}>
                            {row.type === 'Receipt' ? '+ ' : ''}{formatCurrency(row.amount)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredCustData.length > 0 && (
                <TablePagination
                  rowsPerPageOptions={[25, 50, 100]}
                  component="div"
                  count={filteredCustData.length}
                  rowsPerPage={custRowsPerPage}
                  page={custPage}
                  onPageChange={(e, p) => setCustPage(p)}
                  onRowsPerPageChange={(e) => {
                    setCustRowsPerPage(parseInt(e.target.value, 10));
                    setCustPage(0);
                  }}
                  sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
                />
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* =========================================================================
          TAB 2: GSTR-1 REPORTS (EXPLICIT WORKSPACE)
         ========================================================================= */}
      {tabIndex === 2 && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflowY: 'auto', pr: 0.5 }}>
          {/* Period Filter & Action Bar */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, flexShrink: 0, borderRadius: 1.5 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} sm={3}>
                <TextField
                  label="From Date"
                  type="date"
                  size="small"
                  value={gstrFromDate}
                  onChange={(e) => setGstrFromDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="To Date"
                  type="date"
                  size="small"
                  value={gstrToDate}
                  onChange={(e) => setGstrToDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={handleFetchGstrReport}
                  disabled={gstrLoading}
                  startIcon={gstrLoading ? <CircularProgress size={16} color="inherit" /> : <RefreshIcon />}
                  sx={{ fontWeight: 700, height: 40 }}
                >
                  {gstrLoading ? 'Generating...' : 'FETCH GSTR-1 REPORT'}
                </Button>
              </Grid>

              {/* Quick Period Buttons (only sets input values, never auto-fetches) */}
              <Grid item xs={12} sm={3}>
                <Box display="flex" gap={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
                  <Button size="small" variant="outlined" onClick={() => handleGstrQuickMonth(0)}>
                    This Month
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleGstrQuickMonth(1)}>
                    Last Month
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => { setGstrFromDate(''); setGstrToDate(''); }}>
                    All Time
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {gstrError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {gstrError}
            </Alert>
          )}

          {/* Initial / Unfetched State */}
          {!gstrReport && !gstrLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: 'background.paper',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                my: 'auto',
              }}
            >
              <TableChartIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No GSTR-1 report generated
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
                Select a reporting period and click &quot;Fetch GSTR-1 Report&quot; to generate the report for review and export.
              </Typography>
            </Paper>
          )}

          {/* Loading State */}
          {gstrLoading && (
            <Paper
              variant="outlined"
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                my: 'auto',
              }}
            >
              <CircularProgress size={36} sx={{ mb: 2 }} />
              <Typography variant="body1" fontWeight={600}>
                Fetching invoices and generating GSTR-1 statutory workbook datasets...
              </Typography>
            </Paper>
          )}

          {/* Report Display: Exact Dataset Review Workspace */}
          {gstrReport && !gstrLoading && (
            <Box>
              {/* GST Summary Metric Cards */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        TOTAL TAXABLE TURNOVER
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="primary.main">
                        {formatCurrency(gstrReport.datasets.summary.totalTaxable)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {gstrReport.datasets.summary.totalGstInvoices} GST Invoices in period
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        B2B TAXABLE VALUE (4A)
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="success.main">
                        {formatCurrency(gstrReport.datasets.summary.b2bTaxable)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GST: {formatCurrency(gstrReport.datasets.summary.b2bGst)} ({gstrReport.datasets.summary.b2bCount} Lines)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        B2C TAXABLE VALUE (7 & 5)
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="secondary.main">
                        {formatCurrency(gstrReport.datasets.summary.b2cTaxable)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        GST: {formatCurrency(gstrReport.datasets.summary.b2cGst)} ({gstrReport.datasets.summary.b2cCount} Invoices)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                        TOTAL GST LIABILITY
                      </Typography>
                      <Typography variant="h6" fontWeight={900} color="error.main">
                        {formatCurrency(gstrReport.datasets.summary.totalGst)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        CGST: {formatCurrency(gstrReport.datasets.summary.cgst)} | SGST: {formatCurrency(gstrReport.datasets.summary.sgst)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Export Buttons Bar */}
              <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: 1.5 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 1 }}>
                  Export XLSX:
                </Typography>
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<FileDownloadIcon />}
                  onClick={() => handleExportGstr1Excel('all')}
                  disabled={exportingGst}
                  sx={{ fontWeight: 700 }}
                >
                  Full GSTR-1 Workbook (.xlsx)
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<ReceiptLongIcon />}
                  onClick={() => handleExportGstr1Excel('sales_register')}
                  disabled={exportingGst || !gstrReport.datasets.salesRegister || gstrReport.datasets.salesRegister.length === 0}
                  sx={{ fontWeight: 700 }}
                >
                  Sales Register
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<BusinessIcon />}
                  onClick={() => handleExportGstr1Excel('b2b')}
                  disabled={exportingGst || gstrReport.datasets.b2b.length === 0}
                >
                  B2B Sheet
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  startIcon={<PersonIcon />}
                  onClick={() => handleExportGstr1Excel('b2cs')}
                  disabled={exportingGst || gstrReport.datasets.b2cs.length === 0}
                >
                  B2C Sheet
                </Button>
                <Button
                  variant="outlined"
                  color="info"
                  size="small"
                  startIcon={<CategoryIcon />}
                  onClick={() => handleExportGstr1Excel('hsn')}
                  disabled={exportingGst || gstrReport.datasets.itemSummary.length === 0}
                >
                  HSN Summary
                </Button>

                {gstrReport.datasets.companyInfo?.gstin && (
                  <Chip
                    label={`GSTIN: ${gstrReport.datasets.companyInfo.gstin}`}
                    variant="outlined"
                    size="small"
                    color="primary"
                    sx={{ ml: 'auto', fontWeight: 700 }}
                  />
                )}
              </Paper>

              {/* Subtabs for Reviewing Actual Sheets in the Workbook */}
              <Paper variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
                <Tabs
                  value={gstrSubTab}
                  onChange={(e, v) => setGstrSubTab(v)}
                  textColor="primary"
                  indicatorColor="primary"
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 38 }}
                >
                  <Tab label={`Sales Register (${gstrReport.datasets.salesRegister?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`B2B Invoices (${gstrReport.datasets.b2b?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`B2CL Large (${gstrReport.datasets.b2cl?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`B2C Small (${gstrReport.datasets.b2cs?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`Credit/Debit Notes (${(gstrReport.datasets.cdnr?.length || 0) + (gstrReport.datasets.cdnur?.length || 0)})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`Exports & Advances (${(gstrReport.datasets.exp?.length || 0) + (gstrReport.datasets.at?.length || 0)})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`Exempt (${gstrReport.datasets.exemp?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`HSN Summary (${gstrReport.datasets.itemSummary?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                  <Tab label={`Documents (${gstrReport.datasets.docs?.length || 0})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
                </Tabs>
              </Paper>

              {/* SUBTAB 0: Sales Register Table (Complete Outward Sales, with unregistered customers) */}
              {gstrSubTab === 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>GSTIN/UIN</strong></TableCell>
                        <TableCell><strong>Party Name</strong></TableCell>
                        <TableCell align="center"><strong>Transaction Type</strong></TableCell>
                        <TableCell><strong>Invoice No.</strong></TableCell>
                        <TableCell><strong>Invoice Date</strong></TableCell>
                        <TableCell align="right"><strong>Invoice Value</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="center"><strong>Cess Rate</strong></TableCell>
                        <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!gstrReport.datasets.salesRegister || gstrReport.datasets.salesRegister.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                            No outward sales transactions found in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gstrReport.datasets.salesRegister.map((row, idx) => (
                          <TableRow key={`sr-${idx}`} hover>
                            <TableCell>
                              {row['GSTIN/UIN'] ? (
                                <Typography variant="body2" fontWeight={700}>
                                  {row['GSTIN/UIN']}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  — (Unregistered)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600 }}>{row['Party Name']}</TableCell>
                            <TableCell align="center">
                              <Chip label={row['Transaction Type']} size="small" variant="outlined" color="primary" sx={{ height: 20, fontSize: '0.75rem' }} />
                            </TableCell>
                            <TableCell><Typography variant="body2" fontWeight={700}>{row['Invoice No.']}</Typography></TableCell>
                            <TableCell>{row['Invoice Date']}</TableCell>
                            <TableCell align="right">{formatCurrency(row['Invoice Value'])}</TableCell>
                            <TableCell align="center"><Chip label={`${row['Rate']}%`} size="small" /></TableCell>
                            <TableCell align="center">{row['Cess Rate']}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row['Taxable Value'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 1: B2B Invoices Table */}
              {gstrSubTab === 1 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>GSTIN of Recipient</strong></TableCell>
                        <TableCell><strong>Receiver Name</strong></TableCell>
                        <TableCell><strong>Invoice No</strong></TableCell>
                        <TableCell><strong>Invoice Date</strong></TableCell>
                        <TableCell align="right"><strong>Invoice Value</strong></TableCell>
                        <TableCell><strong>Place of Supply</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gstrReport.datasets.b2b.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                            No B2B invoices found in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gstrReport.datasets.b2b.map((row, idx) => (
                          <TableRow key={`b2b-${idx}`} hover>
                            <TableCell><Typography variant="body2" fontWeight={700}>{row['GSTIN/UIN of Recipient'] || '—'}</Typography></TableCell>
                            <TableCell>{row['Receiver Name']}</TableCell>
                            <TableCell><Typography variant="body2" fontWeight={700}>{row['Invoice Number']}</Typography></TableCell>
                            <TableCell>{row['Invoice date']}</TableCell>
                            <TableCell align="right">{formatCurrency(row['Invoice Value'])}</TableCell>
                            <TableCell>{row['Place Of Supply']}</TableCell>
                            <TableCell align="center"><Chip label={`${row['Rate']}%`} size="small" /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row['Taxable Value'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 2: B2CL (Large) Table */}
              {gstrSubTab === 2 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Invoice Number</strong></TableCell>
                        <TableCell><strong>Invoice Date</strong></TableCell>
                        <TableCell align="right"><strong>Invoice Value</strong></TableCell>
                        <TableCell><strong>Place of Supply</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                        <TableCell align="right"><strong>Cess Amount</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gstrReport.datasets.b2cl.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            No B2CL (Inter-state &gt; 2.5 Lakhs) supplies found in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gstrReport.datasets.b2cl.map((row, idx) => (
                          <TableRow key={`b2cl-${idx}`} hover>
                            <TableCell><Typography variant="body2" fontWeight={700}>{row['Invoice Number']}</Typography></TableCell>
                            <TableCell>{row['Invoice date']}</TableCell>
                            <TableCell align="right">{formatCurrency(row['Invoice Value'])}</TableCell>
                            <TableCell>{row['Place Of Supply']}</TableCell>
                            <TableCell align="center"><Chip label={`${row['Rate']}%`} size="small" /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row['Taxable Value'])}</TableCell>
                            <TableCell align="right">{formatCurrency(row['Cess Amount'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 3: B2CS (Small) Table */}
              {gstrSubTab === 3 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Place of Supply</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                        <TableCell align="right"><strong>Cess Amount</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {gstrReport.datasets.b2cs.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                            No B2C small supplies found in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        gstrReport.datasets.b2cs.map((row, idx) => (
                          <TableRow key={`b2cs-${idx}`} hover>
                            <TableCell>{row['Type']}</TableCell>
                            <TableCell>{row['Place Of Supply']}</TableCell>
                            <TableCell align="center"><Chip label={`${row['Rate']}%`} size="small" /></TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row['Taxable Value'])}</TableCell>
                            <TableCell align="right">{formatCurrency(row['Cess Amount'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 4: CDNR & CDNUR (Credit / Debit Notes) */}
              {gstrSubTab === 4 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Section</strong></TableCell>
                        <TableCell><strong>Recipient GSTIN / UR Type</strong></TableCell>
                        <TableCell><strong>Note Number</strong></TableCell>
                        <TableCell><strong>Note Date</strong></TableCell>
                        <TableCell><strong>Place of Supply</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!gstrReport.datasets.cdnr || gstrReport.datasets.cdnr.length === 0) && (!gstrReport.datasets.cdnur || gstrReport.datasets.cdnur.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                            No Credit / Debit notes issued in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...(gstrReport.datasets.cdnr || []), ...(gstrReport.datasets.cdnur || [])].map((row, idx) => (
                          <TableRow key={`cdn-${idx}`} hover>
                            <TableCell>{row['GSTIN/UIN of Recipient'] ? 'CDNR (Registered)' : 'CDNUR (Unregistered)'}</TableCell>
                            <TableCell>{row['GSTIN/UIN of Recipient'] || row['UR Type'] || '—'}</TableCell>
                            <TableCell>{row['Note Number']}</TableCell>
                            <TableCell>{row['Note Date']}</TableCell>
                            <TableCell>{row['Place Of Supply']}</TableCell>
                            <TableCell align="center">{row['Rate']}%</TableCell>
                            <TableCell align="right">{formatCurrency(row['Taxable Value'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 5: EXP & AT (Exports and Advances) */}
              {gstrSubTab === 5 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Section</strong></TableCell>
                        <TableCell><strong>Reference / Details</strong></TableCell>
                        <TableCell align="center"><strong>Rate %</strong></TableCell>
                        <TableCell align="right"><strong>Taxable / Advance Value</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(!gstrReport.datasets.exp || gstrReport.datasets.exp.length === 0) && (!gstrReport.datasets.at || gstrReport.datasets.at.length === 0) ? (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                            No export invoices or advance receipts in selected date range.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...(gstrReport.datasets.exp || []), ...(gstrReport.datasets.at || [])].map((row, idx) => (
                          <TableRow key={`exp-at-${idx}`} hover>
                            <TableCell>{row['Export Type'] ? '6A - Export' : '11A - Advance Received'}</TableCell>
                            <TableCell>{row['Invoice Number'] || row['Place Of Supply']}</TableCell>
                            <TableCell align="center">{row['Rate']}%</TableCell>
                            <TableCell align="right">{formatCurrency(row['Taxable Value'] || row['Gross Advance Received'])}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 6: EXEMP (Nil Rated, Exempt, Non-GST) */}
              {gstrSubTab === 6 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Description</strong></TableCell>
                        <TableCell align="right"><strong>Nil Rated Supplies</strong></TableCell>
                        <TableCell align="right"><strong>Exempted Supplies</strong></TableCell>
                        <TableCell align="right"><strong>Non-GST Supplies</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(gstrReport.datasets.exemp || []).map((row, idx) => (
                        <TableRow key={`exemp-${idx}`} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row['Description']}</TableCell>
                          <TableCell align="right">{formatCurrency(row['Nil Rated Supplies'])}</TableCell>
                          <TableCell align="right">{formatCurrency(row['Exempted (other than nil rated/non GST supply)'])}</TableCell>
                          <TableCell align="right">{formatCurrency(row['Non-GST Supplies'])}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* SUBTAB 7: HSN Summary Table */}
              {gstrSubTab === 7 && (
                <Box sx={{ mb: 3 }}>
                  <Box display="flex" gap={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={700}>HSN View:</Typography>
                    <Button
                      size="small"
                      variant={gstrHsnType === 'consolidated' ? 'contained' : 'outlined'}
                      onClick={() => setGstrHsnType('consolidated')}
                    >
                      Consolidated Item Summary ({gstrReport.datasets.itemSummary.length})
                    </Button>
                    <Button
                      size="small"
                      variant={gstrHsnType === 'b2b' ? 'contained' : 'outlined'}
                      onClick={() => setGstrHsnType('b2b')}
                    >
                      HSN B2B ({gstrReport.datasets.hsnB2b?.length || 0})
                    </Button>
                    <Button
                      size="small"
                      variant={gstrHsnType === 'b2c' ? 'contained' : 'outlined'}
                      onClick={() => setGstrHsnType('b2c')}
                    >
                      HSN B2C ({gstrReport.datasets.hsnB2c?.length || 0})
                    </Button>
                  </Box>

                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell><strong>HSN Code</strong></TableCell>
                          <TableCell><strong>Description</strong></TableCell>
                          <TableCell align="center"><strong>UQC</strong></TableCell>
                          <TableCell align="right"><strong>Total Qty</strong></TableCell>
                          <TableCell align="right"><strong>Total Value</strong></TableCell>
                          <TableCell align="right"><strong>Taxable Value</strong></TableCell>
                          <TableCell align="right"><strong>Central Tax (CGST)</strong></TableCell>
                          <TableCell align="right"><strong>State Tax (SGST)</strong></TableCell>
                          <TableCell align="right"><strong>Integrated Tax (IGST)</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const rows = gstrHsnType === 'b2b'
                            ? (gstrReport.datasets.hsnB2b || [])
                            : gstrHsnType === 'b2c'
                            ? (gstrReport.datasets.hsnB2c || [])
                            : gstrReport.datasets.itemSummary;

                          if (rows.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                                  No HSN records found for this view in selected date range.
                                </TableCell>
                              </TableRow>
                            );
                          }

                          return rows.map((row, idx) => (
                            <TableRow key={`hsn-${idx}`} hover>
                              <TableCell><Typography variant="body2" fontWeight={700}>{row['HSN']}</Typography></TableCell>
                              <TableCell>{row['Description']}</TableCell>
                              <TableCell align="center">{row['UQC']}</TableCell>
                              <TableCell align="right">{row['Total Quantity']}</TableCell>
                              <TableCell align="right">{formatCurrency(row['Total Value'])}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700 }}>{formatCurrency(row['Taxable Value'])}</TableCell>
                              <TableCell align="right">{formatCurrency(row['Central Tax Amount'])}</TableCell>
                              <TableCell align="right">{formatCurrency(row['State/UT Tax Amount'])}</TableCell>
                              <TableCell align="right">{formatCurrency(row['Integrated Tax Amount'])}</TableCell>
                            </TableRow>
                          ));
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* SUBTAB 8: Documents Issued Table */}
              {gstrSubTab === 8 && (
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>Nature of Document</strong></TableCell>
                        <TableCell><strong>From Serial No</strong></TableCell>
                        <TableCell><strong>To Serial No</strong></TableCell>
                        <TableCell align="right"><strong>Total Number</strong></TableCell>
                        <TableCell align="right"><strong>Cancelled / Voided</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(gstrReport.datasets.docs || []).map((row, idx) => (
                        <TableRow key={`docs-${idx}`} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row['Nature of Document']}</TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700}>{row['Sr. No. From']}</Typography></TableCell>
                          <TableCell><Typography variant="body2" fontWeight={700}>{row['Sr. No. To']}</Typography></TableCell>
                          <TableCell align="right">{row['Total Number']}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main', fontWeight: 700 }}>{row['Cancelled']}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Toast Feedback */}
      <AppSnackbar
        open={toastOpen}
        autoHideDuration={5000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        showInFolder={!!toastBlob}
        subfolder="accounts"
        filePath={toastPath}
        fileName={toastPath}
        fileBlob={toastBlob}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default StatementsPage;

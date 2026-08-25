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
  Snackbar,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableChartIcon from '@mui/icons-material/TableChart';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CategoryIcon from '@mui/icons-material/Category';
import { getStatementData } from './api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SearchInput } from '../../components/ui/SearchInput';
import PageToolbar from '../../components/layout/PageToolbar';
import { HighlightText } from '../../components/ui/HighlightText';
import { formatDate } from '../../lib/formatDate';
import { buildGstr1Datasets, generateGstr1ExcelBlob } from '../../lib/gstReportGenerator';
import { saveExportFile } from '../../lib/savedLocation';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const StatementsPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [gstSubTab, setGstSubTab] = useState(0); // 0: b2b, 1: b2cs, 2: hsn, 3: docs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, highest, lowest
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const [exportingGst, setExportingGst] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStatementData();
      setInvoices(data.invoices || []);
      setReceipts(data.receipts || []);
      setCustomers(data.customers || []);
      setCompanySettings(data.companySettings || null);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load statements data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTabChange = (e, newIndex) => {
    setTabIndex(newIndex);
    if (newIndex === 0) {
      setSelectedCustomer(null);
      setStartDate('');
      setEndDate('');
    } else if (newIndex === 1) {
      setStartDate('');
      setEndDate('');
    } else if (newIndex === 2) {
      setSelectedCustomer(null);
    } else if (newIndex === 3) {
      // GST Tab: Default to current month if not set
      if (!startDate && !endDate) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        setStartDate(firstDay);
        setEndDate(lastDay);
      }
    }
    setPage(0);
  };

  // Quick Month Selector for GST
  const handleQuickMonthSelect = (monthsBack = 0) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsBack);
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  // GSTR-1 Datasets calculation
  const gstDatasets = useMemo(() => {
    return buildGstr1Datasets({
      invoices,
      companySettings,
      startDate: tabIndex === 3 ? startDate : '',
      endDate: tabIndex === 3 ? endDate : '',
    });
  }, [invoices, companySettings, startDate, endDate, tabIndex]);

  // Combined standard statements data
  const combinedData = useMemo(() => {
    let rawData = [];

    invoices.forEach(inv => {
      rawData.push({
        id: inv.invoice_id,
        date: new Date(inv.invoice_date),
        type: 'Invoice',
        refNo: inv.invoice_no,
        customerName: inv.customers?.name,
        customerId: inv.customer_id,
        amount: parseFloat(inv.total_amount),
        status: inv.status,
      });
    });

    receipts.forEach(rec => {
      rawData.push({
        id: rec.receipt_id,
        date: new Date(rec.receipt_date),
        type: 'Receipt',
        refNo: rec.receipt_no,
        customerName: rec.customers?.name,
        customerId: rec.customer_id,
        amount: parseFloat(rec.amount),
        status: 'completed',
        paymentMethod: rec.payment_method,
      });
    });

    if (tabIndex === 1 && selectedCustomer) {
      rawData = rawData.filter(r => r.customerId === selectedCustomer.customer_id);
    }
    if (tabIndex === 2 || startDate || endDate) {
      if (startDate) {
        const start = new Date(startDate);
        rawData = rawData.filter(r => r.date >= start);
      }
      if (endDate) {
        const end = new Date(endDate);
        rawData = rawData.filter(r => r.date <= end);
      }
    }
    if (statusFilter !== 'all') {
      rawData = rawData.filter(r => {
        if (r.type === 'Receipt') return true;
        return r.status === statusFilter;
      });
    }

    rawData.sort((a, b) => {
      if (sortOrder === 'newest') return b.date - a.date;
      if (sortOrder === 'oldest') return a.date - b.date;
      if (sortOrder === 'highest') return b.amount - a.amount;
      if (sortOrder === 'lowest') return a.amount - b.amount;
      return 0;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rawData = rawData.filter(r =>
        (r.refNo || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q)
      );
    }

    return rawData;
  }, [invoices, receipts, tabIndex, selectedCustomer, startDate, endDate, statusFilter, sortOrder, searchQuery]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return combinedData.slice(start, start + rowsPerPage);
  }, [combinedData, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('Statement Report', 14, 15);
    doc.setFontSize(10);

    let subtitle = 'All Records';
    if (tabIndex === 1 && selectedCustomer) subtitle = `Customer: ${selectedCustomer.name}`;
    if (tabIndex === 2) subtitle = `Date Range: ${startDate || 'Start'} to ${endDate || 'End'}`;
    doc.text(subtitle, 14, 22);

    const tableColumn = ["Date", "Type", "Ref No", "Customer", "Status", "Amount"];
    const tableRows = [];

    combinedData.forEach(row => {
      const rowData = [
        formatDate(row.date),
        row.type,
        row.refNo || '',
        row.customerName || '',
        row.status || '',
        row.amount ? row.amount.toFixed(2) : '0.00'
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
    });

    doc.save(`statement_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Export GST Excel Reports directly to /accounts/ folder
  const handleExportGstr1Excel = async (exportType = 'all') => {
    try {
      setExportingGst(true);

      const periodLabel = startDate && endDate
        ? `${startDate}_to_${endDate}`
        : new Date().toISOString().split('T')[0];

      let fileName = `GSTR1_Report_${periodLabel}.xlsx`;
      if (exportType === 'b2b') fileName = `GST_B2B_Invoices_${periodLabel}.xlsx`;
      if (exportType === 'b2cs') fileName = `GST_B2C_Summary_${periodLabel}.xlsx`;
      if (exportType === 'hsn') fileName = `GST_HSN_Summary_${periodLabel}.xlsx`;

      const blob = generateGstr1ExcelBlob(gstDatasets, exportType);
      const result = await saveExportFile({
        fileBlob: blob,
        fileName,
        subfolder: 'accounts',
      });

      if (result.success) {
        setToastMessage(`Saved GST Report to ${result.path}`);
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
          tabIndex === 3 ? (
            <Button
              variant="contained"
              color="success"
              startIcon={<FileDownloadIcon />}
              onClick={() => handleExportGstr1Excel('all')}
              disabled={exportingGst || gstDatasets.b2b.length + gstDatasets.b2cs.length === 0}
              sx={{ fontWeight: 700 }}
            >
              {exportingGst ? 'Generating GSTR-1...' : 'Export GSTR-1 Excel'}
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              startIcon={<PictureAsPdfIcon />}
              onClick={handleExportPDF}
              disabled={loading || combinedData.length === 0}
              sx={{ fontWeight: 700 }}
            >
              Export PDF
            </Button>
          )
        }
      />

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
          <Tab label="Date Range Statement" sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
          <Tab
            icon={<TableChartIcon fontSize="small" />}
            iconPosition="start"
            label="GST Reports (GSTR-1 Portal Ready)"
            sx={{ minHeight: 38, py: 0.5, fontWeight: 700, color: tabIndex === 3 ? 'success.main' : 'inherit' }}
          />
        </Tabs>
      </Paper>

      {/* --- TAB 3: GST REPORTS (GSTR-1 PORTAL READY) --- */}
      {tabIndex === 3 ? (
        <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 0.5 }}>
          {/* Period Filter & Quick Buttons */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 1.5 }}>
            <Grid container spacing={1.5} alignItems="center">
              <Grid item xs={12} md={5}>
                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    label="From Date"
                    type="date"
                    size="small"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <TextField
                    label="To Date"
                    type="date"
                    size="small"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                </Box>
              </Grid>

              <Grid item xs={12} md={7}>
                <Box display="flex" gap={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                  <Button size="small" variant="outlined" onClick={() => handleQuickMonthSelect(0)}>
                    This Month
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => handleQuickMonthSelect(1)}>
                    Last Month
                  </Button>
                  <Button size="small" variant="outlined" onClick={() => { setStartDate(''); setEndDate(''); }}>
                    All Time
                  </Button>
                  {companySettings?.gstin && (
                    <Chip label={`GSTIN: ${companySettings.gstin}`} color="primary" variant="outlined" sx={{ fontWeight: 700 }} />
                  )}
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {/* GST Summary Metric Cards */}
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                    TOTAL TAXABLE TURNOVER
                  </Typography>
                  <Typography variant="h6" fontWeight={900} color="primary.main">
                    {formatCurrency(gstDatasets.summary.totalTaxable)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {gstDatasets.summary.totalGstInvoices} GST Invoices in period
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
                    {formatCurrency(gstDatasets.summary.b2bTaxable)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    GST: {formatCurrency(gstDatasets.summary.b2bGst)} ({gstDatasets.summary.b2bCount} Lines)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
                    B2C TAXABLE VALUE (7)
                  </Typography>
                  <Typography variant="h6" fontWeight={900} color="secondary.main">
                    {formatCurrency(gstDatasets.summary.b2cTaxable)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    GST: {formatCurrency(gstDatasets.summary.b2cGst)} ({gstDatasets.summary.b2cCount} Invoices)
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
                    {formatCurrency(gstDatasets.summary.totalGst)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    CGST: {formatCurrency(gstDatasets.summary.cgst)} | SGST: {formatCurrency(gstDatasets.summary.sgst)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Export Buttons Bar */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', bgcolor: '#f8fafc', borderRadius: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mr: 1 }}>
              Export GSTR-1:
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
              Full Workbook (.xlsx)
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              startIcon={<BusinessIcon />}
              onClick={() => handleExportGstr1Excel('b2b')}
              disabled={exportingGst || gstDatasets.b2b.length === 0}
            >
              B2B Sheet
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              startIcon={<PersonIcon />}
              onClick={() => handleExportGstr1Excel('b2cs')}
              disabled={exportingGst || gstDatasets.b2cs.length === 0}
            >
              B2C Sheet
            </Button>
            <Button
              variant="outlined"
              color="info"
              size="small"
              startIcon={<CategoryIcon />}
              onClick={() => handleExportGstr1Excel('hsn')}
              disabled={exportingGst || gstDatasets.hsn.length === 0}
            >
              HSN Summary
            </Button>
          </Paper>

          {/* GST Sub-Tabs (B2B, B2CS, HSN, DOCS) */}
          <Paper variant="outlined" sx={{ mb: 1.5, borderRadius: 1.5 }}>
            <Tabs
              value={gstSubTab}
              onChange={(e, v) => setGstSubTab(v)}
              textColor="primary"
              indicatorColor="primary"
              sx={{ minHeight: 38 }}
            >
              <Tab label={`B2B Invoices (${gstDatasets.b2b.length})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
              <Tab label={`B2C Small (${gstDatasets.b2cs.length})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
              <Tab label={`HSN Summary (${gstDatasets.hsn.length})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
              <Tab label={`Documents (${gstDatasets.docs.length})`} sx={{ minHeight: 38, py: 0.5, fontWeight: 700 }} />
            </Tabs>
          </Paper>

          {/* Subtab 0: B2B Table */}
          {gstSubTab === 0 && (
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
                  {gstDatasets.b2b.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                        No B2B invoices found in selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gstDatasets.b2b.map((row, idx) => (
                      <TableRow key={`b2b-${idx}`} hover>
                        <TableCell><Typography variant="body2" fontWeight={700}>{row['GSTIN/UIN of Recipient'] || '—'}</Typography></TableCell>
                        <TableCell>{row['Receiver Name']}</TableCell>
                        <TableCell>{row['Invoice Number']}</TableCell>
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

          {/* Subtab 1: B2CS Table */}
          {gstSubTab === 1 && (
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
                  {gstDatasets.b2cs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        No B2C small supplies found in selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gstDatasets.b2cs.map((row, idx) => (
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

          {/* Subtab 2: HSN Summary Table */}
          {gstSubTab === 2 && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5, mb: 3 }}>
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
                  {gstDatasets.hsn.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                        No HSN items found in selected date range.
                      </TableCell>
                    </TableRow>
                  ) : (
                    gstDatasets.hsn.map((row, idx) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Subtab 3: Documents Issued Table */}
          {gstSubTab === 3 && (
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
                  {gstDatasets.docs.map((row, idx) => (
                    <TableRow key={`docs-${idx}`} hover>
                      <TableCell>{row['Nature of Document']}</TableCell>
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
      ) : (
        /* --- STANDARD STATEMENTS TABS (0, 1, 2) --- */
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {/* Filters Bar */}
          <Paper variant="outlined" sx={{ p: 1.5, mb: 1.5, flexShrink: 0, borderRadius: 1.5 }}>
            <Grid container spacing={1.5} alignItems="center">
              {tabIndex === 1 && (
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={customers}
                    getOptionLabel={(option) => option.name || ''}
                    value={selectedCustomer}
                    onChange={(event, newValue) => setSelectedCustomer(newValue)}
                    renderInput={(params) => <TextField {...params} label="Select Customer" size="small" />}
                  />
                </Grid>
              )}

              {(tabIndex === 0 || tabIndex === 2) && (
                <>
                  <Grid item xs={12} sm={2.5}>
                    <TextField
                      label="From Date"
                      type="date"
                      size="small"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} sm={2.5}>
                    <TextField
                      label="To Date"
                      type="date"
                      size="small"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      fullWidth
                    />
                  </Grid>
                </>
              )}

              <Grid item xs={12} sm={2.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="paid">Paid</MenuItem>
                    <MenuItem value="partial">Partially Paid</MenuItem>
                    <MenuItem value="unpaid">Unpaid</MenuItem>
                    <MenuItem value="void">Void</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={2.5}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort By"
                    onChange={(e) => setSortOrder(e.target.value)}
                  >
                    <MenuItem value="newest">Newest First</MenuItem>
                    <MenuItem value="oldest">Oldest First</MenuItem>
                    <MenuItem value="highest">Highest Amount</MenuItem>
                    <MenuItem value="lowest">Lowest Amount</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={tabIndex === 1 ? 4 : 2}>
                <SearchInput
                  value={searchQuery}
                  onChange={(val) => setSearchQuery(val)}
                  placeholder="Search Ref No, Customer..."
                  sx={{ width: '100%' }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Statement Table */}
          <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Ref No</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Customer</TableCell>
                    <TableCell sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.default' }}>Amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    Array.from(new Array(5)).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><CircularProgress size={16} /></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    ))
                  ) : paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        No statement records found for the selected criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, idx) => (
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
                          <HighlightText text={row.refNo} highlight={searchQuery} />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <HighlightText text={row.customerName} highlight={searchQuery} />
                        </TableCell>
                        <TableCell>
                          {row.type === 'Invoice' ? (
                            <Chip label={row.status} size="small" sx={{ fontWeight: 600, height: 20, fontSize: '0.7rem' }} />
                          ) : (
                            <Typography variant="body2">{row.paymentMethod}</Typography>
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

            {combinedData.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[25, 50, 100]}
                component="div"
                count={combinedData.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
              />
            )}
          </Paper>
        </Box>
      )}

      {/* Snackbar feedback */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default StatementsPage;


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
  TablePagination
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { getStatementData } from './api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { SearchInput } from '../../components/ui/SearchInput';
import PageToolbar from '../../components/layout/PageToolbar';
import { HighlightText } from '../../components/ui/HighlightText';
import { formatDate } from '../../lib/formatDate';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const StatementsPage = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, highest, lowest
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStatementData();
      setInvoices(data.invoices);
      setReceipts(data.receipts);
      setCustomers(data.customers);
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
    // Reset filters depending on tab
    if (newIndex === 0) {
      setSelectedCustomer(null);
      setStartDate('');
      setEndDate('');
    } else if (newIndex === 1) {
      setStartDate('');
      setEndDate('');
    } else if (newIndex === 2) {
      setSelectedCustomer(null);
    }
    setPage(0);
  };

  const combinedData = useMemo(() => {
    let rawData = [];

    // Map Invoices
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

    // Map Receipts
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

    // Filter
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
        if (r.type === 'Receipt') return true; // receipts don't have invoice statuses
        return r.status === statusFilter;
      });
    }

    // Sort
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
        row.refNo,
        row.customerName,
        row.type === 'Invoice' ? row.status : row.paymentMethod,
        formatCurrency(row.amount)
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [2, 136, 209] }
    });

    doc.save(`statement_${new Date().getTime()}.pdf`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <PageToolbar
        title="Financial Statements"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by ref no or customer..."
        actions={
          <Button
            variant="contained"
            startIcon={<PictureAsPdfIcon />}
            color="error"
            onClick={handleExportPDF}
            sx={{ fontWeight: 'bold' }}
          >
            Export PDF
          </Button>
        }
      />
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Tabs value={tabIndex} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Overall Statement" />
          <Tab label="Customer Statement" />
          <Tab label="Date Range Statement" />
        </Tabs>
        
        <Box p={3}>
          <Grid container spacing={2} alignItems="center">
            {tabIndex === 1 && (
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={customers}
                  getOptionLabel={(option) => option.name}
                  value={selectedCustomer}
                  onChange={(e, val) => setSelectedCustomer(val)}
                  renderInput={(params) => <TextField {...params} label="Select Customer" size="small" />}
                />
              </Grid>
            )}

            {(tabIndex === 2 || tabIndex === 0) && (
              <React.Fragment>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Grid>
              </React.Fragment>
            )}

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Status">
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="unpaid">Unpaid Invoices</MenuItem>
                  <MenuItem value="partial">Partially Paid</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="void">Voided</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} label="Sort By">
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="highest">Highest Amount</MenuItem>
                  <MenuItem value="lowest">Lowest Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ref No</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status / Method</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && combinedData.length === 0 ? (
              Array.from(new Array(3)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><CircularProgress size={24} /></TableCell>
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
                  <TableCell>{formatDate(row.date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.type} 
                      size="small" 
                      color={row.type === 'Invoice' ? 'primary' : 'success'} 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <HighlightText text={row.refNo} highlight={searchQuery} />
                  </TableCell>
                  <TableCell>
                    <HighlightText text={row.customerName} highlight={searchQuery} />
                  </TableCell>
                  <TableCell>
                    {row.type === 'Invoice' ? (
                      <Chip label={row.status} size="small" />
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
          sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        />
      )}
    </Box>
  );
};

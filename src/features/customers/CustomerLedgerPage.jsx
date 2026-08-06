import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PrintIcon from '@mui/icons-material/Print';

import { getCustomerById } from './api';
import { getInvoicesByCustomer } from '../salesInvoices/api';
import { getReceiptsByCustomer } from '../receipts/api';
import InvoiceDetailsDialog from '../salesInvoices/components/InvoiceDetailsDialog';
import ReceiptDialog from '../receipts/components/ReceiptDialog';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  }).format(new Date(dateStr));
};

export const CustomerLedgerPage = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog States
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceDetailsOpen, setInvoiceDetailsOpen] = useState(false);
  
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  const fetchLedgerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [custData, invData, rcptData] = await Promise.all([
        getCustomerById(customerId),
        getInvoicesByCustomer(customerId),
        getReceiptsByCustomer(customerId)
      ]);
      setCustomer(custData);

      const entries = [];

      invData.forEach(inv => {
        if (inv.status !== 'void') {
          entries.push({
            id: inv.invoice_id,
            date: inv.invoice_date,
            created_at: inv.created_at,
            refNo: inv.invoice_no,
            type: 'Invoice',
            description: `Sales Invoice (${inv.invoice_type === 'GST' ? 'GST' : 'Retail'})`,
            debit: parseFloat(inv.total_amount || 0),
            credit: 0,
            originalRecord: inv
          });
        }
      });

      rcptData.forEach(rcpt => {
        let desc = `Payment via ${rcpt.mode.toUpperCase()}`;
        if (rcpt.sales_invoices) {
          desc += ` (Ref: ${rcpt.sales_invoices.invoice_no})`;
        }
        entries.push({
          id: rcpt.receipt_id,
          date: rcpt.receipt_date,
          created_at: rcpt.created_at,
          refNo: rcpt.receipt_id.substring(0, 8).toUpperCase(),
          type: 'Receipt',
          description: desc,
          debit: 0,
          credit: parseFloat(rcpt.amount || 0),
          originalRecord: rcpt
        });
      });

      entries.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return new Date(a.created_at) - new Date(b.created_at);
      });

      let currentBalance = parseFloat(custData.opening_balance || 0);
      entries.forEach(entry => {
        currentBalance = currentBalance + entry.debit - entry.credit;
        entry.runningBalance = currentBalance;
      });

      setLedgerEntries(entries);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    if (customerId) {
      fetchLedgerData();
    }
  }, [customerId, fetchLedgerData]);

  const handleViewClick = (entry) => {
    if (entry.type === 'Invoice') {
      setSelectedInvoiceId(entry.id);
      setInvoiceDetailsOpen(true);
    } else if (entry.type === 'Receipt') {
      setSelectedReceipt(entry.originalRecord);
      setReceiptDialogOpen(true);
    }
  };

  const handlePrintLedger = () => {
    window.print();
  };

  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #ledger-print-container, #ledger-print-container * {
        visibility: visible;
      }
      #ledger-print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  `;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!customer) {
    return <Typography>Customer not found.</Typography>;
  }

  return (
    <Box id="ledger-print-container">
      <style>{printStyles}</style>
      
      {/* Action Bar (Not Printed) */}
      <Box className="no-print" display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => navigate('/dashboard/customers')}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h5" fontWeight={800} color="primary.main">
            Customer Ledger
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrintLedger}>
          Print Statement
        </Button>
      </Box>

      {/* Customer Info Section */}
      <Paper variant="outlined" sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              {customer.name}
            </Typography>
            {customer.identification_name && (
              <Typography variant="body2" color="text.secondary">
                {customer.identification_name}
              </Typography>
            )}
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Phone:</strong> {customer.phone || '—'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              <strong>GSTIN:</strong> {customer.gstin || '—'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
              <strong>Address:</strong> {customer.address || '—'}
            </Typography>
          </Grid>
          <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
            <Box mb={2}>
              <Typography variant="caption" color="text.secondary" display="block">
                OPENING BALANCE
              </Typography>
              <Typography variant="h6">
                {formatCurrency(customer.opening_balance)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                CURRENT OUTSTANDING
              </Typography>
              <Typography variant="h5" fontWeight={800} color={customer.outstanding_balance > 0 ? 'error.main' : 'success.main'}>
                {formatCurrency(customer.outstanding_balance)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Ledger Table Section */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.03)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Ref No.</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Debit (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Credit (₹)</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Balance (₹)</TableCell>
              <TableCell className="no-print" sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Opening Balance Row */}
            <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.01)' }}>
              <TableCell colSpan={6} align="right" sx={{ fontWeight: 600 }}>Opening Balance</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(customer.opening_balance)}</TableCell>
              <TableCell className="no-print"></TableCell>
            </TableRow>
            
            {/* Transaction Rows */}
            {ledgerEntries.map((entry, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{formatDate(entry.date)}</TableCell>
                <TableCell>{entry.refNo}</TableCell>
                <TableCell>{entry.type}</TableCell>
                <TableCell>{entry.description}</TableCell>
                <TableCell align="right" sx={{ color: entry.debit > 0 ? 'error.main' : 'inherit' }}>
                  {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                </TableCell>
                <TableCell align="right" sx={{ color: entry.credit > 0 ? 'success.main' : 'inherit' }}>
                  {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>
                  {formatCurrency(entry.runningBalance)}
                </TableCell>
                <TableCell className="no-print" align="center">
                  <Tooltip title="View Details">
                    <IconButton size="small" onClick={() => handleViewClick(entry)}>
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {ledgerEntries.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No transactions found for this customer.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Invoice Details Dialog Viewer */}
      <InvoiceDetailsDialog
        open={invoiceDetailsOpen}
        onClose={() => setInvoiceDetailsOpen(false)}
        invoiceId={selectedInvoiceId}
        onEdit={(invoice) => {
          setInvoiceDetailsOpen(false);
          navigate('/dashboard/invoices');
        }}
      />

      {/* Receipt Viewer / Editor */}
      <ReceiptDialog
        open={receiptDialogOpen}
        onClose={() => setReceiptDialogOpen(false)}
        onSaveSuccess={() => {
           setReceiptDialogOpen(false);
           fetchLedgerData();
        }}
        editReceipt={selectedReceipt}
      />
    </Box>
  );
};

export default CustomerLedgerPage;

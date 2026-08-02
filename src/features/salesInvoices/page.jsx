import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  Chip,
  Tooltip,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';

import { useLocation, useNavigate } from 'react-router-dom';
import { getSalesInvoices, deleteSalesInvoice, voidSalesInvoice } from './api';
import { updateJobStatus } from '../jobCards/api';
import InvoiceDialog from './components/InvoiceDialog';
import InvoiceDetailsDialog from './components/InvoiceDetailsDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';

const STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: 'error' },
  partial: { label: 'Partial', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  void: { label: 'Void', color: 'default' },
};

export const SalesInvoicesPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kickoff job card state
  const [kickoffJob, setKickoffJob] = useState(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Deletion Safeguard Dialogs
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  // Void confirmation dialog
  const [voidOpen, setVoidOpen] = useState(false);
  const [invoiceToVoid, setInvoiceToVoid] = useState(null);
  const [voidLoading, setVoidLoading] = useState(false);
  const [voidError, setVoidError] = useState(null);

  const fetchInvoices = useCallback(async (query, filter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalesInvoices(query, filter);
      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchInvoices(searchQuery, statusFilter);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, statusFilter, fetchInvoices]);

  // Handle incoming kickoff job card from navigation state
  useEffect(() => {
    if (location.state?.kickoffJob) {
      setKickoffJob(location.state.kickoffJob);
      setCreateOpen(true);
    }
  }, [location.state]);

  const handleCreateClick = () => {
    setCreateOpen(true);
  };

  const handleViewClick = (invoice) => {
    setSelectedInvoiceId(invoice.invoice_id);
    setDetailsOpen(true);
  };

  const handleVoidClick = (invoice) => {
    setInvoiceToVoid(invoice);
    setVoidError(null);
    setVoidOpen(true);
  };

  const handleCloseCreate = () => {
    if (kickoffJob) {
      setKickoffJob(null);
      // Revert/Navigate back to Job Cards with a cancel flag
      navigate('/dashboard/jobs', { replace: true, state: { cancelKickoff: true, jobId: kickoffJob.job_id } });
    }
    setCreateOpen(false);
  };

  const handleSaveSuccess = async () => {
    if (kickoffJob) {
      try {
        await updateJobStatus(kickoffJob.job_id, 'in_progress');
      } catch (err) {
        console.error('Failed to automatically transition job card to design:', err);
      }
      setKickoffJob(null);
      // Clean location state to avoid reopening dialog
      navigate(location.pathname, { replace: true, state: {} });
    }
    fetchInvoices(searchQuery, statusFilter);
  };

  const handleVoidConfirm = async () => {
    if (!invoiceToVoid) return;
    setVoidLoading(true);
    setVoidError(null);
    try {
      await voidSalesInvoice(invoiceToVoid.invoice_id);
      setVoidOpen(false);
      setInvoiceToVoid(null);
      fetchInvoices(searchQuery, statusFilter);
    } catch (err) {
      console.error(err);
      setVoidError(err.message || 'Failed to void invoice.');
    } finally {
      setVoidLoading(false);
    }
  };

  const handleDeleteClick = async (invoice) => {
    // 1. Finalized invoices (paid, partial, void) cannot be deleted under any circumstances
    if (invoice.status !== 'unpaid') {
      setInvoiceToDelete(invoice);
      setDependencyDetails([
        {
          label: 'Status restrictions',
          count: 1,
          examples: [`Invoice has finalized status: ${invoice.status.toUpperCase()}`],
        },
      ]);
      setCannotDeleteOpen(true);
      return;
    }

    // 2. Query references in database (e.g. linked receipts)
    setLoading(true);
    try {
      const res = await checkReferences('sales_invoices', invoice.invoice_id);
      if (res.hasReferences) {
        setInvoiceToDelete(invoice);
        setDependencyDetails(res.details);
        setCannotDeleteOpen(true);
      } else {
        setInvoiceToDelete(invoice);
        setDeleteError(null);
        setDeleteOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to run dependency audits on this invoice.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!invoiceToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteSalesInvoice(invoiceToDelete.invoice_id);
      setDeleteOpen(false);
      setInvoiceToDelete(null);
      fetchInvoices(searchQuery, statusFilter);
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete invoice.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={auto => 'auto'}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Sales Invoices
          </Typography>
        </Grid>
        <Grid item xs={12} sm={auto => 'auto'}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Create Invoice
          </Button>
        </Grid>
      </Grid>

      {/* Search and Tabs */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by invoice number or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2, mb: 2 }}
        />

        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs
            value={statusFilter}
            onChange={(e, val) => setStatusFilter(val)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Invoices" value="all" />
            <Tab label="Unpaid" value="unpaid" />
            <Tab label="Partial" value="partial" />
            <Tab label="Paid" value="paid" />
            <Tab label="Void" value="void" />
          </Tabs>
        </Paper>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Grid Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Invoice No</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Total Amount</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Amount Paid</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width="40%" /></TableCell>
                  <TableCell><Skeleton width="40%" /></TableCell>
                  <TableCell><Skeleton width="70%" /></TableCell>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell align="right"><Skeleton width="30%" sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="right"><Skeleton width="30%" sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="40%" sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="60%" sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No invoices found. Click "Create Invoice" to record sales billing.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.invoice_id} hover>
                  <TableCell sx={{ fontWeight: 700, color: 'primary.main' }}>{inv.invoice_no}</TableCell>
                  <TableCell>
                    <Chip label={inv.invoice_type === 'GST' ? 'GST' : 'Non-GST'} size="small" variant="outlined" color={inv.invoice_type === 'GST' ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{inv.customers?.name || '—'}</TableCell>
                  <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(inv.total_amount)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                    {formatCurrency(inv.amount_paid)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={STATUS_MAP[inv.status]?.label || inv.status}
                      color={STATUS_MAP[inv.status]?.color || 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Details">
                      <IconButton color="info" onClick={() => handleViewClick(inv)} size="small" sx={{ mr: 0.5 }}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={inv.status === 'void' ? 'Already Void' : 'Void Invoice'}>
                      <IconButton
                        color="warning"
                        onClick={() => handleVoidClick(inv)}
                        disabled={inv.status === 'void'}
                        size="small"
                        sx={{ mr: 0.5 }}
                      >
                        <BlockIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDeleteClick(inv)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog Form */}
      <InvoiceDialog
        open={createOpen}
        onClose={handleCloseCreate}
        onSaveSuccess={handleSaveSuccess}
        preselectedJob={kickoffJob}
      />

      {/* Details Dialog */}
      <InvoiceDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        invoiceId={selectedInvoiceId}
      />

      {/* Cannot Delete Warn Dialog */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={invoiceToDelete?.invoice_no}
        recordType="sales invoice"
        details={dependencyDetails}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete invoice <strong>{invoiceToDelete?.invoice_no}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Void Confirmation */}
      <Dialog open={voidOpen} onClose={() => !voidLoading && setVoidOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Void Invoice</DialogTitle>
        <DialogContent>
          {voidError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voidError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to void invoice <strong>{invoiceToVoid?.invoice_no}</strong>?
            Its status will be updated to void, and it will remain in records for accounting safety audits.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setVoidOpen(false)} disabled={voidLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleVoidConfirm} color="warning" variant="contained" disabled={voidLoading}>
            {voidLoading ? 'Voiding...' : 'Void Invoice'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalesInvoicesPage;

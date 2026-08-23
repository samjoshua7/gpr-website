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
  Snackbar,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';

import { useLocation, useNavigate } from 'react-router-dom';
import { getSalesInvoices, deleteSalesInvoice, voidSalesInvoice, getInvoiceTaskProgress } from './api';
import { getCompanySettings } from '../settings/api';
import { updateJobStatus } from '../jobCards/api';
import InvoiceDialog from './components/InvoiceDialog';
import InvoiceDetailsDialog from './components/InvoiceDetailsDialog';
import PageToolbar from '../../components/layout/PageToolbar';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';
import { SearchInput } from '../../components/ui/SearchInput';
import { HighlightText } from '../../components/ui/HighlightText';
import { TablePagination, TableSortLabel, Stack } from '@mui/material';
import { formatDate } from '../../lib/formatDate';
import { useGprError } from '../../app/providers/ErrorProvider';
import { useAuth } from '../../hooks/useAuth';

const STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: 'error' },
  partial: { label: 'Partial', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  void: { label: 'Void', color: 'default' },
};

const headCells = [
  { id: 'invoice_date', label: 'Date', align: 'left' },
  { id: 'invoice_no', label: 'Invoice No', align: 'left' },
  { id: 'customer_name', label: 'Customer Name', align: 'left' },
  { id: 'total_amount', label: 'Total Amount', align: 'right' },
  { id: 'amount_paid', label: 'Amount Paid', align: 'right' },
  { id: 'status', label: 'Payment Status', align: 'center' },
  { id: 'actions', label: 'Actions', align: 'center', disableSort: true },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

const getShortInvoiceNo = (fullNo) => {
  if (!fullNo) return '';
  const parts = fullNo.split('/');
  return parts[parts.length - 1] || fullNo;
};

const getProgressInfo = (inv, activeWorkflow = []) => {
  const workflowList = activeWorkflow && activeWorkflow.length > 0 ? activeWorkflow : [
    'New Orders', 'Designing', 'Proof', 'Printing', 'Additional works', 'Cutting', 'Packing', 'Out for Delivery', 'Delivered'
  ];

  // 1. Check direct linked Job Card
  if (inv?.job_cards && inv.job_cards.status) {
    const stageIdx = workflowList.indexOf(inv.job_cards.status);
    const fraction = stageIdx >= 0 ? (stageIdx + 1) / workflowList.length : 0;
    const percent = Math.round(fraction * 100);
    const jcNum = `JC-${String(inv.job_cards.job_number || 0).padStart(4, '0')}`;

    let color = 'default';
    let variant = 'outlined';
    if (percent >= 100) {
      color = 'success';
      variant = 'filled';
    } else if (percent >= 60) {
      color = 'primary';
    } else if (percent >= 30) {
      color = 'warning';
    } else {
      color = 'error';
    }

    return {
      percent,
      color,
      variant,
      tooltip: `${jcNum}: ${inv.job_cards.status} (${percent}%) - ${inv.job_cards.description || 'Job Card'}`,
    };
  }

  return null;
};

export const SalesInvoicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showGprError } = useGprError();
  const { profile } = useAuth();
  const isStakeholder = profile?.role === 'STAKEHOLDER';

  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('invoice_date');
  const [order, setOrder] = useState('desc');

  const [taskProgressMap, setTaskProgressMap] = useState({});
  const [workflow, setWorkflow] = useState([]);

  // Kickoff job card state
  const [kickoffJob, setKickoffJob] = useState(null);

  // Dialog states
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceToEdit, setInvoiceToEdit] = useState(null);

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

  // In-app auto-created job notification
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleCloneInvoice = (invoiceData) => {
    setDetailsOpen(false); // Close details dialog
    // Map existing items, stripping out ids, and resetting invoice data
    const clonedItems = (invoiceData.items || []).map(item => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      amount: item.amount,
      hsn_code: item.hsn_code || '',
      discount_amount: item.discount_amount || 0,
      gst_rate: item.gst_rate || 0,
      tax_amount: item.tax_amount || 0
    }));

    const clonedInvoice = {
      ...invoiceData,
      invoice_id: undefined, // ensure it's treated as new
      invoice_no: '', 
      invoice_date: new Date().toISOString().split('T')[0],
      amount_paid: 0,
      status: 'unpaid',
      items: clonedItems,
    };

    setInvoiceToEdit(clonedInvoice);
    setCreateOpen(true);
  };

  const fetchInvoices = useCallback(async (filter) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSalesInvoices('', filter);
      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices(statusFilter);
  }, [statusFilter, fetchInvoices]);

  const processedInvoices = React.useMemo(() => {
    let result = [...invoices];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(inv => 
        (inv.invoice_no || '').toLowerCase().includes(q) ||
        (inv.customers?.name || '').toLowerCase().includes(q)
      );
    }

    if (orderBy) {
      result.sort((a, b) => {
        let valA = orderBy === 'customer_name' ? a.customers?.name : a[orderBy];
        let valB = orderBy === 'customer_name' ? b.customers?.name : b[orderBy];
        
        valA = valA == null ? '' : valA;
        valB = valB == null ? '' : valB;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;

        if (orderBy === 'invoice_date') {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();
          if (dateA < dateB) return order === 'asc' ? -1 : 1;
          if (dateA > dateB) return order === 'asc' ? 1 : -1;
        }

        return 0;
      });
    }

    return result;
  }, [invoices, searchQuery, orderBy, order]);

  const paginatedInvoices = React.useMemo(() => {
    const start = page * rowsPerPage;
    return processedInvoices.slice(start, start + rowsPerPage);
  }, [processedInvoices, page, rowsPerPage]);

  useEffect(() => {
    const loadTaskProgress = async () => {
      if (!paginatedInvoices || paginatedInvoices.length === 0) return;
      const ids = paginatedInvoices.map((inv) => inv.invoice_id);
      try {
        const [progressData, settings] = await Promise.all([
          getInvoiceTaskProgress(ids),
          getCompanySettings(),
        ]);
        setTaskProgressMap((prev) => ({ ...prev, ...progressData }));
        if (settings?.production_workflow) {
          setWorkflow(settings.production_workflow);
        }
      } catch (err) {
        console.error('Failed to load invoice task progress:', err);
      }
    };

    loadTaskProgress();
  }, [paginatedInvoices]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, statusFilter]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle incoming kickoff job card or preselected customer from navigation state
  useEffect(() => {
    if (location.state?.kickoffJob) {
      setKickoffJob(location.state.kickoffJob);
      setCreateOpen(true);
    } else if (location.state?.preselectedCustomer) {
      setInvoiceToEdit(null);
      setCreateOpen(true);
    }
  }, [location.state]);

  const handleCreateClick = () => {
    setInvoiceToEdit(null);
    setCreateOpen(true);
  };

  const handleViewClick = (invoice) => {
    setSelectedInvoiceId(invoice.invoice_id);
    setDetailsOpen(true);
  };

  const handleEditClick = (invoice) => {
    setDetailsOpen(false);
    setInvoiceToEdit(invoice);
    setCreateOpen(true);
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
    if (location.state?.preselectedCustomer) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    setInvoiceToEdit(null);
    setCreateOpen(false);
  };

  const handleSaveSuccess = async (savedResult) => {
    if (kickoffJob) {
      setKickoffJob(null);
      // Clean location state to avoid reopening dialog
      navigate(location.pathname, { replace: true, state: {} });
    } else if (savedResult?.autoCreatedJob) {
      const jcNum = `JC-${String(savedResult.autoCreatedJob.job_number || 0).padStart(4, '0')}`;
      setNotificationMessage(`Job Card ${jcNum} was automatically created and linked for Invoice ${savedResult.invoice_no}.`);
      setNotificationOpen(true);
    }
    fetchInvoices(statusFilter);
  };

  const handleVoidConfirm = async () => {
    if (!invoiceToVoid) return;
    setVoidLoading(true);
    setVoidError(null);
    try {
      await voidSalesInvoice(invoiceToVoid.invoice_id);
      setVoidOpen(false);
      setInvoiceToVoid(null);
      fetchInvoices(statusFilter);
    } catch (err) {
      console.error(err);
      setVoidError(err.message || 'Failed to void invoice.');
      showGprError(err, {
        title: 'Failed to Void Sales Invoice',
        actionContext: `Voiding Invoice #${invoiceToVoid?.invoice_no}`,
        payload: {
          invoice_id: invoiceToVoid?.invoice_id,
          invoice_no: invoiceToVoid?.invoice_no,
          customer_name: invoiceToVoid?.customers?.name,
          status: invoiceToVoid?.status,
        },
      });
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
      showGprError(err, {
        title: 'Failed to run dependency checks for invoice deletion',
        actionContext: `Checking dependencies for Invoice #${invoice?.invoice_no}`,
        payload: { invoice_id: invoice?.invoice_id, invoice_no: invoice?.invoice_no },
      });
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
      fetchInvoices(statusFilter);
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete invoice.');
      showGprError(err, {
        title: 'Failed to Delete Sales Invoice',
        actionContext: `Deleting Invoice #${invoiceToDelete?.invoice_no}`,
        payload: {
          invoice_id: invoiceToDelete?.invoice_id,
          invoice_no: invoiceToDelete?.invoice_no,
          customer_id: invoiceToDelete?.customer_id,
          status: invoiceToDelete?.status,
        },
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      <PageToolbar
        title="Sales Invoices"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by invoice number or customer name..."
        actions={
          <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleCreateClick}
                disabled={isStakeholder}
                sx={{
                  whiteSpace: 'nowrap',
                  ...(isStakeholder ? { color: 'text.disabled', bgcolor: 'action.disabledBackground' } : {}),
                }}
              >
                Create Invoice
              </Button>
            </span>
          </Tooltip>
        }
      />

      {/* Tabs */}
      <Box sx={{ mb: 3 }}>

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
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.align}
                  sx={{ fontWeight: 700 }}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && invoices.length === 0 ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width="50%" /></TableCell>
                  <TableCell><Skeleton width="60%" /></TableCell>
                  <TableCell><Skeleton width="70%" /></TableCell>
                  <TableCell align="right"><Skeleton width="40%" sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="60%" sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="60%" sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : paginatedInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No invoices found. Click "Create Invoice" to record sales billing.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInvoices.map((inv) => (
                <TableRow key={inv.invoice_id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatDate(inv.invoice_date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {(() => {
                      const shortNo = getShortInvoiceNo(inv.invoice_no);
                      const progressInfo = getProgressInfo(inv, workflow);
                      return (
                        <Box display="flex" alignItems="center" gap={0.75}>
                          <Tooltip title={`Full Invoice No: ${inv.invoice_no}`} arrow placement="top">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                              }}
                              onClick={() => handleViewClick(inv)}
                            >
                              <HighlightText text={shortNo} highlight={searchQuery} />
                            </Typography>
                          </Tooltip>
                          <Chip
                            label={inv.invoice_type === 'GST' ? 'GST' : 'Non-GST'}
                            size="small"
                            variant="outlined"
                            color={inv.invoice_type === 'GST' ? 'primary' : 'default'}
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                          {progressInfo && (
                            <Tooltip title={progressInfo.tooltip} arrow placement="top">
                              <Chip
                                label={`${progressInfo.percent}%`}
                                size="small"
                                color={progressInfo.color}
                                variant={progressInfo.variant}
                                sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }}
                              />
                            </Tooltip>
                          )}
                        </Box>
                      );
                    })()}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Tooltip title={inv.customers?.name || ''} arrow placement="top" disableHoverListener={!inv.customers?.name || inv.customers.name.length < 25}>
                      <Typography variant="body2" component="span" sx={{ fontWeight: 600, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <HighlightText text={inv.customers?.name || '—'} highlight={searchQuery} />
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {formatCurrency(inv.total_amount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: inv.amount_paid > 0 ? 'success.main' : 'text.secondary' }}>
                    {formatCurrency(inv.amount_paid)}
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Chip
                      label={STATUS_MAP[inv.status]?.label || inv.status}
                      color={STATUS_MAP[inv.status]?.color || 'default'}
                      size="small"
                      sx={{ fontWeight: 600, height: 22, fontSize: '0.75rem', minWidth: 70 }}
                    />
                  </TableCell>
                  <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="View Details">
                      <IconButton color="info" onClick={() => handleViewClick(inv)} size="small">
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[25, 50, 100]}
        component="div"
        count={processedInvoices.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
      />

      {/* Details Viewer */}
      <InvoiceDetailsDialog
        open={detailsOpen}
        onClose={() => {
          setDetailsOpen(false);
          loadData(true);
        }}
        invoiceId={selectedInvoiceId}
        onEdit={handleEditClick}
        onClone={handleCloneInvoice}
        onVoid={handleVoidClick}
        onDelete={handleDeleteClick}
      />

      {/* Dialog Form */}
      <InvoiceDialog
        open={createOpen}
        onClose={handleCloseCreate}
        onSaveSuccess={handleSaveSuccess}
        preselectedJob={kickoffJob}
        preselectedCustomer={location.state?.preselectedCustomer}
        editInvoice={invoiceToEdit}
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

      <Snackbar
        open={notificationOpen}
        autoHideDuration={5000}
        onClose={() => setNotificationOpen(false)}
        message={notificationMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default SalesInvoicesPage;

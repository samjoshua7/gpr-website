import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
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
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TablePagination, TableSortLabel, Stack, Tooltip } from '@mui/material';
import { SearchInput } from '../../components/ui/SearchInput';
import PageToolbar from '../../components/layout/PageToolbar';
import { HighlightText } from '../../components/ui/HighlightText';

import { getReceipts, deleteReceipt } from './api';
import ReceiptDialog from './components/ReceiptDialog';
import ReceiptDetailsDialog from './components/ReceiptDetailsDialog';
import { formatDate } from '../../lib/formatDate';

const MODE_MAP = {
  cash: { label: 'Cash', color: 'success' },
  upi: { label: 'UPI / Digital', color: 'primary' },
  bank: { label: 'Bank Transfer', color: 'info' },
  cheque: { label: 'Cheque', color: 'secondary' },
};

const headCells = [
  { id: 'receipt_date', label: 'Receipt Date', align: 'left' },
  { id: 'customer_name', label: 'Customer Name', align: 'left' },
  { id: 'mode', label: 'Payment Mode', align: 'left' },
  { id: 'invoice_no', label: 'Linked Invoice', align: 'left' },
  { id: 'amount', label: 'Amount', align: 'right' },
  { id: 'actions', label: 'Action', align: 'center', disableSort: true }
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const ReceiptsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('receipt_date');
  const [order, setOrder] = useState('desc');
  // View and Edit dialog states
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedReceiptForView, setSelectedReceiptForView] = useState(null);
  const [editReceipt, setEditReceipt] = useState(null);

  // Dialog Add state
  const [createOpen, setCreateOpen] = useState(false);

  // Void/Delete receipt confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  useEffect(() => {
    if (location.state?.preselectedCustomer) {
      setEditReceipt(null);
      setCreateOpen(true);
    }
  }, [location.state]);

  const processedReceipts = React.useMemo(() => {
    let result = [...receipts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r => 
        (r.customers?.name || '').toLowerCase().includes(q) ||
        (r.mode || '').toLowerCase().includes(q) ||
        (r.sales_invoices?.invoice_no || '').toLowerCase().includes(q)
      );
    }

    if (orderBy) {
      result.sort((a, b) => {
        let valA = orderBy === 'customer_name' ? a.customers?.name : orderBy === 'invoice_no' ? a.sales_invoices?.invoice_no : a[orderBy];
        let valB = orderBy === 'customer_name' ? b.customers?.name : orderBy === 'invoice_no' ? b.sales_invoices?.invoice_no : b[orderBy];
        
        valA = valA == null ? '' : valA;
        valB = valB == null ? '' : valB;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [receipts, searchQuery, orderBy, order]);

  const paginatedReceipts = React.useMemo(() => {
    const start = page * rowsPerPage;
    return processedReceipts.slice(start, start + rowsPerPage);
  }, [processedReceipts, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

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

  const handleAddClick = () => {
    setEditReceipt(null);
    setCreateOpen(true);
  };

  const handleViewClick = (receipt) => {
    setSelectedReceiptForView(receipt);
    setDetailsOpen(true);
  };

  const handleEditClick = (receipt) => {
    setEditReceipt(receipt);
    setDetailsOpen(false);
    setCreateOpen(true);
  };

  const handleCloneClick = (receipt) => {
    setEditReceipt({
      ...receipt,
      receipt_id: undefined,
    });
    setDetailsOpen(false);
    setCreateOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchReceipts();
  };

  const handleDeleteClick = (receipt) => {
    setReceiptToDelete(receipt);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!receiptToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteReceipt(receiptToDelete.receipt_id);
      setDeleteOpen(false);
      setReceiptToDelete(null);
      fetchReceipts();
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete receipt.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <PageToolbar
        title="Customer Receipts"
        subtitle="Manage payments from customer accounts and invoices. Outstanding invoice balances sync in real-time."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by customer name, mode, or linked invoice..."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
            Record Payment
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Receipts Table */}
      {loading && receipts.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : receipts.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No customer receipts found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
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
              {paginatedReceipts.map((receipt) => (
                <TableRow key={receipt.receipt_id} hover>
                  <TableCell>{formatDate(receipt.receipt_date)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <HighlightText text={receipt.customers?.name} highlight={searchQuery} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={<HighlightText text={MODE_MAP[receipt.mode]?.label || receipt.mode} highlight={searchQuery} />}
                      color={MODE_MAP[receipt.mode]?.color || 'default'}
                      size="small"
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {receipt.sales_invoices ? (
                      <Chip
                        label={<HighlightText text={`#${receipt.sales_invoices.invoice_no}`} highlight={searchQuery} />}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip label="Advance / Account" size="small" color="secondary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {formatCurrency(receipt.amount)}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Receipt Details">
                        <IconButton size="small" color="primary" onClick={() => handleViewClick(receipt)}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Receipt">
                        <IconButton size="small" color="info" onClick={() => handleEditClick(receipt)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Clone Receipt">
                        <IconButton size="small" color="default" onClick={() => handleCloneClick(receipt)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Receipt">
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(receipt)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {receipts.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={processedReceipts.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        />
      )}

      {/* Record/Edit receipt modal */}
      <ReceiptDialog
        open={createOpen}
        onClose={() => {
          if (location.state?.preselectedCustomer) {
            navigate(location.pathname, { replace: true, state: {} });
          }
          setCreateOpen(false);
          setEditReceipt(null);
        }}
        onSaveSuccess={handleSaveSuccess}
        editReceipt={editReceipt}
        preselectedCustomer={location.state?.preselectedCustomer}
      />

      {/* View receipt details modal */}
      <ReceiptDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        receiptId={selectedReceiptForView?.receipt_id}
        onEdit={handleEditClick}
        onClone={handleCloneClick}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Void Payment Receipt</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete this payment receipt of{' '}
            <strong>{formatCurrency(receiptToDelete?.amount)}</strong> for{' '}
            <strong>{receiptToDelete?.customers?.name}</strong>?
            Deleting it will instantly reduce the amount paid on the linked invoice and revert its status.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Delete Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptsPage;

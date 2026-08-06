import React, { useState, useEffect, useCallback } from 'react';
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
import { TablePagination, TableSortLabel, Stack } from '@mui/material';
import { SearchInput } from '../../components/ui/SearchInput';
import { HighlightText } from '../../components/ui/HighlightText';

import { getReceipts, deleteReceipt } from './api';
import ReceiptDialog from './components/ReceiptDialog';

const MODE_MAP = {
  cash: { label: 'Cash', color: 'success' },
  upi: { label: 'UPI / Digital', color: 'primary' },
  bank: { label: 'Bank Transfer', color: 'info' },
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

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric'
});

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return dateFormatter.format(new Date(dateStr));
};

export const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('receipt_date');
  const [order, setOrder] = useState('desc');

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

  const processedReceipts = React.useMemo(() => {
    let result = [...receipts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.customers?.name || '').toLowerCase().includes(q) ||
        (r.sales_invoices?.invoice_no || '').toLowerCase().includes(q) ||
        (r.mode || '').toLowerCase().includes(q)
      );
    }

    if (orderBy) {
      result.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];

        if (orderBy === 'customer_name') {
          valA = a.customers?.name;
          valB = b.customers?.name;
        } else if (orderBy === 'invoice_no') {
          valA = a.sales_invoices?.invoice_no;
          valB = b.sales_invoices?.invoice_no;
        }

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
    <Box sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Standard Toolbar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
        <SearchInput
          sx={{ flex: '6 1 0', minWidth: 0, bgcolor: 'background.paper', borderRadius: 1 }}
          placeholder="Search by customer name, mode, or linked invoice..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Button
          sx={{ flex: '2 1 0', minWidth: 0 }}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
        >
          Record Payment
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Receipts Table */}
      {loading && receipts.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8, flexGrow: 1 }}>
          <CircularProgress />
        </Box>
      ) : receipts.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 1, flexGrow: 1 }}>
          <Typography color="text.secondary">No customer receipts found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
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
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteClick(receipt)}
                      size="small"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
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
          component={Paper}
          sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }}
        />
      )}

      {/* Record receipt modal */}
      <ReceiptDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSaveSuccess={handleSaveSuccess}
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

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
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';

import { getReceipts, deleteReceipt } from './api';
import ReceiptDialog from './components/ReceiptDialog';

const MODE_MAP = {
  cash: { label: 'Cash', color: 'success' },
  upi: { label: 'UPI / Digital', color: 'primary' },
  bank: { label: 'Bank Transfer', color: 'info' },
};

export const ReceiptsPage = () => {
  const [receipts, setReceipts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog Add state
  const [createOpen, setCreateOpen] = useState(false);

  // Void/Delete receipt confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [receiptToDelete, setReceiptToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchReceipts = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReceipts(query);
      setReceipts(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load receipts.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts(searchQuery);
  }, [searchQuery, fetchReceipts]);

  const handleAddClick = () => {
    setCreateOpen(true);
  };

  const handleSaveSuccess = () => {
    fetchReceipts(searchQuery);
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
      fetchReceipts(searchQuery);
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete receipt.');
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
    <Box sx={{ p: 4 }}>
      {/* Header section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Customer Receipts
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage payments from customer accounts and invoices. Outstanding invoice balances sync in real-time.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="large">
          Record Payment
        </Button>
      </Box>

      {/* Filters and search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search by customer name, mode, or linked invoice..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

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
                <TableCell sx={{ fontWeight: 700 }}>Receipt Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Payment Mode</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Linked Invoice</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Amount</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {receipts.map((receipt) => (
                <TableRow key={receipt.receipt_id} hover>
                  <TableCell>{formatDate(receipt.receipt_date)}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{receipt.customers?.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={MODE_MAP[receipt.mode]?.label || receipt.mode}
                      color={MODE_MAP[receipt.mode]?.color || 'default'}
                      size="small"
                      sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {receipt.sales_invoices ? (
                      <Chip
                        label={`#${receipt.sales_invoices.invoice_no}`}
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

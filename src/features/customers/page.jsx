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
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { getCustomers, deleteCustomer } from './api';
import CustomerDialog from './components/CustomerDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';

export const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add/Edit Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Delete Confirmation State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Deletion reference check states
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  // Fetch customers
  const fetchCustomers = useCallback(async (query) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCustomers(query);
      setCustomers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load & search execution
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchCustomers(searchQuery);
    }, 400); // Debounce search

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, fetchCustomers]);

  const handleAddClick = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (customer) => {
    setLoading(true);
    try {
      const res = await checkReferences('customers', customer.customer_id);
      if (res.hasReferences) {
        setCustomerToDelete(customer);
        setDependencyDetails(res.details);
        setCannotDeleteOpen(true);
      } else {
        setCustomerToDelete(customer);
        setDeleteError(null);
        setDeleteOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to check database references for this customer.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteCustomer(customerToDelete.customer_id);
      setDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(searchQuery); // Refresh list
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete customer. Ensure they have no linked jobs/invoices.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchCustomers(searchQuery);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 3 } }}>
      {/* Page Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item xs={12} sm={auto => 'auto'}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Customers
          </Typography>
        </Grid>
        <Grid item xs={12} sm={auto => 'auto'}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Add Customer
          </Button>
        </Grid>
      </Grid>

      {/* Search Filter Card */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by customer name or phone number..."
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

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main List Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'rgba(0, 0, 0, 0.03)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Opening Balance</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Loading skeletons
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width="60%" /></TableCell>
                  <TableCell><Skeleton width="40%" /></TableCell>
                  <TableCell><Skeleton width="80%" /></TableCell>
                  <TableCell align="right"><Skeleton width="30%" sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="40%" sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              // Empty State
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    No customers found. Click "Add Customer" to register one.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              // Data Rows
              customers.map((customer) => (
                <TableRow key={customer.customer_id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{customer.name}</TableCell>
                  <TableCell>{customer.phone || '—'}</TableCell>
                  <TableCell>{customer.address || '—'}</TableCell>
                  <TableCell align="right">{formatCurrency(customer.opening_balance)}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEditClick(customer)} size="small" sx={{ mr: 1 }}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDeleteClick(customer)} size="small">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add / Edit Dialog */}
      <CustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        customer={selectedCustomer}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Cannot Delete Warning Dialog */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={customerToDelete?.name}
        recordType="customer"
        details={dependencyDetails}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete customer <strong>{customerToDelete?.name}</strong>? This action is permanent.
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
    </Box>
  );
};

export default CustomersPage;

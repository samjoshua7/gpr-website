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
  Avatar,
  Tooltip,
  Stack,
  Chip,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';

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
    }, 400);

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
      fetchCustomers(searchQuery);
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
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Page Header */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item xs={12} sm="auto">
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Customers
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage press client accounts, contact information, and balances.
          </Typography>
        </Grid>
        <Grid item xs={12} sm="auto">
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            sx={{ width: { xs: '100%', sm: 'auto' }, py: 1.1, px: 2.5, borderRadius: 2.5 }}
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
                <SearchIcon color="action" fontSize="small" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Requirement 5: Table Polish & Sticky Header */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, maxHeight: 'calc(100vh - 280px)' }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>GSTIN</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Identification Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Outstanding Balance</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton width="60%" height={24} /></TableCell>
                  <TableCell><Skeleton width="40%" height={24} /></TableCell>
                  <TableCell><Skeleton width="40%" height={24} /></TableCell>
                  <TableCell><Skeleton width="80%" height={24} /></TableCell>
                  <TableCell align="right"><Skeleton width="30%" height={24} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton width="40%" height={24} sx={{ mx: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                      No Customers Found
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Click "Add Customer" above to register your first press client.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
                <TableRow key={customer.customer_id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.875rem', fontWeight: 700 }}>
                        {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                      </Avatar>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {customer.name}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{customer.phone || '—'}</TableCell>
                  <TableCell>
                    {customer.gstin ? (
                      <Chip label={customer.gstin} size="small" color="primary" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.75rem' }} />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Unregistered</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {customer.identification_name ? (
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {customer.identification_name}
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700,
                        color: customer.outstanding_balance === 0 
                          ? 'success.main' 
                          : customer.outstanding_balance > 0 
                            ? 'warning.main' 
                            : 'info.main'
                      }}
                    >
                      {formatCurrency(customer.outstanding_balance)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Edit Customer">
                      <IconButton color="primary" onClick={() => handleEditClick(customer)} size="small" sx={{ mr: 0.5 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Customer">
                      <IconButton color="error" onClick={() => handleDeleteClick(customer)} size="small">
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

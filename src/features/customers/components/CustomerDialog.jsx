import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Alert,
  CircularProgress,
} from '@mui/material';
import { createCustomer, updateCustomer } from '../api';

export const CustomerDialog = ({ open, onClose, customer, onSaveSuccess }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0.00');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isEditMode = !!customer;

  // Initialize fields on open/customer change
  useEffect(() => {
    if (open) {
      if (customer) {
        setName(customer.name || '');
        setPhone(customer.phone || '');
        setAddress(customer.address || '');
        setOpeningBalance(customer.opening_balance?.toString() || '0.00');
      } else {
        setName('');
        setPhone('');
        setAddress('');
        setOpeningBalance('0.00');
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, customer]);

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) {
      tempErrors.name = 'Customer Name is required';
    }

    const numBalance = parseFloat(openingBalance);
    if (isNaN(numBalance)) {
      tempErrors.openingBalance = 'Opening Balance must be a number';
    } else if (numBalance < 0) {
      tempErrors.openingBalance = 'Opening Balance cannot be negative';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    const payload = {
      name: name.trim(),
      phone: phone.trim() || null,
      address: address.trim() || null,
      opening_balance: parseFloat(openingBalance),
    };

    try {
      if (isEditMode) {
        await updateCustomer(customer.customer_id, payload);
      } else {
        await createCustomer(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to save customer details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Customer Name"
            name="name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            disabled={loading}
          />

          <TextField
            margin="normal"
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />

          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={3}
            id="address"
            label="Address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />

          <TextField
            margin="normal"
            fullWidth
            required
            id="openingBalance"
            label="Opening Balance"
            name="openingBalance"
            type="number"
            inputProps={{ step: '0.01', min: '0' }}
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            error={!!errors.openingBalance}
            helperText={errors.openingBalance}
            disabled={loading || isEditMode} // Disable opening balance editing for financial safety audit
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isEditMode ? 'Update Customer' : 'Add Customer'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CustomerDialog;

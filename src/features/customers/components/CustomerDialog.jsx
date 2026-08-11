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
  Grid,
  Typography,
} from '@mui/material';
import { createCustomer, updateCustomer } from '../api';
import { formatDate } from '../../../lib/formatDate';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const CustomerDialog = ({ open, onClose, customer, onSaveSuccess }) => {
  const [name, setName] = useState('');
  const [identificationName, setIdentificationName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
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
        setIdentificationName(customer.identification_name || '');
        setPhone(customer.phone || '');
        setEmail(customer.email || '');
        setAddress(customer.address || '');
        setGstin(customer.gstin || '');
        setOpeningBalance(customer.opening_balance?.toString() || '0.00');
      } else {
        setName('');
        setIdentificationName('');
        setPhone('');
        setEmail('');
        setAddress('');
        setGstin('');
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

    if (gstin.trim()) {
      const cleanGstin = gstin.trim().toUpperCase();
      if (!GSTIN_REGEX.test(cleanGstin)) {
        tempErrors.gstin = 'Invalid GSTIN format (e.g. 33AAAAA0000A1Z5)';
      }
    }

    const numBalance = parseFloat(openingBalance);
    if (isNaN(numBalance)) {
      tempErrors.openingBalance = 'Opening Balance must be a valid number';
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
      identification_name: identificationName.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      gstin: gstin.trim().toUpperCase() || null,
      opening_balance: parseFloat(openingBalance) || 0.00,
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
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</span>
        {isEditMode && customer?.created_at && (
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Created on {formatDate(customer.created_at)}
          </Typography>
        )}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Customer Name *"
                name="name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                fullWidth
                id="identificationName"
                label="Identification Name"
                name="identificationName"
                placeholder="e.g. Church Pastor, Blue House"
                value={identificationName}
                onChange={(e) => setIdentificationName(e.target.value)}
                disabled={loading}
                helperText="Internal use only"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
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
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="normal"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </Grid>
          </Grid>

          <TextField
            margin="normal"
            fullWidth
            multiline
            rows={2}
            id="address"
            label="Billing Address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={loading}
          />

          <TextField
            margin="normal"
            fullWidth
            id="gstin"
            label="GSTIN (Optional)"
            name="gstin"
            placeholder="e.g. 33AAAAA0000A1Z5"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
            error={!!errors.gstin}
            helperText={errors.gstin || 'Leave blank if customer is unregistered for GST'}
            disabled={loading}
            inputProps={{ style: { textTransform: 'uppercase' } }}
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
            onFocus={(e) => e.target.select()}
            value={openingBalance}
            onChange={(e) => setOpeningBalance(e.target.value)}
            error={!!errors.openingBalance}
            helperText={errors.openingBalance}
            disabled={loading || isEditMode}
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

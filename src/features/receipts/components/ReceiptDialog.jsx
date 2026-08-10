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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Grid,
  Autocomplete,
  FormHelperText,
} from '@mui/material';

import { createReceipt, updateReceipt, getCustomerOutstandingInvoices } from '../api';
import { getCustomers } from '../../customers/api';

export const ReceiptDialog = ({ open, onClose, onSaveSuccess, editReceipt = null }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState('');

  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState('cash');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Initial load
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data);
        if (editReceipt && editReceipt.customer_id) {
          const matched = data.find((c) => c.customer_id === editReceipt.customer_id);
          if (matched) setSelectedCustomer(matched);
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
      } finally {
        setCustomersLoading(false);
      }
    };

    if (open) {
      fetchCustomers();
      if (editReceipt) {
        setSelectedInvoice(editReceipt.invoice_id || '');
        setAmount((editReceipt.amount || 0).toString());
        setReceiptDate(editReceipt.receipt_date || new Date().toISOString().split('T')[0]);
        setMode(editReceipt.mode || 'cash');
      } else {
        setSelectedCustomer(null);
        setInvoices([]);
        setSelectedInvoice('');
        setAmount('');
        setReceiptDate(new Date().toISOString().split('T')[0]);
        setMode('cash');
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, editReceipt]);

  // Load outstanding invoices when customer changes
  useEffect(() => {
    const loadInvoices = async () => {
      if (!selectedCustomer) {
        setInvoices([]);
        setSelectedInvoice('');
        return;
      }
      setInvoicesLoading(true);
      try {
        const list = await getCustomerOutstandingInvoices(selectedCustomer.customer_id);
        setInvoices(list);
      } catch (err) {
        console.error('Failed to load customer outstanding invoices:', err);
      } finally {
        setInvoicesLoading(false);
      }
    };
    loadInvoices();
  }, [selectedCustomer]);

  // Handle invoice selection changes (auto-fill outstanding balance)
  const handleInvoiceChange = (e) => {
    const invId = e.target.value;
    setSelectedInvoice(invId);
    if (!invId) {
      setAmount('');
      return;
    }
    const matched = invoices.find((i) => i.invoice_id === invId);
    if (matched) {
      const remaining = matched.total_amount - matched.amount_paid;
      setAmount(remaining.toFixed(2));
    }
  };

  const validate = () => {
    const tempErrors = {};
    if (!selectedCustomer) tempErrors.customerId = 'Customer is required';
    
    const amtNum = parseFloat(amount);
    if (isNaN(amtNum) || amtNum <= 0) {
      tempErrors.amount = 'Amount must be greater than 0';
    }
    if (!receiptDate) {
      tempErrors.receiptDate = 'Receipt date is required';
    }
    if (!mode) {
      tempErrors.mode = 'Payment mode is required';
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
      customer_id: selectedCustomer.customer_id,
      invoice_id: selectedInvoice || null,
      amount: parseFloat(amount),
      receipt_date: receiptDate,
      mode,
    };

    try {
      if (editReceipt && editReceipt.receipt_id) {
        await updateReceipt(editReceipt.receipt_id, payload);
      } else {
        await createReceipt(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to record payment receipt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {editReceipt && editReceipt.receipt_id ? 'Edit Payment Receipt' : 'Record Payment Receipt'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Customer Search */}
            <Grid item xs={12}>
              <Autocomplete
                id="receipt-customer-autocomplete"
                options={customers}
                getOptionLabel={(option) => `${option.name} (${option.phone || 'No Phone'})`}
                loading={customersLoading}
                value={selectedCustomer}
                onChange={(event, val) => setSelectedCustomer(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Customer *"
                    variant="outlined"
                    error={!!errors.customerId}
                    helperText={errors.customerId}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <React.Fragment>
                          {customersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </React.Fragment>
                      ),
                    }}
                  />
                )}
              />
            </Grid>

            {/* Linked Invoice */}
            <Grid item xs={12}>
              <FormControl fullWidth disabled={!selectedCustomer || invoicesLoading}>
                <InputLabel id="receipt-invoice-label">Link to Outstanding Invoice</InputLabel>
                <Select
                  labelId="receipt-invoice-label"
                  id="receipt-invoice"
                  value={selectedInvoice}
                  label="Link to Outstanding Invoice"
                  onChange={handleInvoiceChange}
                >
                  <MenuItem value="">
                    <em>None (Record as Advance / Account payment)</em>
                  </MenuItem>
                  {invoices.map((inv) => (
                    <MenuItem key={inv.invoice_id} value={inv.invoice_id}>
                      Invoice #{inv.invoice_no} (Unpaid: ₹{(inv.total_amount - inv.amount_paid).toFixed(2)})
                    </MenuItem>
                  ))}
                </Select>
                {invoicesLoading && <FormHelperText>Loading invoices...</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Amount */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Receipt Amount (₹) *"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onFocus={(e) => e.target.select()}
                error={!!errors.amount}
                helperText={errors.amount}
                inputProps={{ min: '0.01', step: '0.01' }}
                disabled={loading}
              />
            </Grid>

            {/* Payment Mode */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.mode}>
                <InputLabel id="receipt-mode-label">Payment Mode *</InputLabel>
                <Select
                  labelId="receipt-mode-label"
                  id="receipt-mode"
                  value={mode}
                  label="Payment Mode *"
                  onChange={(e) => setMode(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="upi">UPI (GPay / PhonePe)</MenuItem>
                  <MenuItem value="bank">Bank Transfer (NEFT / IMPS)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Receipt Date */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Receipt Date *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                error={!!errors.receiptDate}
                helperText={errors.receiptDate}
                disabled={loading}
              />
            </Grid>
          </Grid>
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
            Record Payment
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ReceiptDialog;

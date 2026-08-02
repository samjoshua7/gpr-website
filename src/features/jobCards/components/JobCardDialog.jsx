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
  FormHelperText,
} from '@mui/material';
import { createJobCard, updateJobCard } from '../api';
import { getCustomers } from '../../customers/api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'delivered', label: 'Delivered' },
];

export const JobCardDialog = ({ open, onClose, job, onSaveSuccess }) => {
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [status, setStatus] = useState('pending');
  const [dueDate, setDueDate] = useState('');

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isEditMode = !!job;

  // Load customer list for dropdown
  useEffect(() => {
    const fetchCustomersList = async () => {
      setCustomersLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data);
      } catch (err) {
        console.error('Failed to load customers for dropdown:', err);
      } finally {
        setCustomersLoading(false);
      }
    };

    if (open) {
      fetchCustomersList();
    }
  }, [open]);

  // Pre-fill state on open / job changes
  useEffect(() => {
    if (open) {
      if (job) {
        setCustomerId(job.customer_id || '');
        setDescription(job.description || '');
        setQuantity(job.quantity?.toString() || '');
        setStatus(job.status || 'pending');
        setDueDate(job.due_date || '');
      } else {
        setCustomerId('');
        setDescription('');
        setQuantity('');
        setStatus('pending');
        setDueDate(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, job]);

  const validate = () => {
    const tempErrors = {};
    if (!description.trim()) {
      tempErrors.description = 'Job Description is required';
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty)) {
      tempErrors.quantity = 'Quantity is required';
    } else if (qty <= 0) {
      tempErrors.quantity = 'Quantity must be greater than zero';
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
      customer_id: customerId || null,
      description: description.trim(),
      quantity: parseFloat(quantity),
      status,
      due_date: dueDate || null,
    };

    try {
      if (isEditMode) {
        await updateJobCard(job.job_id, payload);
      } else {
        await createJobCard(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to save job card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEditMode ? 'Edit Job Card' : 'Create Job Card'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {/* Customer Selection */}
          <FormControl fullWidth margin="normal" error={!!errors.customerId} disabled={loading || customersLoading}>
            <InputLabel id="customer-select-label">Customer</InputLabel>
            <Select
              labelId="customer-select-label"
              id="customer-select"
              value={customerId}
              label="Customer"
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <MenuItem value=""><em>None (Walk-in / Quote)</em></MenuItem>
              {customersLoading ? (
                <MenuItem disabled value="">
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Loading Customers...
                </MenuItem>
              ) : customers.length === 0 ? (
                <MenuItem disabled value="">
                  No customers available
                </MenuItem>
              ) : (
                customers.map((c) => (
                  <MenuItem key={c.customer_id} value={c.customer_id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </MenuItem>
                ))
              )}
            </Select>
            {errors.customerId && <FormHelperText>{errors.customerId}</FormHelperText>}
          </FormControl>

          {/* Description */}
          <TextField
            margin="normal"
            required
            fullWidth
            multiline
            rows={3}
            id="description"
            label="Job Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            disabled={loading}
          />

          {/* Quantity */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="quantity"
            label="Quantity"
            name="quantity"
            type="number"
            inputProps={{ min: '0.01', step: 'any' }}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            onFocus={(e) => e.target.select()}
            error={!!errors.quantity}
            helperText={errors.quantity}
            disabled={loading}
          />

          {/* Status */}
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel id="status-select-label">Status</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value)}
            >
              {(!job || job.status === 'pending') ? (
                <MenuItem value="pending">Pending (Quote)</MenuItem>
              ) : (
                STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))
              )}
            </Select>
            {(!job || job.status === 'pending') && (
              <FormHelperText>To move this job card to Design, use the status transition chip on the main page to prompt invoice creation.</FormHelperText>
            )}
          </FormControl>

          {/* Due Date */}
          <TextField
            margin="normal"
            fullWidth
            id="dueDate"
            label="Due Date"
            name="dueDate"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || customersLoading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isEditMode ? 'Update Job' : 'Create Job'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default JobCardDialog;

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
  Autocomplete,
} from '@mui/material';
import { createJobCard, updateJobCard } from '../api';
import { getCustomers } from '../../customers/api';
import { getCompanySettings } from '../../settings/api';

const DEFAULT_WORKFLOW = [
  'New Orders',
  'Designing',
  'Proof',
  'Printing',
  'Additional works',
  'Cutting',
  'Packing',
  'Out for Delivery',
  'Delivered',
];

export const JobCardDialog = ({ open, onClose, job, onSaveSuccess }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [status, setStatus] = useState('New Orders');
  const [dueDate, setDueDate] = useState('');
  const [workflow, setWorkflow] = useState(DEFAULT_WORKFLOW);

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isEditMode = !!job;

  // Load customer list & workflow settings
  useEffect(() => {
    const fetchInitData = async () => {
      setCustomersLoading(true);
      try {
        const [custList, settings] = await Promise.all([
          getCustomers(),
          getCompanySettings(),
        ]);
        setCustomers(custList || []);
        if (settings?.production_workflow && settings.production_workflow.length > 0) {
          setWorkflow(settings.production_workflow);
        }
      } catch (err) {
        console.error('Failed to load customers or settings:', err);
      } finally {
        setCustomersLoading(false);
      }
    };

    if (open) {
      fetchInitData();
    }
  }, [open]);

  // Pre-fill state on open / job changes
  useEffect(() => {
    if (open) {
      if (job) {
        const matched = customers.find((c) => c.customer_id === job.customer_id) || (job.customers ? {
          customer_id: job.customer_id,
          name: job.customers.name,
          phone: job.customers.phone,
          gstin: job.customers.gstin,
        } : null);

        setSelectedCustomer(matched || null);
        setDescription(job.description || '');
        setQuantity(job.quantity?.toString() || '1');
        setStatus(job.status || 'New Orders');
        setDueDate(job.due_date || '');
      } else {
        setSelectedCustomer(null);
        setDescription('');
        setQuantity('1');
        setStatus(workflow[0] || 'New Orders');
        setDueDate(new Date().toISOString().split('T')[0]);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, job, customers, workflow]);

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
      customer_id: selectedCustomer?.customer_id || null,
      description: description.trim(),
      quantity: parseFloat(quantity) || 1,
      status: status || workflow[0] || 'New Orders',
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
        {isEditMode ? `Edit Job Card (JC-${String(job.job_number || 0).padStart(4, '0')})` : 'Create New Job Card'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {/* Searchable Customer Autocomplete */}
          <Autocomplete
            options={customers}
            getOptionLabel={(option) => {
              if (!option) return '';
              const phoneStr = option.phone ? ` (${option.phone})` : '';
              return `${option.name}${phoneStr}`;
            }}
            value={selectedCustomer}
            onChange={(_, newValue) => setSelectedCustomer(newValue)}
            loading={customersLoading}
            isOptionEqualToValue={(option, val) => option.customer_id === val?.customer_id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Customer / Client"
                placeholder="Search by customer name or phone..."
                margin="normal"
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
            disabled={loading}
          />

          {/* Description */}
          <TextField
            margin="normal"
            required
            fullWidth
            multiline
            rows={3}
            id="description"
            label="Job Description / Specifications"
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

          {/* Department / Workflow Stage */}
          <FormControl fullWidth margin="normal" disabled={loading}>
            <InputLabel id="status-select-label">Department / Stage</InputLabel>
            <Select
              labelId="status-select-label"
              id="status-select"
              value={status}
              label="Department / Stage"
              onChange={(e) => setStatus(e.target.value)}
            >
              {workflow.map((stage) => (
                <MenuItem key={stage} value={stage}>
                  {stage}
                </MenuItem>
              ))}
            </Select>
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
            {isEditMode ? 'Update Job Card' : 'Save Job Card'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default JobCardDialog;


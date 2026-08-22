import React, { useState, useEffect, useMemo } from 'react';
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
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Chip,
  Tooltip,
  Divider,
} from '@mui/material';

import {
  createReceipt,
  updateReceipt,
  createReceiptWithAllocations,
  getCustomerOutstandingInvoices,
} from '../api';
import { getCustomers } from '../../customers/api';
import { useGprError } from '../../../app/providers/ErrorProvider';
import { formatDate } from '../../../lib/formatDate';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount || 0);
};

export const ReceiptDialog = ({
  open,
  onClose,
  onSaveSuccess,
  editReceipt = null,
  preselectedCustomer = null,
}) => {
  const { showError: showGprError } = useGprError();

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Checkbox selection of targeted invoices (empty array means Auto-FIFO across all invoices)
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState([]);
  const [manualAllocations, setManualAllocations] = useState({});

  const [amount, setAmount] = useState('');
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [mode, setMode] = useState('cash');

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Initial load & preselection
  useEffect(() => {
    const fetchCustomers = async () => {
      setCustomersLoading(true);
      try {
        const data = await getCustomers();
        setCustomers(data);
        if (editReceipt && editReceipt.customer_id) {
          const matched = data.find((c) => c.customer_id === editReceipt.customer_id);
          if (matched) setSelectedCustomer(matched);
        } else if (preselectedCustomer) {
          const custId = preselectedCustomer.customer_id || preselectedCustomer.id;
          const matched = data.find((c) => c.customer_id === custId) || preselectedCustomer;
          setSelectedCustomer(matched);
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
        setAmount((editReceipt.amount || 0).toString());
        setReceiptDate(editReceipt.receipt_date || new Date().toISOString().split('T')[0]);
        setMode(editReceipt.mode || 'cash');
        if (editReceipt.invoice_id) {
          setSelectedInvoiceIds([editReceipt.invoice_id]);
        } else {
          setSelectedInvoiceIds([]);
        }
      } else {
        if (!preselectedCustomer) {
          setSelectedCustomer(null);
        }
        setInvoices([]);
        setSelectedInvoiceIds([]);
        setManualAllocations({});
        setAmount('');
        setReceiptDate(new Date().toISOString().split('T')[0]);
        setMode('cash');
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, editReceipt, preselectedCustomer]);

  // Load outstanding invoices when customer changes
  useEffect(() => {
    const loadInvoices = async () => {
      if (!selectedCustomer) {
        setInvoices([]);
        setSelectedInvoiceIds([]);
        setManualAllocations({});
        return;
      }
      setInvoicesLoading(true);
      try {
        const list = await getCustomerOutstandingInvoices(selectedCustomer.customer_id);
        setInvoices(list);
        setManualAllocations({});
      } catch (err) {
        console.error('Failed to load customer outstanding invoices:', err);
      } finally {
        setInvoicesLoading(false);
      }
    };
    loadInvoices();
  }, [selectedCustomer]);

  // Total balance due across all outstanding invoices
  const totalInvoicesDue = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (parseFloat(inv.total_amount) - parseFloat(inv.amount_paid || 0)), 0);
  }, [invoices]);

  // Auto FIFO & Selective Allocation Calculation
  const computedAllocations = useMemo(() => {
    const totalReceiptAmount = parseFloat(amount) || 0;
    if (totalReceiptAmount <= 0 || invoices.length === 0) {
      return {
        allocationsMap: {},
        totalAllocated: 0,
        advanceAmount: totalReceiptAmount,
      };
    }

    // Determine target invoices: either user-checked subset, or all invoices (Auto-FIFO)
    const targetInvoices = selectedInvoiceIds.length > 0
      ? invoices.filter((inv) => selectedInvoiceIds.includes(inv.invoice_id))
      : invoices;

    let remainingMoney = totalReceiptAmount;
    const allocationsMap = {};
    let totalAllocated = 0;

    targetInvoices.forEach((inv) => {
      const balanceDue = Math.max(0, parseFloat(inv.total_amount) - parseFloat(inv.amount_paid || 0));
      
      // If user provided a manual allocation for this row
      if (manualAllocations[inv.invoice_id] !== undefined) {
        const manualVal = Math.min(balanceDue, Math.max(0, parseFloat(manualAllocations[inv.invoice_id]) || 0));
        allocationsMap[inv.invoice_id] = manualVal;
        totalAllocated += manualVal;
      } else {
        // Auto FIFO deduction
        const alloc = Math.min(remainingMoney, balanceDue);
        allocationsMap[inv.invoice_id] = alloc;
        remainingMoney = Math.max(0, remainingMoney - alloc);
        totalAllocated += alloc;
      }
    });

    const advanceAmount = Math.max(0, totalReceiptAmount - totalAllocated);

    return {
      allocationsMap,
      totalAllocated,
      advanceAmount,
    };
  }, [amount, invoices, selectedInvoiceIds, manualAllocations]);

  // Handle row checkbox toggle
  const handleToggleInvoice = (invoiceId) => {
    setSelectedInvoiceIds((prev) => {
      if (prev.includes(invoiceId)) {
        return prev.filter((id) => id !== invoiceId);
      } else {
        return [...prev, invoiceId];
      }
    });
  };

  // Handle Select All / Clear Selection
  const handleToggleSelectAll = () => {
    if (selectedInvoiceIds.length === invoices.length) {
      setSelectedInvoiceIds([]); // Revert to Auto-FIFO mode
    } else {
      setSelectedInvoiceIds(invoices.map((i) => i.invoice_id));
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

    const totalAmt = parseFloat(amount);

    try {
      if (editReceipt && editReceipt.receipt_id) {
        // Single receipt record update
        const payload = {
          customer_id: selectedCustomer.customer_id,
          invoice_id: selectedInvoiceIds[0] || null,
          amount: totalAmt,
          receipt_date: receiptDate,
          mode,
        };
        await updateReceipt(editReceipt.receipt_id, payload);
      } else {
        // Multi-invoice or advance allocation creation
        const allocationsList = Object.entries(computedAllocations.allocationsMap)
          .filter(([_, amt]) => amt > 0)
          .map(([invId, amt]) => ({
            invoice_id: invId,
            amount: amt,
          }));

        await createReceiptWithAllocations({
          customer_id: selectedCustomer.customer_id,
          receipt_date: receiptDate,
          mode,
          allocations: allocationsList,
          advanceAmount: computedAllocations.advanceAmount,
        });
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to record payment receipt.');
      showGprError(err, {
        title: 'Failed to record payment receipt',
        actionContext: `Recording ${formatCurrency(totalAmt)} payment for customer ${selectedCustomer?.name}`,
        payload: {
          customer_id: selectedCustomer?.customer_id,
          customer_name: selectedCustomer?.name,
          total_amount: totalAmt,
          mode,
          receipt_date: receiptDate,
          allocated_invoices_count: Object.keys(computedAllocations.allocationsMap).length,
          advance_amount: computedAllocations.advanceAmount,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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

          <Grid container spacing={2.5}>
            {/* Customer Search */}
            <Grid item xs={12} sm={7}>
              <Autocomplete
                id="receipt-customer-autocomplete"
                options={customers}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  if (!option) return '';
                  return `${option.name || ''} ${option.phone ? `(${option.phone})` : ''}`.trim();
                }}
                isOptionEqualToValue={(option, value) => option?.customer_id === value?.customer_id}
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

            {/* Receipt Amount */}
            <Grid item xs={12} sm={5}>
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
                  <MenuItem value="upi">UPI (GPay / PhonePe / QR)</MenuItem>
                  <MenuItem value="bank">Bank Transfer (NEFT / IMPS / RTGS)</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
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

            {/* Invoices Payment Allocation Table */}
            <Grid item xs={12}>
              <Box mt={1}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={800} color="primary.main">
                      Invoice Payment Allocation
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedInvoiceIds.length > 0
                        ? `Targeting ${selectedInvoiceIds.length} selected invoice(s)`
                        : 'Auto FIFO Mode: Automatically deducts oldest unpaid invoices first'}
                    </Typography>
                  </Box>

                  {invoices.length > 0 && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Button size="small" variant="text" onClick={handleToggleSelectAll}>
                        {selectedInvoiceIds.length === invoices.length ? 'Clear Selection (Auto FIFO)' : 'Select All Invoices'}
                      </Button>
                    </Box>
                  )}
                </Box>

                {invoicesLoading ? (
                  <Box display="flex" justifyContent="center" py={3}>
                    <CircularProgress size={24} />
                  </Box>
                ) : !selectedCustomer ? (
                  <Alert severity="info" sx={{ py: 1 }}>
                    Select a customer above to view and allocate payments to their unpaid invoices.
                  </Alert>
                ) : invoices.length === 0 ? (
                  <Alert severity="success" sx={{ py: 1 }}>
                    No unpaid invoices found for this customer. Total receipt amount ({formatCurrency(amount || 0)}) will be recorded as Advance Credit on account.
                  </Alert>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260, borderRadius: 1.5 }}>
                    <Table size="small" stickyHeader>
                      <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                          <TableCell padding="checkbox">
                            <Checkbox
                              size="small"
                              indeterminate={selectedInvoiceIds.length > 0 && selectedInvoiceIds.length < invoices.length}
                              checked={invoices.length > 0 && selectedInvoiceIds.length === invoices.length}
                              onChange={handleToggleSelectAll}
                            />
                          </TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Invoice No</strong></TableCell>
                          <TableCell align="right"><strong>Total (₹)</strong></TableCell>
                          <TableCell align="right"><strong>Balance Due (₹)</strong></TableCell>
                          <TableCell align="right"><strong>This Receipt (₹)</strong></TableCell>
                          <TableCell align="center"><strong>Status After</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {invoices.map((inv) => {
                          const isChecked = selectedInvoiceIds.length === 0 || selectedInvoiceIds.includes(inv.invoice_id);
                          const balanceDue = Math.max(0, parseFloat(inv.total_amount) - parseFloat(inv.amount_paid || 0));
                          const alloc = computedAllocations.allocationsMap[inv.invoice_id] || 0;
                          const newPaidTotal = parseFloat(inv.amount_paid || 0) + alloc;
                          const isFullyPaid = newPaidTotal >= parseFloat(inv.total_amount);

                          return (
                            <TableRow
                              key={inv.invoice_id}
                              hover
                              selected={selectedInvoiceIds.includes(inv.invoice_id)}
                              sx={{
                                bgcolor: alloc > 0 ? 'rgba(74, 222, 128, 0.08)' : 'inherit',
                              }}
                            >
                              <TableCell padding="checkbox">
                                <Checkbox
                                  size="small"
                                  checked={selectedInvoiceIds.includes(inv.invoice_id)}
                                  onChange={() => handleToggleInvoice(inv.invoice_id)}
                                />
                              </TableCell>
                              <TableCell>{formatDate(inv.invoice_date)}</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>
                                #{inv.invoice_no}
                              </TableCell>
                              <TableCell align="right">{formatCurrency(inv.total_amount)}</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: 'error.main' }}>
                                {formatCurrency(balanceDue)}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, color: alloc > 0 ? 'success.main' : 'text.disabled' }}>
                                {alloc > 0 ? formatCurrency(alloc) : '—'}
                              </TableCell>
                              <TableCell align="center">
                                {alloc > 0 ? (
                                  <Chip
                                    label={isFullyPaid ? 'PAID' : 'PARTIAL'}
                                    size="small"
                                    color={isFullyPaid ? 'success' : 'warning'}
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                  />
                                ) : (
                                  <Chip
                                    label={inv.status.toUpperCase()}
                                    size="small"
                                    variant="outlined"
                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                  />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {/* Live Allocation Summary Footnote */}
                {selectedCustomer && (
                  <Paper variant="outlined" sx={{ mt: 1.5, p: 1.5, bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
                      <Typography variant="caption" color="text.secondary">
                        Total Invoices Due: <strong>{formatCurrency(totalInvoicesDue)}</strong>
                      </Typography>
                      <Divider orientation="vertical" flexItem />
                      <Typography variant="caption" color="success.main" fontWeight={700}>
                        Allocated to Invoices: {formatCurrency(computedAllocations.totalAllocated)}
                      </Typography>
                      {computedAllocations.advanceAmount > 0 && (
                        <>
                          <Divider orientation="vertical" flexItem />
                          <Typography variant="caption" color="primary.main" fontWeight={700}>
                            Advance / Account Credit: {formatCurrency(computedAllocations.advanceAmount)}
                          </Typography>
                        </>
                      )}
                    </Box>

                    {selectedInvoiceIds.length > 0 && parseFloat(amount || 0) > computedAllocations.totalAllocated && (
                      <Typography variant="caption" color="warning.dark" fontWeight={600}>
                        * Excess {formatCurrency(computedAllocations.advanceAmount)} saved as advance credit
                      </Typography>
                    )}
                  </Paper>
                )}
              </Box>
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
            disabled={loading || !selectedCustomer || !(parseFloat(amount) > 0)}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Recording...' : 'Record Payment Receipt'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ReceiptDialog;

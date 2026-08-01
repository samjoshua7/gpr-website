import React, { useState, useEffect, useRef } from 'react';
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
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
  Grid,
  Autocomplete,
  Checkbox,
  FormControlLabel,
  Card,
  CardContent,
  Chip,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  createSalesInvoice,
  getNextInvoiceNumber,
  getCustomerOutstandingBalance,
  getCompanySettings,
  getInventoryItems,
  getTaxRates,
} from '../api';
import { getCustomers } from '../../customers/api';

export const InvoiceDialog = ({ open, onClose, onSaveSuccess, preselectedJob }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [outstandingBalance, setOutstandingBalance] = useState(0.00);
  const [address, setAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  const [isGstInvoice, setIsGstInvoice] = useState(false);
  const [isIntraState, setIsIntraState] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState('Loading...');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Catalog and Tax lists
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [taxRates, setTaxRates] = useState([]);

  // Ref to focus the Add Product button
  const addProductButtonRef = useRef(null);

  // Extended fields
  const [notes, setNotes] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState('');

  // Line items state
  const [lineItems, setLineItems] = useState([
    {
      item_id: null,
      description: '',
      quantity: '1',
      unit: 'sheet',
      unit_price: '0.00',
      discount_amount: '0.00',
      tax_rate_id: '',
      gst_rate: 0,
      tax_amount: 0,
      hsn_code: '',
      amount: 0,
    },
  ]);

  // Company settings (for state code validation)
  const [companySettings, setCompanySettings] = useState(null);

  // Status & errors
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Initial load
  useEffect(() => {
    const initData = async () => {
      setCustomersLoading(true);
      setInventoryLoading(true);
      try {
        const [customerList, itemList, companyInfo, taxRateList] = await Promise.all([
          getCustomers(),
          getInventoryItems(),
          getCompanySettings(),
          getTaxRates(),
        ]);
        setCustomers(customerList);
        setInventoryItems(itemList);
        setCompanySettings(companyInfo);
        setTaxRates(taxRateList);
      } catch (err) {
        console.error('Failed to initialize dialog data:', err);
      } finally {
        setCustomersLoading(false);
        setInventoryLoading(false);
      }
    };

    if (open) {
      initData();
      setSelectedCustomer(null);
      setOutstandingBalance(0.00);
      setAddress('');
      setCustomerGstin('');
      setIsGstInvoice(false);
      setIsIntraState(true);
      setInvoiceNo('Loading...');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setNotes('');
      setDeliveryDetails('');
      setErrors({});
      setApiError(null);

      if (preselectedJob) {
        // Pre-fill if a job is passed
        setLineItems([
          {
            item_id: null,
            description: `Print Job: ${preselectedJob.description}`,
            quantity: preselectedJob.quantity?.toString() || '1',
            unit: 'sheet',
            unit_price: '0.00',
            discount_amount: '0.00',
            tax_rate_id: '',
            gst_rate: 0,
            tax_amount: 0,
            hsn_code: '',
            amount: 0,
          },
        ]);
      } else {
        setLineItems([
          {
            item_id: null,
            description: '',
            quantity: '1',
            unit: 'sheet',
            unit_price: '0.00',
            discount_amount: '0.00',
            tax_rate_id: '',
            gst_rate: 0,
            tax_amount: 0,
            hsn_code: '',
            amount: 0,
          },
        ]);
      }
    }
  }, [open, preselectedJob]);

  // Load next invoice sequence number automatically
  useEffect(() => {
    const fetchInvoiceNo = async () => {
      if (!open) return;
      try {
        const nextNo = await getNextInvoiceNumber(isGstInvoice);
        setInvoiceNo(nextNo);
      } catch (err) {
        console.error('Failed to generate invoice sequence:', err);
        setInvoiceNo('ERR-GEN');
      }
    };
    fetchInvoiceNo();
  }, [isGstInvoice, open]);

  // Focus add product button when customer is selected
  useEffect(() => {
    if (selectedCustomer && addProductButtonRef.current) {
      setTimeout(() => {
        addProductButtonRef.current.focus();
      }, 100);
    }
  }, [selectedCustomer]);

  // Handle customer selection changes
  const handleCustomerChange = async (event, newValue) => {
    setSelectedCustomer(newValue);
    if (!newValue) {
      setOutstandingBalance(0.00);
      setAddress('');
      setCustomerGstin('');
      return;
    }

    setAddress(newValue.address || '');
    setCustomerGstin(newValue.gstin || '');

    // Dynamically auto-toggle GST checkbox if customer has a valid GSTIN
    if (newValue.gstin && newValue.gstin.trim().length > 0) {
      setIsGstInvoice(true);
    } else {
      setIsGstInvoice(false);
    }

    try {
      const balance = await getCustomerOutstandingBalance(newValue.customer_id);
      setOutstandingBalance(balance);
    } catch (err) {
      console.error('Failed to load outstanding balance:', err);
    }
  };

  // Product Selection handler
  const handleProductSelection = (index, product) => {
    const newItems = [...lineItems];
    if (!product) {
      newItems[index] = {
        ...newItems[index],
        item_id: null,
        description: '',
        unit: 'sheet',
        unit_price: '0.00',
        tax_rate_id: '',
        gst_rate: 0,
        hsn_code: '',
      };
      setLineItems(newItems);
      return;
    }

    // Resolve tax rate details linked to product
    const taxRate = taxRates.find((t) => t.tax_rate_id === product.tax_rate_id) || null;

    newItems[index] = {
      ...newItems[index],
      item_id: product.item_id,
      description: product.name,
      unit: product.unit || 'sheet',
      unit_price: product.unit_price?.toString() || '0.00',
      tax_rate_id: product.tax_rate_id || '',
      gst_rate: taxRate ? parseFloat(taxRate.percentage) : 0,
      hsn_code: product.hsn_code || taxRate?.hsn_code || '',
    };
    
    // Recalculate row math
    recalculateRow(newItems, index);
  };

  // Tax selection handler (explicit select inside item row)
  const handleTaxSelection = (index, taxRateId) => {
    const newItems = [...lineItems];
    const taxRate = taxRates.find((t) => t.tax_rate_id === taxRateId) || null;

    newItems[index] = {
      ...newItems[index],
      tax_rate_id: taxRateId,
      gst_rate: taxRate ? parseFloat(taxRate.percentage) : 0,
      hsn_code: taxRate?.hsn_code || newItems[index].hsn_code || '',
    };

    recalculateRow(newItems, index);
  };

  const handleLineChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    recalculateRow(newItems, index);
  };

  const recalculateRow = (items, index) => {
    const item = items[index];
    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.unit_price) || 0;
    const discount = parseFloat(item.discount_amount) || 0;
    
    const taxableValue = Math.max(0, (qty * rate) - discount);
    const gst = isGstInvoice ? (parseFloat(item.gst_rate) || 0) : 0;
    
    const tax = (taxableValue * gst) / 100;
    const total = taxableValue + tax;

    items[index] = {
      ...item,
      tax_amount: tax,
      amount: total,
    };
    setLineItems(items);
  };

  // Recalculate all lines when GST checkbox is toggled
  useEffect(() => {
    const updated = [...lineItems];
    updated.forEach((_, idx) => recalculateRow(updated, idx));
    setLineItems(updated);
  }, [isGstInvoice, isIntraState]);

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        item_id: null,
        description: '',
        quantity: '1',
        unit: 'sheet',
        unit_price: '0.00',
        discount_amount: '0.00',
        tax_rate_id: '',
        gst_rate: 0,
        tax_amount: 0,
        hsn_code: '',
        amount: 0,
      },
    ]);
  };

  const handleRemoveLine = (index) => {
    if (lineItems.length === 1) return;
    const newItems = [...lineItems];
    newItems.splice(index, 1);
    setLineItems(newItems);
  };

  // Calculations for Invoices Totals
  const getTotals = () => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableValue = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;

    lineItems.forEach((line) => {
      const qty = parseFloat(line.quantity) || 0;
      const rate = parseFloat(line.unit_price) || 0;
      const discount = parseFloat(line.discount_amount) || 0;
      
      subtotal += (qty * rate);
      totalDiscount += discount;
      
      const lineTaxable = Math.max(0, (qty * rate) - discount);
      taxableValue += lineTaxable;

      if (isGstInvoice) {
        const gst = parseFloat(line.gst_rate) || 0;
        const lineTax = (lineTaxable * gst) / 100;
        totalTax += lineTax;

        if (isIntraState) {
          cgst += (lineTax / 2);
          sgst += (lineTax / 2);
        } else {
          igst += lineTax;
        }
      }
    });

    const totalBeforeRound = taxableValue + cgst + sgst + igst;
    const grandTotal = Math.round(totalBeforeRound);
    const roundOff = grandTotal - totalBeforeRound;

    return {
      subtotal,
      totalDiscount,
      taxableValue,
      cgst,
      sgst,
      igst,
      totalTax,
      roundOff,
      grandTotal,
    };
  };

  const totals = getTotals();

  const validate = () => {
    const tempErrors = {};
    if (!selectedCustomer) tempErrors.customerId = 'Customer selection is required';
    if (!invoiceNo || invoiceNo === 'Loading...') tempErrors.invoiceNo = 'Invoice sequence error';
    
    // Validate line items
    const itemsErrors = [];
    let hasLineErrors = false;

    lineItems.forEach((item, index) => {
      const itemErr = {};
      if (!item.description.trim()) {
        itemErr.description = 'Product required';
        hasLineErrors = true;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        itemErr.quantity = 'Qty > 0';
        hasLineErrors = true;
      }
      const price = parseFloat(item.unit_price);
      if (isNaN(price) || price < 0) {
        itemErr.unit_price = 'Rate >= 0';
        hasLineErrors = true;
      }
      const disc = parseFloat(item.discount_amount);
      if (isNaN(disc) || disc < 0) {
        itemErr.discount_amount = 'Discount >= 0';
        hasLineErrors = true;
      }
      itemsErrors[index] = itemErr;
    });

    if (hasLineErrors) {
      tempErrors.lineItems = itemsErrors;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    const parentPayload = {
      customer_id: selectedCustomer.customer_id,
      job_id: preselectedJob?.job_id || null,
      invoice_no: invoiceNo,
      invoice_date: invoiceDate,
      total_amount: totals.grandTotal,
      tax_amount: totals.totalTax,
      gst_amount: totals.totalTax,
      notes: notes.trim() || null,
      delivery_details: deliveryDetails.trim() || null,
    };

    try {
      await createSalesInvoice(parentPayload, lineItems);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to save GST invoice records.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const isCustomerSelected = !!selectedCustomer;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, bgcolor: 'action.hover', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        GST / Non-GST Invoice Creation Desk
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent sx={{ p: 4 }}>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          {/* Customer and Invoice Details Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ borderRadius: 2, p: 1 }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Customer Details
                  </Typography>

                  <Autocomplete
                    id="customer-autocomplete"
                    options={customers}
                    getOptionLabel={(option) => `${option.name} (${option.phone || 'No Phone'})`}
                    loading={customersLoading}
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    onInputChange={(e, val) => setCustomerSearchQuery(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Customer by Name or Phone *"
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
                    sx={{ mb: 2 }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="GSTIN"
                        value={customerGstin}
                        onChange={(e) => setCustomerGstin(e.target.value)}
                        disabled={loading || !isCustomerSelected}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1, p: 0.8, bgcolor: 'action.hover', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Outstanding Balance
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: outstandingBalance > 0 ? 'error.main' : 'success.main' }}>
                          {formatCurrency(outstandingBalance)}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Billing Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        disabled={loading || !isCustomerSelected}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Invoice Configuration */}
            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ borderRadius: 2, p: 1, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Billing Details
                  </Typography>

                  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isGstInvoice}
                          onChange={(e) => {
                            setIsGstInvoice(e.target.checked);
                            if (!e.target.checked) {
                              setIsIntraState(true);
                            }
                          }}
                          color="primary"
                          disabled={loading}
                        />
                      }
                      label="GST Invoice"
                    />
                    {isGstInvoice && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isIntraState}
                            onChange={(e) => setIsIntraState(e.target.checked)}
                            color="primary"
                            disabled={loading}
                          />
                        }
                        label="Intra-State (CGST + SGST)"
                      />
                    )}
                    <Chip
                      label={isGstInvoice ? "GST COMPLIANT" : "RETAIL BILL"}
                      color={isGstInvoice ? "primary" : "default"}
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Generated Invoice Number"
                        value={invoiceNo}
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: 'action.hover' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Invoice Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        disabled={loading}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Product list section (visually disabled until customer selection is made) */}
          <Box sx={{ opacity: isCustomerSelected ? 1 : 0.45, pointerEvents: isCustomerSelected ? 'auto' : 'none' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Products & Work Items
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table>
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }} width="30%">Product / Work Item *</TableCell>
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} width="12%">HSN/SAC</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={100}>Qty *</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} width={80}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={110}>Rate *</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={100}>Discount</TableCell>
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} width="18%">Tax Rate Dropdown</TableCell>}
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} align="right" width={110}>GST Amt</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={130}>Line Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center" width={60}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.map((line, index) => {
                    const lineErr = errors.lineItems?.[index] || {};
                    const selectedProduct = inventoryItems.find((p) => p.item_id === line.item_id) || null;

                    return (
                      <TableRow key={index}>
                        {/* Product select */}
                        <TableCell>
                          <Autocomplete
                            id={`line-product-${index}`}
                            options={inventoryItems}
                            getOptionLabel={(option) => option.name}
                            loading={inventoryLoading}
                            value={selectedProduct}
                            onChange={(e, val) => handleProductSelection(index, val)}
                            disabled={loading || !isCustomerSelected}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                size="small"
                                placeholder="Choose item..."
                                error={!!lineErr.description}
                              />
                            )}
                          />
                        </TableCell>

                        {/* HSN */}
                        {isGstInvoice && (
                          <TableCell>
                            <TextField
                              size="small"
                              value={line.hsn_code}
                              InputProps={{ readOnly: true }}
                              sx={{ bgcolor: 'action.hover' }}
                            />
                          </TableCell>
                        )}

                        {/* Quantity */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            error={!!lineErr.quantity}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0.01', step: 'any', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* Unit */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', pl: 1 }}>
                            {line.unit}
                          </Typography>
                        </TableCell>

                        {/* Rate */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)}
                            error={!!lineErr.unit_price}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0', step: '0.01', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* Discount */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.discount_amount}
                            onChange={(e) => handleLineChange(index, 'discount_amount', e.target.value)}
                            error={!!lineErr.discount_amount}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0', step: '0.01', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* Tax Rate Dropdown */}
                        {isGstInvoice && (
                          <TableCell>
                            <Select
                              size="small"
                              fullWidth
                              value={line.tax_rate_id}
                              onChange={(e) => handleTaxSelection(index, e.target.value)}
                              disabled={loading || !isCustomerSelected}
                            >
                              <MenuItem value=""><em>Exempt (0%)</em></MenuItem>
                              {taxRates.map((t) => (
                                <MenuItem key={t.tax_rate_id} value={t.tax_rate_id}>
                                  {t.tax_name} ({t.percentage}%)
                                </MenuItem>
                              ))}
                            </Select>
                          </TableCell>
                        )}

                        {/* GST Tax Amount */}
                        {isGstInvoice && (
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {line.tax_amount.toFixed(2)}
                          </TableCell>
                        )}

                        {/* Line Total */}
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {line.amount.toFixed(2)}
                        </TableCell>

                        {/* Remove line */}
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            onClick={() => handleRemoveLine(index)}
                            disabled={loading || lineItems.length === 1}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mb: 4 }}>
              <Button
                ref={addProductButtonRef}
                startIcon={<AddIcon />}
                onClick={handleAddLine}
                disabled={loading || !isCustomerSelected}
                variant="outlined"
              >
                Add Item Row
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Notes and Summary Section */}
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Terms & Delivery Details
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Delivery Address & Details"
                  value={deliveryDetails}
                  onChange={(e) => setDeliveryDetails(e.target.value)}
                  sx={{ mb: 2 }}
                  disabled={loading || !isCustomerSelected}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Notes / Terms of Payment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={loading || !isCustomerSelected}
                />
              </Grid>

              {/* Calculations Summary Card */}
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: 'action.hover' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2 }}>
                      Billing Summary
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Subtotal (Gross):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Total Discount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        - {formatCurrency(totals.totalDiscount)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Taxable Value:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(totals.taxableValue)}</Typography>
                    </Box>

                    {isGstInvoice && (
                      <React.Fragment>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">CGST (Central Tax):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.cgst)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">SGST (State Tax):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.sgst)}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                          <Typography variant="body2" color="text.secondary">IGST (Integrated Tax):</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.igst)}</Typography>
                        </Box>
                      </React.Fragment>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" color="text.secondary">Round Off:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {totals.roundOff >= 0 ? '+' : ''}{formatCurrency(totals.roundOff)}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" sx={{ fontWeight: 900 }}>Grand Total:</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {formatCurrency(totals.grandTotal)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: 'action.hover' }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading || invoiceNo === 'Loading...' || !isCustomerSelected}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ px: 4, fontWeight: 700 }}
          >
            Generate Invoice
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default InvoiceDialog;

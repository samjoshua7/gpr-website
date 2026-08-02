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
  Select,
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
  updateSalesInvoice,
  getNextInvoiceNumber,
  getCustomerOutstandingBalance,
} from '../api';

import { getCustomers } from '../../customers/api';
import { getInventoryItems } from '../../inventory/api';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const InvoiceDialog = ({ open, onClose, onSaveSuccess, preselectedJob = null, editInvoice = null }) => {
  // Form fields
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [outstandingBalance, setOutstandingBalance] = useState(0.00);
  const [address, setAddress] = useState('');
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  const [invoiceType, setInvoiceType] = useState('NON_GST');
  const [customerType, setCustomerType] = useState('B2C');
  const isGstInvoice = invoiceType === 'GST';
  const [isIntraState, setIsIntraState] = useState(true);
  const [invoiceNo, setInvoiceNo] = useState('Loading...');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

  // Catalog items list
  const [inventoryItems, setInventoryItems] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

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
        const [customerList, itemList] = await Promise.all([
          getCustomers(),
          getInventoryItems(),
        ]);
        setCustomers(customerList);
        setInventoryItems(itemList);

        if (preselectedJob && preselectedJob.customer_id) {
          const matched = customerList.find(c => c.customer_id === preselectedJob.customer_id);
          if (matched) {
             handleCustomerChange(null, matched);
          }
        }
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
      setShippingSameAsBilling(true);
      setShippingAddress('');
      setCustomerGstin('');
      setInvoiceType('NON_GST');
      setCustomerType('B2C');
      setIsIntraState(true);
      setInvoiceNo('Loading...');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setNotes(preselectedJob?.description || '');
      setDeliveryDetails('');
      setErrors({});
      setApiError(null);

      if (preselectedJob) {
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

  // Sync shipping address when billing address or toggle changes
  useEffect(() => {
    if (shippingSameAsBilling) {
      setShippingAddress(address);
    }
  }, [address, shippingSameAsBilling]);

  // Load next invoice sequence number automatically if creating new
  useEffect(() => {
    const fetchInvoiceNo = async () => {
      if (!open) return;
      
      if (editInvoice) {
        // Edit mode - populate with existing invoice data
        setInvoiceNo(editInvoice.invoice_no);
        setInvoiceDate(editInvoice.invoice_date);
        setInvoiceType(editInvoice.invoice_type || 'NON_GST');
        setCustomerType(editInvoice.customer_type || 'B2C');
        setIsIntraState(editInvoice.is_interstate === false);
        setNotes(editInvoice.notes || '');
        setDeliveryDetails(editInvoice.delivery_details || '');
        setAddress(editInvoice.billing_address || '');
        setShippingAddress(editInvoice.shipping_address || '');
        setCustomerGstin(editInvoice.customer_gstin || '');
        
        // Wait for customers to load then select
        if (editInvoice.customer_id && customers.length > 0) {
          const matched = customers.find(c => c.customer_id === editInvoice.customer_id);
          if (matched) {
             setSelectedCustomer(matched);
          }
        }
        
        // Load existing line items
        if (editInvoice.items && editInvoice.items.length > 0) {
          setLineItems(editInvoice.items.map(i => ({
            item_id: i.item_id,
            description: i.description,
            quantity: i.quantity.toString(),
            unit: 'unit', // Best guess since we don't save unit in db currently
            unit_price: i.unit_price.toString(),
            discount_amount: i.discount_amount.toString(),
            tax_rate_id: '',
            gst_rate: i.gst_rate,
            tax_amount: i.tax_amount,
            hsn_code: i.hsn_code || '',
            amount: i.amount
          })));
        }
      } else {
        try {
          const nextNo = await getNextInvoiceNumber(invoiceType);
          setInvoiceNo(nextNo);
        } catch (err) {
          console.error('Failed to generate invoice sequence:', err);
          setInvoiceNo('ERR-GEN');
        }
      }
    };
    fetchInvoiceNo();
  }, [invoiceType, open, editInvoice, customers.length]);

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
      setShippingAddress('');
      setCustomerGstin('');
      return;
    }

    const custAddr = newValue.address || '';
    setAddress(custAddr);
    if (shippingSameAsBilling) {
      setShippingAddress(custAddr);
    }
    
    const custGstinVal = newValue.gstin || '';
    setCustomerGstin(custGstinVal);

    // Auto-toggle GST Invoice if customer has registered GSTIN
    if (custGstinVal.trim().length > 0) {
      setInvoiceType('GST');
      setCustomerType('B2B');
    } else {
      setInvoiceType('NON_GST');
      setCustomerType('B2C');
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

    newItems[index] = {
      ...newItems[index],
      item_id: product.item_id,
      description: product.name,
      unit: product.unit || 'sheet',
      unit_price: product.unit_price?.toString() || '0.00',
      tax_rate_id: product.tax_rate_id || '',
      gst_rate: product.gst_rate || 18,
      hsn_code: product.hsn_code || '4911',
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

    const taxableValue = Math.max(0, qty * rate - discount);
    const gst = isGstInvoice ? parseFloat(item.gst_rate) || 0 : 0;

    const tax = (taxableValue * gst) / 100;
    const total = taxableValue + tax;

    items[index] = {
      ...item,
      tax_amount: tax,
      amount: total,
    };
    setLineItems([...items]);
  };

  // Recalculate all lines when GST checkbox is toggled
  useEffect(() => {
    const updated = [...lineItems];
    updated.forEach((_, idx) => recalculateRow(updated, idx));
  }, [invoiceType, isIntraState]);

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

  // Invoice Totals calculation
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

      subtotal += qty * rate;
      totalDiscount += discount;

      const lineTaxable = Math.max(0, qty * rate - discount);
      taxableValue += lineTaxable;

      if (isGstInvoice) {
        const gst = parseFloat(line.gst_rate) || 0;
        const lineTax = (lineTaxable * gst) / 100;
        totalTax += lineTax;

        if (isIntraState) {
          cgst += lineTax / 2;
          sgst += lineTax / 2;
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

    // GST Invoice Validation: If GST Invoice is ON, Customer GSTIN is REQUIRED
    if (isGstInvoice && customerType === 'B2B') {
      if (!customerGstin || !customerGstin.trim()) {
        tempErrors.customerGstin = 'Customer GSTIN is REQUIRED for B2B GST Invoices';
      } else if (!GSTIN_REGEX.test(customerGstin.trim().toUpperCase())) {
        tempErrors.customerGstin = 'Invalid GSTIN format (e.g. 33AAAAA0000A1Z5)';
      }
    }

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
      invoice_type: invoiceType,
      customer_type: isGstInvoice ? customerType : null,
      is_interstate: !isIntraState,
      customer_name: selectedCustomer.name,
      customer_gstin: (isGstInvoice && customerType === 'B2B') ? customerGstin.trim().toUpperCase() : null,
      billing_address: address.trim() || null,
      shipping_address: shippingSameAsBilling ? (address.trim() || null) : (shippingAddress.trim() || null),
      total_amount: totals.grandTotal,
      amount_paid: 0.00,
      status: 'unpaid',
      tax_amount: totals.totalTax,
      gst_amount: totals.totalTax,
      notes: notes.trim() || null,
      delivery_details: deliveryDetails.trim() || null,
    };

    try {
      if (editInvoice) {
        await updateSalesInvoice(editInvoice.invoice_id, parentPayload, lineItems);
      } else {
        await createSalesInvoice(parentPayload, lineItems);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to create sales invoice.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt || 0);
  };

  const isCustomerSelected = !!selectedCustomer;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { width: { xs: '100%', lg: '95%' } } }}>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          {preselectedJob ? `Create Invoice for Job #JC-${String(preselectedJob.job_number || 0).padStart(4, '0')}` : 'Create Sales Invoice'}
        </Typography>
        <Chip
          label={isGstInvoice ? 'GST TAX INVOICE' : 'RETAIL BILL'}
          color={isGstInvoice ? 'primary' : 'default'}
          sx={{ fontWeight: 700 }}
        />
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {apiError}
            </Alert>
          )}

          {/* Section 1: Customer Selection & Address Config */}
          <Grid container spacing={3} sx={{ mb: 2 }}>
            <Grid item xs={12} md={7}>
              <Card variant="outlined" sx={{ borderRadius: 2, p: 1, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Customer Details
                  </Typography>

                  <Autocomplete
                    id="customer-selection"
                    options={customers}
                    getOptionLabel={(option) => `${option.name} ${option.phone ? `(${option.phone})` : ''}`}
                    loading={customersLoading}
                    value={selectedCustomer}
                    onChange={handleCustomerChange}
                    onInputChange={(e, val) => setCustomerSearchQuery(val)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Customer by Name, Phone, or GSTIN *"
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

                  {/* Requirement 2: Dynamic GSTIN input - Revealed ONLY when GST Invoice = ON and B2B */}
                  {isGstInvoice && customerType === 'B2B' && (
                    <TextField
                      fullWidth
                      size="small"
                      required
                      label="Customer GSTIN *"
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      value={customerGstin}
                      onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                      error={!!errors.customerGstin}
                      helperText={errors.customerGstin || (selectedCustomer?.gstin ? 'Auto-filled from Customer Master' : 'Required for GST Tax Invoice')}
                      disabled={loading || !isCustomerSelected}
                      sx={{ mb: 2 }}
                      inputProps={{ style: { textTransform: 'uppercase' } }}
                    />
                  )}

                  <Grid container spacing={2}>
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

                    {/* Requirement 6: Shipping Address Mirroring */}
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={shippingSameAsBilling}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setShippingSameAsBilling(checked);
                              if (checked) {
                                setShippingAddress(address);
                              }
                            }}
                            color="primary"
                            disabled={loading || !isCustomerSelected}
                          />
                        }
                        label="Shipping Address same as Billing Address"
                      />

                      <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Shipping Address"
                        value={shippingSameAsBilling ? address : shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                        disabled={loading || !isCustomerSelected || shippingSameAsBilling}
                        sx={{ mt: 1 }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            {/* Section 2: Invoice Configuration */}
            <Grid item xs={12} md={5}>
              <Card variant="outlined" sx={{ borderRadius: 2, p: 1, height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Invoice Settings
                  </Typography>

                  <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ minWidth: 150 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Invoice Type</Typography>
                      <Select
                        size="small"
                        fullWidth
                        value={invoiceType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setInvoiceType(val);
                          if (val === 'NON_GST') {
                            setIsIntraState(true);
                          } else if (selectedCustomer?.gstin) {
                            setCustomerGstin(selectedCustomer.gstin);
                            setCustomerType('B2B');
                          } else {
                            setCustomerType('B2C');
                          }
                        }}
                        disabled={loading}
                      >
                        <MenuItem value="NON_GST">Non-GST Invoice</MenuItem>
                        <MenuItem value="GST">GST Invoice</MenuItem>
                      </Select>
                    </Box>

                    {isGstInvoice && (
                      <Box sx={{ minWidth: 150 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Customer Type</Typography>
                        <Select
                          size="small"
                          fullWidth
                          value={customerType}
                          onChange={(e) => setCustomerType(e.target.value)}
                          disabled={loading}
                        >
                          <MenuItem value="B2C">B2C (Unregistered)</MenuItem>
                          <MenuItem value="B2B">B2B (Registered)</MenuItem>
                        </Select>
                      </Box>
                    )}

                    {isGstInvoice && (
                      <Box sx={{ pl: 3, mt: 1 }}>
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
                      </Box>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Generated Invoice Number"
                        value={invoiceNo}
                        InputProps={{ readOnly: true }}
                        sx={{ bgcolor: 'action.hover' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Invoice Date"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        disabled={loading}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Invoice Notes"
                        size="small"
                        multiline
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Enter any special notes, terms, or descriptions here..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1.5, p: 1.5, bgcolor: 'action.hover', textAlign: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          Customer Outstanding Balance
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: outstandingBalance > 0 ? 'error.main' : 'success.main' }}>
                          {formatCurrency(outstandingBalance)}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Section 3: Product list section */}
          <Box sx={{ opacity: isCustomerSelected ? 1 : 0.45, pointerEvents: isCustomerSelected ? 'auto' : 'none' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Products & Work Items
              </Typography>
              <Button
                ref={addProductButtonRef}
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={handleAddLine}
                disabled={loading || !isCustomerSelected}
                sx={{ fontWeight: 700 }}
              >
                Add Line Item
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }} width="32%">Product / Work Item *</TableCell>
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} width="10%">HSN/SAC</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={90}>Qty *</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} width={70}>Unit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={110}>Rate *</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={100}>Discount</TableCell>
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} width="12%">GST %</TableCell>}
                    {isGstInvoice && <TableCell sx={{ fontWeight: 700 }} align="right" width={100}>GST Amt</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right" width={120}>Line Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center" width={50}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lineItems.map((line, index) => {
                    const lineErr = errors.lineItems?.[index] || {};
                    const selectedProduct = inventoryItems.find((p) => p.item_id === line.item_id) || null;

                    return (
                      <TableRow key={index}>
                        {/* Product selection */}
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

                        {/* HSN Code - Revealed ONLY when GST Invoice = ON */}
                        {isGstInvoice && (
                          <TableCell>
                            <TextField
                              size="small"
                              value={line.hsn_code}
                              onChange={(e) => handleLineChange(index, 'hsn_code', e.target.value)}
                              placeholder="4911"
                              disabled={loading || !isCustomerSelected}
                            />
                          </TableCell>
                        )}

                        {/* Quantity - Requirement 3: onFocus text selection */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            error={!!lineErr.quantity}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0.01', step: 'any', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* Unit */}
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', pl: 0.5 }}>
                            {line.unit}
                          </Typography>
                        </TableCell>

                        {/* Rate - Requirement 3: onFocus text selection */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.unit_price}
                            onChange={(e) => handleLineChange(index, 'unit_price', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            error={!!lineErr.unit_price}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0', step: '0.01', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* Discount - Requirement 3: onFocus text selection */}
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            value={line.discount_amount}
                            onChange={(e) => handleLineChange(index, 'discount_amount', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            error={!!lineErr.discount_amount}
                            disabled={loading || !isCustomerSelected}
                            inputProps={{ min: '0', step: '0.01', style: { textAlign: 'right' } }}
                          />
                        </TableCell>

                        {/* GST % Rate - Revealed ONLY when GST Invoice = ON */}
                        {isGstInvoice && (
                          <TableCell>
                            <Select
                              size="small"
                              fullWidth
                              value={line.gst_rate}
                              onChange={(e) => handleLineChange(index, 'gst_rate', e.target.value)}
                              disabled={loading || !isCustomerSelected}
                            >
                              <MenuItem value={0}>0%</MenuItem>
                              <MenuItem value={5}>5%</MenuItem>
                              <MenuItem value={12}>12%</MenuItem>
                              <MenuItem value={18}>18%</MenuItem>
                              <MenuItem value={28}>28%</MenuItem>
                            </Select>
                          </TableCell>
                        )}

                        {/* GST Tax Amount - Revealed ONLY when GST Invoice = ON */}
                        {isGstInvoice && (
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                            {line.tax_amount.toFixed(2)}
                          </TableCell>
                        )}

                        {/* Line Total */}
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {line.amount.toFixed(2)}
                        </TableCell>

                        {/* Remove Line Action */}
                        <TableCell align="center">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={() => handleRemoveLine(index)}
                            disabled={lineItems.length === 1 || loading || !isCustomerSelected}
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

            {/* Invoice Financial Summary Box */}
            <Grid container spacing={3} justifyContent="flex-end">
              <Grid item xs={12} sm={6} md={5}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                    Invoice Summary Breakdown
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Subtotal Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.subtotal)}</Typography>
                  </Box>

                  {totals.totalDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="error.main">Total Discounts:</Typography>
                      <Typography variant="body2" color="error.main" sx={{ fontWeight: 600 }}>- {formatCurrency(totals.totalDiscount)}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Taxable Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(totals.taxableValue)}</Typography>
                  </Box>

                  {isGstInvoice && (
                    <React.Fragment>
                      {isIntraState ? (
                        <React.Fragment>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, pl: 1 }}>
                            <Typography variant="caption" color="text.secondary">CGST:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(totals.cgst)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 1 }}>
                            <Typography variant="caption" color="text.secondary">SGST:</Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(totals.sgst)}</Typography>
                          </Box>
                        </React.Fragment>
                      ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pl: 1 }}>
                          <Typography variant="caption" color="text.secondary">IGST:</Typography>
                          <Typography variant="caption" sx={{ fontWeight: 600 }}>{formatCurrency(totals.igst)}</Typography>
                        </Box>
                      )}
                    </React.Fragment>
                  )}

                  {totals.roundOff !== 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">Round Off:</Typography>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>{totals.roundOff > 0 ? `+${totals.roundOff.toFixed(2)}` : totals.roundOff.toFixed(2)}</Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 800 }}>Grand Total:</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      {formatCurrency(totals.grandTotal)}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={onClose} disabled={loading} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !isCustomerSelected}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ px: 3, fontWeight: 700 }}
          >
            Create & Issue Invoice
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default InvoiceDialog;

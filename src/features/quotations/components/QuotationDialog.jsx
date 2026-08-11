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
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

import {
  createQuotation,
  updateQuotation,
  getNextQuotationNumber,
} from '../api';

import { getCustomers } from '../../customers/api';
import { getInventoryItems } from '../../inventory/api';
import { reverseFromLineTotal, forwardLineTotal } from '../../../lib/invoiceLineMath';

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const QuotationDialog = ({ open, onClose, onSaveSuccess, editQuotation = null }) => {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const [address, setAddress] = useState('');
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  const [invoiceType, setInvoiceType] = useState('NON_GST');
  const [customerType, setCustomerType] = useState('B2C');
  const isGstInvoice = invoiceType === 'GST';
  const [isIntraState, setIsIntraState] = useState(true);
  const [quotationNo, setQuotationNo] = useState('Loading...');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [notes, setNotes] = useState('');
  const [deliveryDetails, setDeliveryDetails] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0.00');

  const [lineItems, setLineItems] = useState([
    {
      item_id: null,
      product_name: '',
      description: '',
      quantity: '1',
      unit_price: '0.00',
      discount_amount: '0.00',
      gst_rate: 0,
      tax_amount: 0,
      hsn_code: '',
      amount: 0,
    },
  ]);

  const [lineTotalDrafts, setLineTotalDrafts] = useState({});
  const [lineTotalErrors, setLineTotalErrors] = useState({});

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const initData = async () => {
      setCustomersLoading(true);
      try {
        const [customerList, itemList] = await Promise.all([
          getCustomers(),
          getInventoryItems(),
        ]);
        setCustomers(customerList);
        setInventoryItems(itemList);
      } catch (err) {
        console.error('Failed to initialize quotation dialog data:', err);
      } finally {
        setCustomersLoading(false);
      }
    };

    if (open) {
      initData();
      if (editQuotation) {
        setQuotationNo(editQuotation.quotation_no);
        setQuotationDate(editQuotation.quotation_date || new Date().toISOString().split('T')[0]);
        setInvoiceType(editQuotation.invoice_type || 'NON_GST');
        setCustomerType(editQuotation.customer_type || 'B2C');
        setIsIntraState(!editQuotation.is_interstate);
        setAddress(editQuotation.billing_address || '');
        setShippingAddress(editQuotation.shipping_address || '');
        setShippingSameAsBilling(editQuotation.billing_address === editQuotation.shipping_address);
        setCustomerGstin(editQuotation.customer_gstin || '');
        setNotes(editQuotation.notes || '');
        setDeliveryDetails(editQuotation.delivery_details || '');
        setDiscountAmount((editQuotation.discount_amount || 0).toString());

        if (editQuotation.customers) {
          setSelectedCustomer(editQuotation.customers);
        }

        if (editQuotation.items && editQuotation.items.length > 0) {
          setLineItems(
            editQuotation.items.map((i) => ({
              ...i,
              quantity: i.quantity.toString(),
              unit_price: i.unit_price.toString(),
              discount_amount: (i.discount_amount || 0).toString(),
            }))
          );
        }
      } else {
        setSelectedCustomer(null);
        setAddress('');
        setShippingSameAsBilling(true);
        setShippingAddress('');
        setCustomerGstin('');
        setInvoiceType('NON_GST');
        setCustomerType('B2C');
        setIsIntraState(true);
        setQuotationNo('Loading...');
        setQuotationDate(new Date().toISOString().split('T')[0]);
        setNotes('');
        setDeliveryDetails('');
        setDiscountAmount('0.00');
        setLineItems([
          {
            item_id: null,
            product_name: '',
            description: '',
            quantity: '1',
            unit_price: '0.00',
            discount_amount: '0.00',
            gst_rate: 0,
            tax_amount: 0,
            hsn_code: '',
            amount: 0,
          },
        ]);
      }
      setLineTotalDrafts({});
      setLineTotalErrors({});
      setErrors({});
      setApiError(null);
    }
  }, [open, editQuotation]);

  useEffect(() => {
    if (!open || editQuotation) return;
    const fetchNo = async () => {
      try {
        const nextNo = await getNextQuotationNumber(invoiceType);
        setQuotationNo(nextNo);
      } catch (err) {
        console.error('Failed to get quotation number:', err);
      }
    };
    fetchNo();
  }, [invoiceType, open, editQuotation]);

  const handleCustomerChange = (event, newValue) => {
    setSelectedCustomer(newValue);
    if (newValue) {
      setAddress(newValue.address || '');
      if (shippingSameAsBilling) {
        setShippingAddress(newValue.address || '');
      }
      setCustomerGstin(newValue.gstin || '');
      setCustomerType(newValue.customer_type || 'B2C');
      if (newValue.gstin) {
        const stateCode = newValue.gstin.substring(0, 2);
        setIsIntraState(stateCode === '33');
      }
    } else {
      setAddress('');
      setShippingAddress('');
      setCustomerGstin('');
      setCustomerType('B2C');
      setIsIntraState(true);
    }
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    const item = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price' || field === 'gst_rate') {
      const qty = parseFloat(field === 'quantity' ? value : item.quantity) || 0;
      const rate = parseFloat(field === 'unit_price' ? value : item.unit_price) || 0;
      const gst = parseFloat(field === 'gst_rate' ? value : item.gst_rate) || 0;

      const calc = forwardLineTotal({
        quantity: qty,
        unitPrice: rate,
        gstRate: gst,
        isGst: isGstInvoice,
      });

      item.amount = calc.amount;
      item.tax_amount = calc.taxAmount;
    }

    newItems[index] = item;
    setLineItems(newItems);
  };

  const handleLineTotalDraftChange = (index, rawValue) => {
    setLineTotalDrafts((prev) => ({ ...prev, [index]: rawValue }));
  };

  const handleLineTotalBlurOrEnter = (index) => {
    const item = lineItems[index];
    const draftVal = lineTotalDrafts[index];
    if (draftVal === undefined) return;

    const parsedVal = parseFloat(draftVal);
    const qty = parseFloat(item.quantity) || 0;
    const gst = parseFloat(item.gst_rate) || 0;

    if (isNaN(parsedVal) || parsedVal <= 0) {
      setLineTotalErrors((prev) => ({ ...prev, [index]: true }));
      return;
    }

    setLineTotalErrors((prev) => ({ ...prev, [index]: false }));
    const result = reverseFromLineTotal({
      lineTotal: parsedVal,
      quantity: qty,
      gstRate: gst,
      isGst: isGstInvoice,
    });

    const newItems = [...lineItems];
    newItems[index] = {
      ...item,
      unit_price: result.unitPrice.toString(),
      amount: result.amount,
      tax_amount: result.taxAmount,
    };
    setLineItems(newItems);
    setLineTotalDrafts((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;
    setLineItems((prevItems) => {
      const updated = prevItems.map((item) => {
        if (invoiceType === 'NON_GST') {
          return {
            ...item,
            gst_rate: 0,
            tax_amount: 0,
            hsn_code: '',
          };
        }
        return item;
      });
      updated.forEach((_, idx) => {
        const qty = parseFloat(updated[idx].quantity) || 0;
        const rate = parseFloat(updated[idx].unit_price) || 0;
        const gst = parseFloat(updated[idx].gst_rate) || 0;
        const calc = forwardLineTotal({
          quantity: qty,
          unitPrice: rate,
          gstRate: gst,
          isGst: invoiceType === 'GST',
        });
        updated[idx].amount = calc.amount;
        updated[idx].tax_amount = calc.taxAmount;
      });
      return updated;
    });
  }, [invoiceType, isIntraState, open]);

  const handleAddLine = () => {
    setLineItems([
      ...lineItems,
      {
        item_id: null,
        product_name: '',
        description: '',
        quantity: '1',
        unit_price: '0.00',
        discount_amount: '0.00',
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

  const getTotals = () => {
    let subtotal = 0;
    lineItems.forEach((line) => {
      const qty = parseFloat(line.quantity) || 0;
      const rate = parseFloat(line.unit_price) || 0;
      subtotal += qty * rate;
    });

    const overallDiscount = parseFloat(discountAmount) || 0;
    const taxableValue = Math.max(0, subtotal - overallDiscount);

    let cgst = 0;
    let sgst = 0;
    let igst = 0;
    let totalTax = 0;

    if (isGstInvoice) {
      lineItems.forEach((line) => {
        const qty = parseFloat(line.quantity) || 0;
        const rate = parseFloat(line.unit_price) || 0;
        const lineSubtotal = qty * rate;
        const lineTaxable = subtotal > 0 ? (lineSubtotal / subtotal) * taxableValue : 0;
        const gstRate = parseFloat(line.gst_rate) || 0;
        const lineTax = (lineTaxable * gstRate) / 100;

        if (!isIntraState) {
          igst += lineTax;
        } else {
          cgst += lineTax / 2;
          sgst += lineTax / 2;
        }
      });
      totalTax = cgst + sgst + igst;
    }

    const totalAmount = Math.round(taxableValue + totalTax);

    return {
      subtotal,
      discountAmount: overallDiscount,
      taxableValue,
      cgst,
      sgst,
      igst,
      totalTax,
      totalAmount,
    };
  };

  const hasLineTotalErrors = Object.values(lineTotalErrors).some((hasErr) => hasErr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError(null);

    const newErrors = {};
    if (!selectedCustomer) newErrors.customer = 'Please select a customer';
    if (!quotationDate) newErrors.quotationDate = 'Quotation date is required';
    if (hasLineTotalErrors) newErrors.lineTotal = 'Fix invalid line total fields before submitting';

    if (isGstInvoice && customerType === 'B2B') {
      if (!customerGstin) {
        newErrors.customerGstin = 'GSTIN is required for B2B transactions';
      } else if (!GSTIN_REGEX.test(customerGstin)) {
        newErrors.customerGstin = 'Invalid GSTIN format (e.g. 33AAAAA0000A1Z5)';
      }
    }

    if (lineItems.length === 0) {
      newErrors.lineItems = 'At least one line item is required';
    } else {
      lineItems.forEach((item, index) => {
        if (!item.description || !item.description.trim()) {
          newErrors[`item_${index}_desc`] = 'Description required';
        }
        if (parseFloat(item.quantity) <= 0 || isNaN(parseFloat(item.quantity))) {
          newErrors[`item_${index}_qty`] = 'Invalid qty';
        }
      });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    const totals = getTotals();

    try {
      const quotationPayload = {
        customer_id: selectedCustomer.customer_id,
        quotation_no: quotationNo,
        quotation_date: quotationDate,
        invoice_type: invoiceType,
        customer_type: isGstInvoice ? customerType : null,
        is_interstate: isGstInvoice ? !isIntraState : false,
        customer_name: selectedCustomer.name,
        customer_gstin: isGstInvoice ? customerGstin : null,
        billing_address: address,
        shipping_address: shippingSameAsBilling ? address : shippingAddress,
        total_amount: totals.totalAmount,
        tax_amount: totals.totalTax,
        gst_amount: totals.totalTax,
        discount_amount: totals.discountAmount,
        notes,
        delivery_details: deliveryDetails,
        status: editQuotation ? editQuotation.status : 'draft',
      };

      if (editQuotation) {
        await updateQuotation(editQuotation.quotation_id, quotationPayload, lineItems);
      } else {
        await createQuotation(quotationPayload, lineItems);
      }

      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to save quotation:', err);
      setApiError(err.message || 'An error occurred while saving the quotation.');
    } finally {
      setLoading(false);
    }
  };

  const totals = getTotals();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {editQuotation ? 'Edit Quotation' : 'Create New Quotation'}
      </DialogTitle>

      <DialogContent dividers>
        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {/* Customer Selection */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12} sm={8}>
            <Autocomplete
              options={customers}
              getOptionLabel={(option) => option.name || ''}
              value={selectedCustomer}
              onChange={handleCustomerChange}
              loading={customersLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Customer *"
                  error={!!errors.customer}
                  helperText={errors.customer}
                  size="small"
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Quotation Date *"
              type="date"
              value={quotationDate}
              onChange={(e) => setQuotationDate(e.target.value)}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
              error={!!errors.quotationDate}
              helperText={errors.quotationDate}
            />
          </Grid>
        </Grid>

        {/* Invoice Type & Tax Config */}
        <Grid container spacing={2} mb={2}>
          <Grid item xs={6} sm={3}>
            <TextField
              select
              label="Quotation Type"
              value={invoiceType}
              onChange={(e) => setInvoiceType(e.target.value)}
              fullWidth
              size="small"
            >
              <MenuItem value="NON_GST">NON-GST</MenuItem>
              <MenuItem value="GST">GST</MenuItem>
            </TextField>
          </Grid>

          {isGstInvoice && (
            <React.Fragment>
              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  label="Customer Type"
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="B2C">B2C</MenuItem>
                  <MenuItem value="B2B">B2B</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  label="Customer GSTIN"
                  value={customerGstin}
                  onChange={(e) => setCustomerGstin(e.target.value.toUpperCase())}
                  fullWidth
                  size="small"
                  error={!!errors.customerGstin}
                  helperText={errors.customerGstin}
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <TextField
                  select
                  label="Supply Region"
                  value={isIntraState ? 'INTRA' : 'INTER'}
                  onChange={(e) => setIsIntraState(e.target.value === 'INTRA')}
                  fullWidth
                  size="small"
                >
                  <MenuItem value="INTRA">Intra-State (Tamil Nadu)</MenuItem>
                  <MenuItem value="INTER">Inter-State (Other)</MenuItem>
                </TextField>
              </Grid>
            </React.Fragment>
          )}
        </Grid>

        {/* Line Items Table */}
        <Typography variant="subtitle2" fontWeight={800} mb={1}>
          Line Items
        </Typography>

        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell width="35%">Description *</TableCell>
                <TableCell width="12%">Qty *</TableCell>
                <TableCell width="15%">Unit Price</TableCell>
                {isGstInvoice && <TableCell width="12%">GST %</TableCell>}
                <TableCell width="18%">Line Total</TableCell>
                <TableCell width="8%" align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lineItems.map((line, idx) => {
                const draftVal = lineTotalDrafts[idx];
                const displayVal = draftVal !== undefined ? draftVal : (line.amount || 0).toFixed(2);
                const isErr = !!lineTotalErrors[idx];

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <TextField
                        size="small"
                        fullWidth
                        value={line.description}
                        onChange={(e) => handleLineItemChange(idx, 'description', e.target.value)}
                        error={!!errors[`item_${idx}_desc`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={line.quantity}
                        onChange={(e) => handleLineItemChange(idx, 'quantity', e.target.value)}
                        error={!!errors[`item_${idx}_qty`]}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        type="number"
                        value={line.unit_price}
                        onChange={(e) => handleLineItemChange(idx, 'unit_price', e.target.value)}
                      />
                    </TableCell>
                    {isGstInvoice && (
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={line.gst_rate}
                          onChange={(e) => handleLineItemChange(idx, 'gst_rate', e.target.value)}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <TextField
                        size="small"
                        value={displayVal}
                        onChange={(e) => handleLineTotalDraftChange(idx, e.target.value)}
                        onBlur={() => handleLineTotalBlurOrEnter(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleLineTotalBlurOrEnter(idx);
                          }
                        }}
                        error={isErr}
                        helperText={isErr ? 'Invalid' : ''}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lineItems.length === 1}
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

        <Button
          startIcon={<AddIcon />}
          onClick={handleAddLine}
          variant="outlined"
          size="small"
          sx={{ mb: 2 }}
        >
          Add Line Item
        </Button>

        <Divider sx={{ my: 2 }} />

        {/* Totals Summary */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Quotation Notes"
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 1.5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" fontWeight={700}>₹{totals.subtotal.toFixed(2)}</Typography>
              </Box>
              {isGstInvoice && (
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">GST Amount:</Typography>
                  <Typography variant="body2" fontWeight={700}>₹{totals.totalTax.toFixed(2)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight={800}>Estimated Total:</Typography>
                <Typography variant="subtitle1" fontWeight={800} color="primary">₹{totals.totalAmount.toFixed(2)}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || hasLineTotalErrors}
          startIcon={loading && <CircularProgress size={16} />}
        >
          {editQuotation ? 'Save Changes' : 'Create Quotation'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuotationDialog;

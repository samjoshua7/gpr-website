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
  FormControlLabel,
  Checkbox,
} from '@mui/material';

import { createItem, updateItem } from '../api';
import { getTaxRates } from '../../salesInvoices/api';

export const ItemDialog = ({ open, onClose, item, onSaveSuccess }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('sheet');
  const [unitPrice, setUnitPrice] = useState('0.00');
  const [reorderLevel, setReorderLevel] = useState('0.00');
  const [hsnCode, setHsnCode] = useState('');
  const [taxRateId, setTaxRateId] = useState('');
  const [active, setActive] = useState(true);

  // Tax rates selection list
  const [taxRates, setTaxRates] = useState([]);
  const [taxLoading, setTaxLoading] = useState(false);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const isEdit = !!item;

  useEffect(() => {
    const fetchTaxRates = async () => {
      setTaxLoading(true);
      try {
        const list = await getTaxRates();
        setTaxRates(list);
      } catch (err) {
        console.error('Failed to load tax rates:', err);
      } finally {
        setTaxLoading(false);
      }
    };

    if (open) {
      fetchTaxRates();
      if (item) {
        setName(item.name || '');
        setUnit(item.unit || 'sheet');
        setUnitPrice(item.unit_price?.toString() || '0.00');
        setReorderLevel(item.reorder_level?.toString() || '0.00');
        setHsnCode(item.hsn_code || '');
        setTaxRateId(item.tax_rate_id || '');
        setActive(item.active !== false);
      } else {
        setName('');
        setUnit('sheet');
        setUnitPrice('0.00');
        setReorderLevel('0.00');
        setHsnCode('');
        setTaxRateId('');
        setActive(true);
      }
      setErrors({});
      setApiError(null);
    }
  }, [open, item]);

  const validate = () => {
    const tempErrors = {};
    if (!name.trim()) tempErrors.name = 'Name is required';
    if (!unit.trim()) tempErrors.unit = 'Unit of measurement is required';
    
    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      tempErrors.unitPrice = 'Rate must be 0 or positive';
    }
    const reorderNum = parseFloat(reorderLevel);
    if (isNaN(reorderNum) || reorderNum < 0) {
      tempErrors.reorderLevel = 'Reorder level must be 0 or positive';
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
      unit: unit.trim(),
      unit_price: parseFloat(unitPrice),
      reorder_level: parseFloat(reorderLevel),
      tax_rate_id: taxRateId || null,
      hsn_code: hsnCode.trim() || null,
      active,
    };

    try {
      if (isEdit) {
        await updateItem(item.item_id, payload);
      } else {
        await createItem(payload);
      }
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to save inventory catalog product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        {isEdit ? 'Edit Catalog Product' : 'Add Catalog Product'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Product Name */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={loading}
              />
            </Grid>

            {/* Unit */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Unit (e.g. sheet, kg, box) *"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                error={!!errors.unit}
                helperText={errors.unit}
                disabled={loading}
              />
            </Grid>

            {/* Rate */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Default Rate (₹) *"
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                error={!!errors.unitPrice}
                helperText={errors.unitPrice}
                inputProps={{ min: '0', step: '0.01' }}
                disabled={loading}
              />
            </Grid>

            {/* Reorder Level */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Reorder Alert Level *"
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                error={!!errors.reorderLevel}
                helperText={errors.reorderLevel}
                inputProps={{ min: '0', step: '0.01' }}
                disabled={loading}
              />
            </Grid>

            {/* HSN Code */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="HSN / SAC Code"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                disabled={loading}
              />
            </Grid>

            {/* Tax Rate FK */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={taxLoading}>
                <InputLabel id="item-tax-label">Linked GST rate</InputLabel>
                <Select
                  labelId="item-tax-label"
                  id="item-tax"
                  value={taxRateId}
                  label="Linked GST rate"
                  onChange={(e) => setTaxRateId(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Exempt (0%)</em>
                  </MenuItem>
                  {taxRates.map((t) => (
                    <MenuItem key={t.tax_rate_id} value={t.tax_rate_id}>
                      {t.tax_name} ({t.percentage}%)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Active Status */}
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    color="primary"
                    disabled={loading}
                  />
                }
                label="Active in Catalog"
                sx={{ mt: 1 }}
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
            {isEdit ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ItemDialog;

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
  Typography,
} from '@mui/material';

import { adjustStock } from '../api';

export const StockAdjustmentDialog = ({ open, onClose, item, onSaveSuccess }) => {
  const [type, setType] = useState('in');
  const [quantity, setQuantity] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    if (open) {
      setType('in');
      setQuantity('');
      setErrors({});
      setApiError(null);
    }
  }, [open]);

  const validate = () => {
    const tempErrors = {};
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      tempErrors.quantity = 'Quantity must be greater than 0';
    }
    if (type === 'out' && item && qtyNum > parseFloat(item.current_stock || 0)) {
      tempErrors.quantity = `Insufficient stock. Max available: ${item.current_stock} ${item.unit}`;
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError(null);

    try {
      await adjustStock(item.item_id, type, quantity);
      onSaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Failed to complete stock adjustment ledger insertion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>Adjust Stock Level</DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {apiError && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {apiError}
            </Alert>
          )}

          {item && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid rgba(0,0,0,0.06)' }}>
              <Typography variant="subtitle2" color="text.secondary">PRODUCT</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{item.name}</Typography>
              <Typography variant="caption" color="text.secondary">CURRENT STOCK</Typography>
              <Typography variant="body1" sx={{ fontWeight: 800 }}>
                {parseFloat(item.current_stock || 0).toFixed(2)} {item.unit}
              </Typography>
            </Box>
          )}

          <Grid container spacing={2}>
            {/* Adjustment Type */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="adjust-type-label">Adjustment Type *</InputLabel>
                <Select
                  labelId="adjust-type-label"
                  id="adjust-type"
                  value={type}
                  label="Adjustment Type *"
                  onChange={(e) => setType(e.target.value)}
                  disabled={loading}
                >
                  <MenuItem value="in">Add Stock (Receive / Adjustment +)</MenuItem>
                  <MenuItem value="out">Reduce Stock (Damage / Adjustment -)</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adjustment Quantity *"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                error={!!errors.quantity}
                helperText={errors.quantity}
                inputProps={{ min: '0.01', step: 'any' }}
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
            Post Adjustment
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default StockAdjustmentDialog;

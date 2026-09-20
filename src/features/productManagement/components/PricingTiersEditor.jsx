import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Paper,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

export const PricingTiersEditor = ({ tiers, onChange }) => {
  const handleAddTier = () => {
    // Suggest default min qty based on previous tier's max
    const lastTier = tiers[tiers.length - 1];
    const nextMin = lastTier && lastTier.max_quantity ? parseInt(lastTier.max_quantity, 10) + 1 : 100;

    const newTier = {
      min_quantity: nextMin,
      max_quantity: '',
      price_per_unit: '0.00',
    };
    onChange([...tiers, newTier]);
  };

  const handleRemoveTier = (index) => {
    const updated = tiers.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFieldChange = (index, field, value) => {
    const updated = tiers.map((tier, i) => {
      if (i === index) {
        return { ...tier, [field]: value };
      }
      return tier;
    });
    onChange(updated);
  };

  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            Quantity Volume Pricing (Tiers)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Set discounted per-unit rates when customers order larger batches. Leave Max Qty empty for unlimited.
          </Typography>
        </Box>
        <Button
          size="small"
          variant="outlined"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleAddTier}
        >
          Add Tier
        </Button>
      </Box>

      {tiers.length === 0 ? (
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            textAlign: 'center',
            bgcolor: 'grey.50',
            borderStyle: 'dashed',
            borderRadius: 1.5,
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            No volume pricing tiers configured. The product will sell at its standard base price.
          </Typography>
          <Button size="small" variant="text" onClick={handleAddTier}>
            Create First Tier
          </Button>
        </Paper>
      ) : (
        <Paper variant="outlined" sx={{ overflow: 'hidden', borderRadius: 1.5 }}>
          <Table size="small">
            <TableHead sx={{ bgcolor: 'grey.50' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, width: '28%' }}>Min Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '28%' }}>Max Quantity</TableCell>
                <TableCell sx={{ fontWeight: 700, width: '34%' }}>Price Per Unit (₹)</TableCell>
                <TableCell sx={{ width: '10%' }} align="center">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tiers.map((tier, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={tier.min_quantity}
                      onChange={(e) => handleFieldChange(index, 'min_quantity', e.target.value)}
                      placeholder="e.g. 100"
                      fullWidth
                      inputProps={{ min: 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={tier.max_quantity ?? ''}
                      onChange={(e) => handleFieldChange(index, 'max_quantity', e.target.value)}
                      placeholder="e.g. 499 (or empty)"
                      fullWidth
                      helperText={!tier.max_quantity ? 'Unlimited (∞)' : ''}
                      inputProps={{ min: tier.min_quantity || 1 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      type="number"
                      size="small"
                      value={tier.price_per_unit}
                      onChange={(e) => handleFieldChange(index, 'price_per_unit', e.target.value)}
                      placeholder="e.g. 2.50"
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Remove Tier">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveTier(index)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
};

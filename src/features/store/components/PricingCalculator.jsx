import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

export const PricingCalculator = ({
  unitPrice,
  quantity,
  subtotal,
  hasTierDiscount,
  onAddToCart,
  addingToCart,
  addedSuccess,
  quantityValid = true,
  onGoToCart,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ letterSpacing: '0.05em' }}>
        ORDER PRICE SUMMARY
      </Typography>

      <Box sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="h4" fontWeight={900} color="primary.main" sx={{ fontFamily: 'monospace' }}>
          ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          (Excl. GST)
        </Typography>
      </Box>

      {hasTierDiscount && (
        <Chip
          label="Volume Tier Discount Applied!"
          size="small"
          color="success"
          sx={{ fontWeight: 700, fontSize: '0.72rem', mb: 2 }}
        />
      )}

      <Divider sx={{ my: 2 }} />

      <Stack spacing={1.2} sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Quantity:</Typography>
          <Typography variant="body2" fontWeight={700}>{quantity.toLocaleString('en-IN')} units</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Effective Unit Rate:</Typography>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
            ₹{unitPrice.toFixed(2)} / unit
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">Estimated GST (18%):</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            ₹{((subtotal * 18) / 100).toFixed(2)}
          </Typography>
        </Box>
      </Stack>

      {addedSuccess ? (
        <Stack spacing={1.5}>
          <Button
            variant="contained"
            color="success"
            fullWidth
            size="large"
            startIcon={<CheckCircleOutlineIcon />}
            sx={{
              py: 1.5,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Item Added to Cart!
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={onGoToCart}
            sx={{
              py: 1.2,
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 700,
            }}
          >
            Proceed to Cart &rarr;
          </Button>
        </Stack>
      ) : (
        <Button
          variant="contained"
          fullWidth
          size="large"
          startIcon={addingToCart ? <CircularProgress size={20} color="inherit" /> : <ShoppingCartIcon />}
          onClick={onAddToCart}
          disabled={addingToCart || !quantityValid}
          sx={{
            py: 1.6,
            borderRadius: 2.5,
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 800,
            boxShadow: '0 8px 16px rgba(30, 27, 75, 0.2)',
          }}
        >
          {addingToCart ? 'Adding...' : quantityValid ? 'Add to Cart' : 'Enter a valid quantity'}
        </Button>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
        Transparent factory billing &bull; Free pre-flight artwork review
      </Typography>
    </Paper>
  );
};

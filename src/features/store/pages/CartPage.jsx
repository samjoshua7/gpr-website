import React from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  TextField,
  Divider,
  Stack,
  Avatar,
  Chip,
  Breadcrumbs,
  Link,
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import GoogleIcon from '@mui/icons-material/Google';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { StoreFooter } from '../components/StoreFooter';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../hooks/useAuth';

export const CartPage = () => {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { items, cartTotal, updateQuantity, removeItem, clearCart } = useCart();

  const gstAmount = Math.round(((cartTotal * 18) / 100) * 100) / 100;
  const grandTotal = cartTotal + gstAmount;

  const handleCheckoutClick = () => {
    if (!user) {
      // User must be logged in to checkout
      signInWithGoogle();
    } else {
      navigate('/checkout');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            Shopping Cart
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" sx={{ mb: 4 }}>
          Your Shopping Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
        </Typography>

        {items.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3.5,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'rgba(30, 27, 75, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <ShoppingBagIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="text.primary">
              Your cart is currently empty
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 4, maxWidth: 450, mx: 'auto' }}>
              Explore our full commercial offset catalog and customize business cards, wedding stationery, banners, and letterhead pads.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/products')}
              sx={{ px: 4, py: 1.4, borderRadius: 2.5, textTransform: 'none', fontWeight: 700 }}
            >
              Browse Catalog
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={4}>
            {/* LEFT COLUMN: CART ITEMS LIST */}
            <Grid item xs={12} lg={8}>
              <Stack spacing={2.5}>
                {items.map((item) => (
                  <Paper
                    key={item.id}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      borderRadius: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      bgcolor: 'background.paper',
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: 2.5,
                      alignItems: { sm: 'center' },
                    }}
                  >
                    {/* Item Thumbnail */}
                    <Avatar
                      variant="rounded"
                      src={item.product_image_url}
                      alt={item.product_name}
                      sx={{
                        width: { xs: '100%', sm: 90 },
                        height: 90,
                        borderRadius: 2,
                        bgcolor: 'grey.100',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: '1.75rem' }} />
                    </Avatar>

                    {/* Item Details */}
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight={800}
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { color: 'primary.main' },
                        }}
                        onClick={() => navigate(`/products/${item.product_slug}`)}
                      >
                        {item.product_name}
                      </Typography>

                      {/* Selected Options Summary */}
                      {item.selected_option_labels && Object.keys(item.selected_option_labels).length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, my: 1 }}>
                          {Object.entries(item.selected_option_labels).map(([optName, valLabel]) => (
                            <Chip
                              key={optName}
                              label={`${optName}: ${valLabel}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.72rem', height: 22 }}
                            />
                          ))}
                        </Box>
                      )}

                      {/* Design Provision Badge */}
                      <Chip
                        label={
                          item.design_provision === 'design_by_gpr'
                            ? 'Creative Design by GPR Studio'
                            : 'Self-Supplied Artwork'
                        }
                        size="small"
                        color={item.design_provision === 'design_by_gpr' ? 'secondary' : 'default'}
                        sx={{ fontSize: '0.7rem', height: 20, fontWeight: 600 }}
                      />
                    </Box>

                    {/* Quantity Modifier */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, e.target.value)}
                        sx={{ width: 100 }}
                        inputProps={{ min: 1, step: 50 }}
                        label="Qty"
                      />
                    </Box>

                    {/* Item Subtotal & Delete */}
                    <Box sx={{ textAlign: { xs: 'left', sm: 'right' }, minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        @ ₹{(item.unit_price || (item.subtotal / item.quantity)).toFixed(2)} / unit
                      </Typography>
                      <Typography variant="h6" fontWeight={800} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                        ₹{item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>

                    <Tooltip title="Remove Item">
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => removeItem(item.id)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Paper>
                ))}
              </Stack>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                <Button
                  variant="text"
                  onClick={() => navigate('/products')}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  &larr; Continue Shopping
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  onClick={clearCart}
                  sx={{ textTransform: 'none', color: 'text.secondary' }}
                >
                  Clear Cart
                </Button>
              </Box>
            </Grid>

            {/* RIGHT COLUMN: ORDER SUMMARY CARD */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3.5,
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: '#ffffff',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2.5 }}>
                  Order Summary
                </Typography>

                <Stack spacing={1.8} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Item Subtotal (Excl. GST):</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">GST (18% Applicable):</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Delivery / Pallet Shipping:</Typography>
                    <Typography variant="body2" color="success.main" fontWeight={700}>
                      Calculated on Dispatch
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" fontWeight={800}>Estimated Total:</Typography>
                    <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>

                {user ? (
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleCheckoutClick}
                    sx={{
                      py: 1.6,
                      borderRadius: 2.5,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 800,
                      boxShadow: '0 8px 20px rgba(30, 27, 75, 0.2)',
                    }}
                  >
                    Proceed to Checkout
                  </Button>
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<GoogleIcon />}
                      onClick={handleCheckoutClick}
                      sx={{
                        py: 1.6,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 800,
                        bgcolor: 'primary.main',
                      }}
                    >
                      Sign In with Google to Checkout
                    </Button>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                      Sign in seamlessly with Google to review delivery details and confirm your order.
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 3 }}>
                  Official GST Invoicing &bull; Safe &amp; Secure Checkout
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>

      <StoreFooter />
    </Box>
  );
};

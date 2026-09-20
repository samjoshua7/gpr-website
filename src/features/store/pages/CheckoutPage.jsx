import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  Stack,
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  Avatar,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import GoogleIcon from '@mui/icons-material/Google';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { StoreFooter } from '../components/StoreFooter';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';

export const CheckoutPage = () => {
  const navigate = useNavigate();
  const { user, profile, signInWithGoogle } = useAuth();
  const { items, cartTotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    gstin: '',
    billing_address: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
    notes: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Pre-fill customer details from profile or online_customers table
  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || '',
      email: user.email || '',
    }));

    // Check existing online_customer profile
    supabase
      .from('online_customers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setFormData((prev) => ({
            ...prev,
            name: data.name || prev.name,
            phone: data.phone || prev.phone,
            company_name: data.company_name || prev.company_name,
            gstin: data.gstin || prev.gstin,
            billing_address: data.billing_address || prev.billing_address,
            city: data.city || prev.city,
            state: data.state || prev.state,
            pincode: data.pincode || prev.pincode,
          }));
        }
      });
  }, [user, profile]);

  const gstAmount = Math.round(((cartTotal * 18) / 100) * 100) / 100;
  const grandTotal = cartTotal + gstAmount;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!formData.phone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!formData.billing_address.trim() || !formData.city.trim() || !formData.pincode.trim()) {
      setError('Please provide complete delivery and billing address details.');
      return;
    }
    if (items.length === 0) {
      setError('Your shopping cart is empty.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const itemsPayload = items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        selected_options: item.selected_options || {},
        design_provision: item.design_provision || 'self_supplied',
      }));

      // Call atomic DB RPC function
      const { data, error: rpcError } = await supabase.rpc('place_online_order', {
        p_customer_name: formData.name.trim(),
        p_customer_email: formData.email.trim(),
        p_customer_phone: formData.phone.trim(),
        p_customer_company: formData.company_name.trim() || null,
        p_customer_gstin: formData.gstin.trim() || null,
        p_billing_address: formData.billing_address.trim(),
        p_city: formData.city.trim(),
        p_state: formData.state.trim(),
        p_pincode: formData.pincode.trim(),
        p_notes: formData.notes.trim() || null,
        p_items: itemsPayload,
      });

      if (rpcError) throw new Error(rpcError.message);

      // Clear local cart
      await clearCart();

      // Redirect to confirmation screen
      navigate(`/order-confirmation/${data.order_id}`, {
        state: { order: data, customer: formData },
      });
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // If unauthenticated, prompt Google login
  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <Container maxWidth="sm" sx={{ py: 12, flexGrow: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 6,
              borderRadius: 4,
              border: '1px solid',
              borderColor: 'divider',
              textAlign: 'center',
              bgcolor: 'background.paper',
            }}
          >
            <Avatar
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                mx: 'auto',
                mb: 2.5,
              }}
            >
              <LockIcon />
            </Avatar>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 1 }}>
              Sign In to Place Your Order
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
              To ensure order tracking, invoice generation, and artwork coordination, please sign in with your Google account.
            </Typography>
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<GoogleIcon />}
              onClick={() => signInWithGoogle()}
              sx={{
                py: 1.6,
                borderRadius: 2.5,
                textTransform: 'none',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              Continue with Google
            </Button>
          </Paper>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  // If cart is empty
  if (items.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center', flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Your cart is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Add customized products to your cart before proceeding to checkout.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/products')}>
            Browse Catalog
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Link component={RouterLink} to="/cart" color="inherit" underline="hover">
            Cart
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            Checkout &amp; Confirmation
          </Typography>
        </Breadcrumbs>

        <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" sx={{ mb: 4 }}>
          Checkout &amp; Order Confirmation
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmitOrder}>
          <Grid container spacing={4}>
            {/* LEFT COLUMN: CUSTOMER & DELIVERY DETAILS */}
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 4 },
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  mb: 3,
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                  1. Contact &amp; Billing Details
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full Contact Name"
                      required
                      fullWidth
                      size="small"
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Anand Kumar"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email Address"
                      required
                      fullWidth
                      size="small"
                      disabled
                      value={formData.email}
                      helperText="Linked to your Google account"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Mobile Phone Number"
                      required
                      fullWidth
                      size="small"
                      value={formData.phone}
                      onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="e.g. 9876543210"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Company / Business Name (Optional)"
                      fullWidth
                      size="small"
                      value={formData.company_name}
                      onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
                      placeholder="e.g. Apex Infotech"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="GSTIN Number (Optional)"
                      fullWidth
                      size="small"
                      value={formData.gstin}
                      onChange={(e) => setFormData((p) => ({ ...p, gstin: e.target.value }))}
                      placeholder="e.g. 33AAAAA0000A1Z5"
                      helperText="For B2B input tax credit invoice"
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
                  2. Shipping &amp; Factory Delivery Address
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <TextField
                      label="Street Address / Door No / Building"
                      required
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={formData.billing_address}
                      onChange={(e) => setFormData((p) => ({ ...p, billing_address: e.target.value }))}
                      placeholder="e.g. 14/B Gandhi Road, Industrial Estate"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="City / Town"
                      required
                      fullWidth
                      size="small"
                      value={formData.city}
                      onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                      placeholder="e.g. Madurai"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="State"
                      required
                      fullWidth
                      size="small"
                      value={formData.state}
                      onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Postal Pincode"
                      required
                      fullWidth
                      size="small"
                      value={formData.pincode}
                      onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
                      placeholder="e.g. 625001"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Special Instructions &amp; Artwork Notes (Optional)"
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Any specific instructions regarding paper grain, color matching, or rush delivery."
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* RIGHT COLUMN: ORDER SUMMARY & SUBMIT */}
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
                  position: { lg: 'sticky' },
                  top: 90,
                }}
              >
                <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>
                  Order Review ({items.length} items)
                </Typography>

                {/* Items Mini-List */}
                <Stack spacing={2} sx={{ maxHeight: 260, overflowY: 'auto', pr: 0.5, mb: 3 }}>
                  {items.map((item) => (
                    <Box key={item.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Avatar
                        variant="rounded"
                        src={item.product_image_url}
                        sx={{ width: 44, height: 44, bgcolor: 'grey.100' }}
                      >
                        <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                          {item.product_name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.quantity} units &bull; ₹{item.unit_price?.toFixed(2)}/unit
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        ₹{item.subtotal.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                {/* Totals */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Item Subtotal:</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{cartTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">GST (18%):</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" fontWeight={800}>Total Payable:</Typography>
                    <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                      ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                  sx={{
                    py: 1.6,
                    borderRadius: 2.5,
                    textTransform: 'none',
                    fontSize: '1rem',
                    fontWeight: 800,
                    boxShadow: '0 8px 20px rgba(30, 27, 75, 0.25)',
                  }}
                >
                  {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
                </Button>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                  Your order is booked directly in our factory press queue. Artwork files will be confirmed by phone or email.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </form>
      </Container>

      <StoreFooter />
    </Box>
  );
};

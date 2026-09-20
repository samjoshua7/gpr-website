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
  Alert,
  Breadcrumbs,
  Link,
  CircularProgress,
  Avatar,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';

export const CustomerAccountPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

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
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    setFormData((prev) => ({
      ...prev,
      name: profile?.name || user.user_metadata?.full_name || '',
      email: user.email || '',
    }));

    supabase
      .from('online_customers')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error: fetchErr }) => {
        if (data) {
          setFormData({
            name: data.name || profile?.name || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            company_name: data.company_name || '',
            gstin: data.gstin || '',
            billing_address: data.billing_address || '',
            city: data.city || '',
            state: data.state || 'Tamil Nadu',
            pincode: data.pincode || '',
          });
        }
        if (fetchErr) setError(fetchErr.message);
      })
      .finally(() => setLoading(false));
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const payload = {
        user_id: user.id,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        company_name: formData.company_name.trim() || null,
        gstin: formData.gstin.trim() || null,
        billing_address: formData.billing_address.trim() || null,
        city: formData.city.trim() || null,
        state: formData.state.trim() || null,
        pincode: formData.pincode.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase
        .from('online_customers')
        .upsert(payload, { onConflict: 'user_id' });

      if (upsertErr) throw new Error(upsertErr.message);

      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Sign In Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to view and manage your customer profile.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      <Container maxWidth="lg" sx={{ py: 4, flexGrow: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            Customer Account
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              sx={{
                width: 56,
                height: 56,
                bgcolor: 'primary.main',
                fontSize: '1.4rem',
                fontWeight: 800,
              }}
            >
              {formData.name ? formData.name[0].toUpperCase() : 'U'}
            </Avatar>
            <Box>
              <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em">
                {formData.name || 'My Profile'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formData.email}
              </Typography>
            </Box>
          </Box>

          <Button
            variant="outlined"
            startIcon={<ShoppingBagIcon />}
            onClick={() => navigate('/account/orders')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            My Orders
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} icon={<CheckCircleIcon />}>
            Your profile and shipping details have been updated successfully!
          </Alert>
        )}

        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 6 }} />
        ) : (
          <Paper
            elevation={0}
            component="form"
            onSubmit={handleSubmit}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: 3.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Personal &amp; Business Information
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  required
                  fullWidth
                  size="small"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  disabled
                  fullWidth
                  size="small"
                  value={formData.email}
                  helperText="Primary Google Account email"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  size="small"
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="e.g. 9876543210"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company / Business Name"
                  fullWidth
                  size="small"
                  value={formData.company_name}
                  onChange={(e) => setFormData((p) => ({ ...p, company_name: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="GSTIN (for B2B Invoices)"
                  fullWidth
                  size="small"
                  value={formData.gstin}
                  onChange={(e) => setFormData((p) => ({ ...p, gstin: e.target.value }))}
                  placeholder="33AAAAA0000A1Z5"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" fontWeight={800} sx={{ mb: 3 }}>
              Default Delivery &amp; Billing Address
            </Typography>

            <Grid container spacing={2.5}>
              <Grid item xs={12}>
                <TextField
                  label="Street Address / Door No"
                  fullWidth
                  size="small"
                  multiline
                  rows={2}
                  value={formData.billing_address}
                  onChange={(e) => setFormData((p) => ({ ...p, billing_address: e.target.value }))}
                  placeholder="Street name, landmark, area"
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="City"
                  fullWidth
                  size="small"
                  value={formData.city}
                  onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="State"
                  fullWidth
                  size="small"
                  value={formData.state}
                  onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  label="Postal Pincode"
                  fullWidth
                  size="small"
                  value={formData.pincode}
                  onChange={(e) => setFormData((p) => ({ ...p, pincode: e.target.value }))}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={saving}
                sx={{ px: 4, py: 1.2, borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      <StoreFooter />
    </Box>
  );
};

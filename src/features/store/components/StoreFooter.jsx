import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Stack,
  Divider,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import { BrandLogo } from '../../../components/common/BrandLogo';
import { getCompanySettings } from '../../settings/api';

export const StoreFooter = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getCompanySettings()
      .then((data) => setSettings(data))
      .catch((err) => console.warn('Failed to load company settings for footer', err));
  }, []);

  const companyName = settings?.company_name || 'GPR Offset Printers';
  const address = settings?.address || 'Industrial Estate, Tirunelveli, Tamil Nadu 627001';
  const phone = settings?.phone || '+91 94431 00000';
  const email = settings?.email || 'sales@gproffset.com';
  const gstin = settings?.gstin;

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#090d16',
        color: '#94a3b8',
        pt: 8,
        pb: 5,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        mt: 'auto',
      }}
    >
      <Container maxWidth="xl">
        <Grid container spacing={5}>
          {/* Brand Info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 2 }}>
              <BrandLogo size={42} textColor="#ffffff" />
            </Box>
            <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 3 }}>
              Tirunelveli&apos;s premier commercial offset press. High-precision color printing, packaging, wedding stationery, and outdoor marketing media built with modern Japanese offset technology.
            </Typography>
            {gstin && (
              <Typography variant="caption" sx={{ display: 'block', color: '#64748b', fontFamily: 'monospace' }}>
                GSTIN: {gstin}
              </Typography>
            )}
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
              SHOP PRODUCTS
            </Typography>
            <Stack spacing={1.5}>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/products?category=visiting-cards')}
                sx={{ textAlign: 'left' }}
              >
                Visiting Cards
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/products?category=wedding-printing')}
                sx={{ textAlign: 'left' }}
              >
                Wedding Printing
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/products?category=flex-banner')}
                sx={{ textAlign: 'left' }}
              >
                Flex Banners
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/products?category=office-stationery')}
                sx={{ textAlign: 'left' }}
              >
                Office Stationery
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/products')}
                sx={{ textAlign: 'left' }}
              >
                All Products &rarr;
              </Link>
            </Stack>
          </Grid>

          {/* Customer Portal */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="subtitle2" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
              CUSTOMER DESK
            </Typography>
            <Stack spacing={1.5}>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/cart')}
                sx={{ textAlign: 'left' }}
              >
                Shopping Cart
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/account/orders')}
                sx={{ textAlign: 'left' }}
              >
                My Orders
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/account')}
                sx={{ textAlign: 'left' }}
              >
                Profile Settings
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/about')}
                sx={{ textAlign: 'left' }}
              >
                About &amp; Plant Capabilities
              </Link>
              <Link
                component="button"
                variant="body2"
                color="inherit"
                underline="hover"
                onClick={() => navigate('/login')}
                sx={{ textAlign: 'left' }}
              >
                Staff ERP Login
              </Link>
            </Stack>
          </Grid>

          {/* Contact Details */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" fontWeight={700} color="#fff" sx={{ mb: 2 }}>
              FACTORY &amp; OFFICE
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                <LocationOnIcon fontSize="small" sx={{ color: 'primary.light', mt: 0.3 }} />
                <Typography variant="body2">{address}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <PhoneIcon fontSize="small" sx={{ color: 'primary.light' }} />
                <Typography variant="body2">{phone}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <EmailIcon fontSize="small" sx={{ color: 'primary.light' }} />
                <Typography variant="body2">{email}</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="caption" color="#64748b">
            &copy; {new Date().getFullYear()} {companyName}. All rights reserved. Precision Offset &amp; Digital Printing.
          </Typography>
          <Typography variant="caption" color="#64748b">
            ISO Quality Standards &bull; High Resolution CTP Plates
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

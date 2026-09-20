import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';

export const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      {/* Hero Header */}
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: { xs: 5, md: 6 } }}>
        <Container maxWidth="xl">
          <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" sx={{ color: 'rgba(255,255,255,0.6)' }} />}
            sx={{ mb: 2 }}
          >
            <Link
              underline="hover"
              color="inherit"
              sx={{ cursor: 'pointer', opacity: 0.8, fontSize: '0.85rem' }}
              onClick={() => navigate('/')}
            >
              Home
            </Link>
            <Typography color="#ffffff" sx={{ fontSize: '0.85rem', fontWeight: 700 }}>
              About Us &amp; Production
            </Typography>
          </Breadcrumbs>

          <Typography
            variant="overline"
            sx={{ letterSpacing: '0.15em', fontWeight: 700, color: 'primary.light', opacity: 0.9 }}
          >
            HERITAGE &bull; CRAFTSMANSHIP &bull; PRECISION
          </Typography>
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.02em', mt: 0.5, mb: 1.5 }}>
            About GPR Offset Printers
          </Typography>
          <Typography variant="h6" sx={{ color: '#cbd5e1', maxWidth: 750, fontWeight: 400, lineHeight: 1.5 }}>
            Serving businesses, publishers, and agencies since 1997 with industrial-grade Japanese offset machinery, automated color calibration, and transparent factory pricing.
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ py: 6, flexGrow: 1 }}>
        {/* Company Overview Section */}
        <Grid container spacing={5} alignItems="center" sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              SINCE 1997 &bull; TIRUNELVELI, TAMIL NADU
            </Typography>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" sx={{ mb: 2.5 }}>
              Mastering the Art of Modern Commercial Printing
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 2 }}>
              Founded in 1997 in Tirunelveli, <strong>GPR Offset Printers</strong> has grown from a humble local press into a high-capacity regional printing facility. We specialize in commercial business cards, multi-color brochures, wedding invitations, product packaging, flex outdoor media, and institutional catalogs.
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, mb: 3 }}>
              Every print run is governed by exacting colorimetric standards. We eliminate broker commissions by producing directly on our plant floor, passing volume discounts and reliable delivery commitments straight to our clients across South India.
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/products')}
              sx={{ fontWeight: 700, borderRadius: 2, px: 3.5, py: 1.2 }}
            >
              Browse Commercial Catalog
            </Button>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, sm: 4 },
                borderRadius: 4,
                bgcolor: '#0f172a',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.3)',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 3, color: 'primary.light' }}>
                Plant Specifications &amp; Capabilities
              </Typography>

              <Grid container spacing={3}>
                {[
                  { label: 'Founded', value: '1997 (28+ Years Experience)' },
                  { label: 'Plant Location', value: 'Tirunelveli, Tamil Nadu' },
                  { label: 'Platemaking', value: 'Thermal 2400 DPI Violet CTP' },
                  { label: 'Press Fleet', value: 'Komori & Heidelberg Multi-Color' },
                  { label: 'Post-Press Finishing', value: 'Lamination, Die-Cutting, Foil Stamping, Spot UV' },
                  { label: 'Daily Capacity', value: 'Over 150,000 Impressions / Day' },
                ].map((item, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.label}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ color: '#ffffff', mt: 0.3 }}>
                      {item.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 6 }} />

        {/* 4 Pillars / Trust Badges */}
        <Box sx={{ mb: 8 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              OUR COMMITMENT
            </Typography>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em">
              Four Pillars of GPR Printing
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                icon: <WorkspacePremiumIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />,
                title: 'Japanese Offset Tech',
                desc: 'Ultra-crisp 2400 DPI CTP plates and true-to-life CMYK color calibration ensuring flawless ink density and sharpness.',
              },
              {
                icon: <MonetizationOnIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />,
                title: 'Factory-Direct Pricing',
                desc: 'Zero broker markups. Volume discounts with transparent tier brackets calculated directly at factory wholesale rates.',
              },
              {
                icon: <SpeedIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />,
                title: 'Rapid Turnaround',
                desc: 'Dedicated production shifts and automated finishing lines guarantee timely dispatch for urgent events and launches.',
              },
              {
                icon: <LocalShippingIcon sx={{ fontSize: '2.5rem', color: 'primary.main' }} />,
                title: 'Doorstep Courier & Cargo',
                desc: 'Carefully palletized packing delivered safely across Tamil Nadu and South India with parcel tracking.',
              },
            ].map((feature, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    height: '100%',
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.06)',
                    bgcolor: 'background.paper',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 24px rgba(0,0,0,0.05)',
                      borderColor: 'primary.light',
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1, fontSize: '1.05rem' }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {feature.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ my: 6 }} />

        {/* 4-Step Ordering Workflow Section */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              STREAMLINED FULFILLMENT
            </Typography>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em">
              How Online Ordering Works
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 650, mx: 'auto', mt: 1 }}>
              Order custom commercial printing straight from our Tirunelveli factory floor in four transparent steps.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {[
              {
                step: '01',
                title: 'Select Specs & Paper',
                desc: 'Pick your product, choose paper GSM, lamination finish, and required quantity. Instant transparent tier pricing is calculated in real time.',
              },
              {
                step: '02',
                title: 'Supply Artwork',
                desc: 'Choose whether you have print-ready PDF/CDR vector artwork or request GPR studio prepress designers to review and assist.',
              },
              {
                step: '03',
                title: 'Offset Plate Making & Run',
                desc: 'Our Heidelberg and Komori offset presses run your job with automated spectrophotometer inspection to ensure uniform ink density.',
              },
              {
                step: '04',
                title: 'Direct Dispatch',
                desc: 'Packed securely in waterproof corrugated cartons and dispatched straight to your commercial doorstep via trusted cargo partners.',
              },
            ].map((stepItem, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3.5,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.06)',
                  }}
                >
                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{ color: 'primary.main', opacity: 0.8, mb: 1.5, fontFamily: 'monospace' }}
                  >
                    {stepItem.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1, fontSize: '1.1rem' }}>
                    {stepItem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {stepItem.desc}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Bottom CTA */}
          <Box sx={{ mt: 6, p: 4, borderRadius: 3, bgcolor: '#0f172a', color: '#fff', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
              Ready to print your next commercial project?
            </Typography>
            <Typography variant="body2" sx={{ color: '#cbd5e1', maxWidth: 600, mx: 'auto', mb: 3 }}>
              Explore customizable business cards, catalogs, brochures, flex signs, and office stationery with live volume pricing.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<StorefrontIcon />}
              onClick={() => navigate('/products')}
              sx={{ fontWeight: 700, borderRadius: 2, px: 4, py: 1.3 }}
            >
              Explore Products Now
            </Button>
          </Box>
        </Box>
      </Container>

      <StoreFooter />
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Skeleton,
  Paper,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

import { StoreHeader } from '../store/components/StoreHeader';
import { StoreFooter } from '../store/components/StoreFooter';
import { HeroCarousel } from '../store/components/HeroCarousel';
import { CategoryGrid } from '../store/components/CategoryGrid';
import { ProductCard } from '../store/components/ProductCard';
import { getStoreCategories, getStoreProducts } from '../store/api';

export const PublicHomePage = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getStoreCategories(),
      getStoreProducts({ featuredOnly: true, limit: 8 }),
    ])
      .then(([cats, prods]) => {
        setCategories(cats || []);
        setFeaturedProducts(prods || []);
      })
      .catch((err) => {
        console.error('Failed to load homepage data:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* 1. Header */}
      <StoreHeader />

      {/* 2. Hero Carousel */}
      <HeroCarousel />

      {/* 3. Trust & Quality Badges */}
      <Container maxWidth="xl" sx={{ mt: 5, mb: 6 }}>
        <Grid container spacing={2.5}>
          {[
            {
              icon: <WorkspacePremiumIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />,
              title: 'Japanese Offset Tech',
              desc: 'Ultra-crisp 2400 DPI CTP plates and true-to-life CMYK color calibration.',
            },
            {
              icon: <MonetizationOnIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />,
              title: 'Factory-Direct Pricing',
              desc: 'Zero broker markups. Volume discounts with transparent tier pricing.',
            },
            {
              icon: <SpeedIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />,
              title: 'Rapid Turnaround',
              desc: 'Dedicated production shifts ensure on-time delivery for rush events.',
            },
            {
              icon: <LocalShippingIcon sx={{ fontSize: '2rem', color: 'primary.main' }} />,
              title: 'Doorstep Courier & Cargo',
              desc: 'Carefully palletized packing delivered across Tamil Nadu and South India.',
            },
          ].map((feature, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.06)',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                }}
              >
                <Box sx={{ mt: 0.5 }}>{feature.icon}</Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mt: 0.5, lineHeight: 1.4 }}>
                    {feature.desc}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 4. Product Categories Grid */}
      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
          <Box>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              POPULAR SPECIALIZATIONS
            </Typography>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" color="text.primary">
              Print Categories
            </Typography>
          </Box>
          <Button
            variant="text"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/products')}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            View All Categories
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={2.5}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={6} sm={4} md={3} key={i}>
                <Skeleton variant="rounded" height={140} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : (
          <CategoryGrid categories={categories} />
        )}
      </Container>

      {/* 5. Featured Print Products */}
      <Container maxWidth="xl" sx={{ mb: 10 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3.5 }}>
          <Box>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              COMMERCIAL FAVORITES
            </Typography>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" color="text.primary">
              Featured Products
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/products')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            Full Catalog
          </Button>
        </Box>

        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : featuredProducts.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
            <Typography color="text.secondary">No featured products currently active.</Typography>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {featuredProducts.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.product_id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      {/* 6. Four-Step Ordering Process */}
      <Box sx={{ bgcolor: 'background.paper', py: 8, borderTop: '1px solid', borderColor: 'divider', mb: 0 }}>
        <Container maxWidth="xl">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              SIMPLE &amp; TRANSPARENT
            </Typography>
            <Typography variant="h4" fontWeight={900} color="text.primary" letterSpacing="-0.02em">
              How Online Ordering Works
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mt: 1 }}>
              Order custom commercial printing straight from Tirunelveli factory floor in four effortless steps.
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {[
              {
                step: '01',
                title: 'Select Specs & Paper',
                desc: 'Pick your product, choose paper GSM, lamination finish, and required quantity.',
              },
              {
                step: '02',
                title: 'Supply Artwork',
                desc: 'Choose whether you have print-ready PDF/CDR artwork or want GPR designers to assist.',
              },
              {
                step: '03',
                title: 'Offset Plate Making & Run',
                desc: 'Our Heidelberg and Komori offset presses run your job with automated spectrophotometer inspection.',
              },
              {
                step: '04',
                title: 'Direct Dispatch',
                desc: 'Packed securely in waterproof corrugated cartons and delivered directly to your doorstep.',
              },
            ].map((stepItem, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box
                  sx={{
                    p: 3,
                    borderRadius: 3,
                    bgcolor: '#f8fafc',
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography
                    variant="h3"
                    fontWeight={900}
                    sx={{ color: 'primary.light', opacity: 0.7, mb: 1, fontFamily: 'monospace' }}
                  >
                    {stepItem.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1, fontSize: '1.1rem' }}>
                    {stepItem.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {stepItem.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 7. Footer */}
      <StoreFooter />
    </Box>
  );
};

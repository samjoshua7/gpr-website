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
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
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

      {/* 2. Hero Carousel */}
      <HeroCarousel />

      {/* 3. PEAK-SEASON PRIORITY: Featured Products Immediately Below Hero */}
      <Container maxWidth="xl" sx={{ mt: 1, mb: 7 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
          <Box>
            <Typography variant="overline" color="primary.main" fontWeight={800} letterSpacing="0.1em">
              COMMERCIAL FAVORITES &bull; PEAK SEASON PRINTING
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
          <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px dashed', borderColor: 'divider' }}>
            <Typography color="text.secondary">No featured products currently active.</Typography>
            <Button variant="text" onClick={() => navigate('/products')} sx={{ mt: 1 }}>
              Browse Catalog
            </Button>
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

      {/* 4. Product Categories Grid */}
      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3 }}>
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

      {/* 5. Compact Trust & Capabilities Banner (Links to /about) */}
      <Container maxWidth="xl" sx={{ mb: 8 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3.5,
            bgcolor: '#0f172a',
            color: '#ffffff',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                <WorkspacePremiumIcon sx={{ color: 'primary.light', fontSize: '1.75rem' }} />
                <Typography variant="h6" fontWeight={800} sx={{ color: '#ffffff' }}>
                  Industrial Offset Quality &bull; Direct Factory Floor Fulfillment
                </Typography>
              </Box>

              <Grid container spacing={2} sx={{ mt: 0.5 }}>
                {[
                  { icon: <WorkspacePremiumIcon sx={{ fontSize: '1.2rem', color: 'primary.light' }} />, label: '2400 DPI CTP Platemaking' },
                  { icon: <MonetizationOnIcon sx={{ fontSize: '1.2rem', color: 'primary.light' }} />, label: 'Zero Broker Markups' },
                  { icon: <SpeedIcon sx={{ fontSize: '1.2rem', color: 'primary.light' }} />, label: 'Multi-Shift Fast Turnaround' },
                  { icon: <LocalShippingIcon sx={{ fontSize: '1.2rem', color: 'primary.light' }} />, label: 'Cargo Logistics Across TN' },
                ].map((item, idx) => (
                  <Grid item xs={6} sm={3} key={idx}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {item.icon}
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Button
                variant="outlined"
                endIcon={<InfoOutlinedIcon />}
                onClick={() => navigate('/about')}
                sx={{
                  color: '#ffffff',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                About Plant &amp; 4-Step Ordering &rarr;
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* 6. Footer */}
      <StoreFooter />
    </Box>
  );
};

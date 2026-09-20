import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Chip,
  Skeleton,
  Paper,
  Button,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { getStoreCategories, getStoreProducts } from '../api';

export const ProductCatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('featured');
  const [searchInput, setSearchInput] = useState(searchParam);

  // Load categories once
  useEffect(() => {
    getStoreCategories()
      .then((data) => setCategories(data || []))
      .catch((err) => console.error('Failed to load categories', err));
  }, []);

  // Fetch products when filters or sort change
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getStoreProducts({
        categorySlug: categoryParam,
        searchQuery: searchParam,
        sortBy,
      });
      setProducts(data || []);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [categoryParam, searchParam, sortBy]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategorySelect = (slug) => {
    const nextParams = new URLSearchParams(searchParams);
    if (slug === 'all') {
      nextParams.delete('category');
    } else {
      nextParams.set('category', slug);
    }
    setSearchParams(nextParams);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      nextParams.set('search', searchInput.trim());
    } else {
      nextParams.delete('search');
    }
    setSearchParams(nextParams);
  };

  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams({});
    setSortBy('featured');
  };

  const currentCategoryName =
    categoryParam === 'all'
      ? 'All Print Products'
      : categories.find((c) => c.slug === categoryParam)?.name || 'Products';

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      {/* Catalog Title Banner */}
      <Box sx={{ bgcolor: 'primary.main', color: '#fff', py: { xs: 4, md: 5 } }}>
        <Container maxWidth="xl">
          <Typography
            variant="overline"
            sx={{ letterSpacing: '0.15em', fontWeight: 700, color: 'primary.light', opacity: 0.9 }}
          >
            Tirunelveli COMMERCIAL CATALOG
          </Typography>
          <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-0.02em', mt: 0.5 }}>
            {currentCategoryName}
          </Typography>
          <Typography variant="body1" sx={{ color: '#cbd5e1', mt: 1, maxWidth: 650 }}>
            Browse customizable business cards, invitations, stationery, catalogs, and outdoor marketing media with live volume tier pricing.
          </Typography>
        </Container>
      </Box>

      {/* Filters & Content Section */}
      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        {/* Category Horizontal Pills */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 2, mb: 3 }}>
          <Chip
            label="All Categories"
            clickable
            color={categoryParam === 'all' ? 'primary' : 'default'}
            variant={categoryParam === 'all' ? 'filled' : 'outlined'}
            onClick={() => handleCategorySelect('all')}
            sx={{ fontWeight: 700, px: 1, height: 36 }}
          />
          {categories.map((cat) => (
            <Chip
              key={cat.category_id}
              icon={<CategoryIcon slug={cat.slug} name={cat.name} sx={{ fontSize: '1.1rem !important' }} />}
              label={cat.name}
              clickable
              color={categoryParam === cat.slug ? 'primary' : 'default'}
              variant={categoryParam === cat.slug ? 'filled' : 'outlined'}
              onClick={() => handleCategorySelect(cat.slug)}
              sx={{ fontWeight: 600, px: 1, height: 36, whiteSpace: 'nowrap' }}
            />
          ))}
        </Box>

        {/* Search & Sort Controls Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 4,
            borderRadius: 2.5,
            border: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            bgcolor: 'background.paper',
          }}
        >
          {/* Search Box */}
          <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, maxWidth: 460 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name, paper, or keyword..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />
          </Box>

          {/* Sort & Count */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Showing <strong>{products.length}</strong> items
            </Typography>

            <TextField
              select
              size="small"
              label="Sort By"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              sx={{ minWidth: 180 }}
            >
              <MenuItem value="featured">Featured / Default</MenuItem>
              <MenuItem value="price_asc">Price: Low to High</MenuItem>
              <MenuItem value="price_desc">Price: High to Low</MenuItem>
              <MenuItem value="name_asc">Name: A to Z</MenuItem>
            </TextField>
          </Stack>
        </Paper>

        {/* Product Grid */}
        {loading ? (
          <Grid container spacing={3}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                <Skeleton variant="rounded" height={360} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : products.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <FilterAltOffIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              No products found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
              We could not find any printing products matching your selected category or search keyword.
            </Typography>
            <Button variant="outlined" onClick={handleClearFilters}>
              Reset All Filters
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.product_id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <StoreFooter />
    </Box>
  );
};

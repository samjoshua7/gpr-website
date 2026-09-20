import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
  Breadcrumbs,
  Link,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import TuneIcon from '@mui/icons-material/Tune';
import CloseIcon from '@mui/icons-material/Close';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { ProductCard } from '../components/ProductCard';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { getStoreCategories, getStoreProducts } from '../api';

export const ProductCatalogPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const categoryParam = searchParams.get('category') || 'all';
  const searchParam = searchParams.get('search') || '';

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState('featured');
  const [searchInput, setSearchInput] = useState(searchParam);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync search input if URL changes externally
  useEffect(() => {
    setSearchInput(searchParam);
  }, [searchParam]);

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
    setMobileFilterOpen(false);
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
    setMobileFilterOpen(false);
  };

  const currentCategory = categories.find((c) => c.slug === categoryParam);
  const hasActiveFilters = categoryParam !== 'all' || Boolean(searchParam);
  const activeFilterCount = (categoryParam !== 'all' ? 1 : 0) + (searchParam ? 1 : 0);

  // Filter content component reused in both desktop sidebar & mobile drawer
  const renderFilterContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filter Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={800} color="text.primary">
          Categories &amp; Filters
        </Typography>
        {hasActiveFilters && (
          <Button
            size="small"
            color="primary"
            onClick={handleClearFilters}
            sx={{ textTransform: 'none', fontWeight: 600, p: 0.5, fontSize: '0.78rem' }}
          >
            Reset All
          </Button>
        )}
      </Box>

      {/* Category Selection List */}
      <List disablePadding sx={{ width: '100%' }}>
        {/* All Products Item */}
        <ListItem disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            selected={categoryParam === 'all'}
            onClick={() => handleCategorySelect('all')}
            sx={{
              borderRadius: 2,
              py: 0.9,
              px: 1.5,
              '&.Mui-selected': {
                bgcolor: 'primary.50',
                color: 'primary.main',
                borderLeft: '3px solid',
                borderColor: 'primary.main',
                '&:hover': { bgcolor: 'primary.100' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: categoryParam === 'all' ? 'primary.main' : 'text.secondary' }}>
              <StorefrontIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="All Products"
              primaryTypographyProps={{
                fontSize: '0.875rem',
                fontWeight: categoryParam === 'all' ? 700 : 500,
              }}
            />
          </ListItemButton>
        </ListItem>

        {/* Dynamic Category Items */}
        {categories.map((cat) => {
          const isSelected = categoryParam === cat.slug;
          return (
            <ListItem key={cat.category_id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isSelected}
                onClick={() => handleCategorySelect(cat.slug)}
                sx={{
                  borderRadius: 2,
                  py: 0.9,
                  px: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.50',
                    color: 'primary.main',
                    borderLeft: '3px solid',
                    borderColor: 'primary.main',
                    '&:hover': { bgcolor: 'primary.100' },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                  <CategoryIcon slug={cat.slug} name={cat.name} sx={{ fontSize: '1.2rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary={cat.name}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isSelected ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      {/* 1. Compact Catalog Header (Low Vertical Height) */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2,
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1 }}>
            <Box>
              <Breadcrumbs
                separator={<NavigateNextIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
                sx={{
                  mb: 0.5,
                  '& .MuiBreadcrumbs-ol': { flexWrap: 'nowrap' },
                }}
              >
                <Link
                  underline="hover"
                  color="inherit"
                  sx={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, whiteSpace: 'nowrap' }}
                  onClick={() => navigate('/')}
                >
                  Home
                </Link>
                <Link
                  underline="hover"
                  color={categoryParam === 'all' ? 'text.primary' : 'inherit'}
                  sx={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: categoryParam === 'all' ? 700 : 500, whiteSpace: 'nowrap' }}
                  onClick={() => handleCategorySelect('all')}
                >
                  Catalog
                </Link>
                {categoryParam !== 'all' && (
                  <Typography
                    color="text.primary"
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      maxWidth: { xs: 150, sm: 300 },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentCategory?.name || categoryParam}
                  </Typography>
                )}
              </Breadcrumbs>

              <Typography variant="h5" fontWeight={900} letterSpacing="-0.02em" color="text.primary">
                {categoryParam === 'all' ? 'Commercial Print Catalog' : currentCategory?.name || 'Category Products'}
              </Typography>
            </Box>

            {/* Item Counter & Quick Links */}
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              Showing <strong>{products.length}</strong> commercial {products.length === 1 ? 'item' : 'items'}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* 2. Main Content Layout: Sticky Sidebar + Product Grid */}
      <Container maxWidth="xl" sx={{ py: 3, flexGrow: 1 }}>
        <Grid container spacing={3}>
          {/* Desktop Left Filter Sidebar (Hidden on < md) */}
          <Grid
            item
            md={3}
            lg={2.75}
            sx={{
              display: { xs: 'none', md: 'block' },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'sticky',
                top: 86,
                maxHeight: 'calc(100vh - 100px)',
                overflowY: 'auto',
              }}
            >
              {renderFilterContent()}
            </Paper>
          </Grid>

          {/* Right Product Grid Column */}
          <Grid item xs={12} md={9} lg={9.25}>
            {/* Top Toolbar: Sticky beneath header on both desktop and mobile */}
            <Paper
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                mb: 2.5,
                borderRadius: 2.5,
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1.5,
                bgcolor: 'rgba(255, 255, 255, 0.96)',
                backdropFilter: 'blur(10px)',
                position: 'sticky',
                top: 72,
                zIndex: 10,
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
              }}
            >
              {/* Search Field */}
              <Box component="form" onSubmit={handleSearchSubmit} sx={{ flexGrow: 1, minWidth: { xs: '100%', sm: 260 }, maxWidth: { sm: 420 } }}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search products by title or keyword..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: 2, bgcolor: '#f8fafc' },
                  }}
                />
              </Box>

              {/* Action Controls Group: Mobile Filter Trigger & Sort Dropdown */}
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'space-between' }}>
                {/* Mobile Filter Trigger Button (Hidden on md+) */}
                <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={
                      <Badge badgeContent={activeFilterCount} color="primary">
                        <TuneIcon fontSize="small" />
                      </Badge>
                    }
                    onClick={() => setMobileFilterOpen(true)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, py: 0.8 }}
                  >
                    Filters
                  </Button>
                </Box>

                {/* Sort Dropdown */}
                <TextField
                  select
                  size="small"
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ minWidth: 170, bgcolor: '#f8fafc' }}
                >
                  <MenuItem value="featured">Featured / Default</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="name_asc">Name: A to Z</MenuItem>
                </TextField>
              </Stack>
            </Paper>

            {/* Active Filters Summary Chips */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 2.5 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ACTIVE FILTERS:
                </Typography>

                {categoryParam !== 'all' && (
                  <Chip
                    size="small"
                    label={`Category: ${currentCategory?.name || categoryParam}`}
                    onDelete={() => handleCategorySelect('all')}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}

                {searchParam && (
                  <Chip
                    size="small"
                    label={`Search: "${searchParam}"`}
                    onDelete={() => {
                      setSearchInput('');
                      const next = new URLSearchParams(searchParams);
                      next.delete('search');
                      setSearchParams(next);
                    }}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                )}

                <Button
                  size="small"
                  color="inherit"
                  onClick={handleClearFilters}
                  sx={{ textTransform: 'none', fontSize: '0.75rem', p: 0.5 }}
                >
                  Clear All
                </Button>
              </Box>
            )}

            {/* Product Grid Area */}
            {loading ? (
              <Grid container spacing={2.5}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid item xs={12} sm={6} lg={4} key={i}>
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
                  No products match your criteria
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
                  Try changing your category selection or search keywords to find products.
                </Typography>
                <Button variant="outlined" onClick={handleClearFilters}>
                  Reset All Filters
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={2.5}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} lg={4} key={product.product_id}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* 3. Mobile Filter Drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          zIndex: (th) => th.zIndex.drawer + 2,
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(4px)',
            bgcolor: 'rgba(15, 23, 42, 0.4)',
          },
        }}
        PaperProps={{
          sx: { width: 300, p: 2.5 },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" fontWeight={800}>
            Filter Catalog
          </Typography>
          <IconButton size="small" onClick={() => setMobileFilterOpen(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {renderFilterContent()}

        <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => setMobileFilterOpen(false)}
            sx={{ fontWeight: 700, borderRadius: 2 }}
          >
            Apply &amp; View Results ({products.length})
          </Button>
        </Box>
      </Drawer>

      <StoreFooter />
    </Box>
  );
};

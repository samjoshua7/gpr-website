import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  IconButton,
  Chip,
  Switch,
  Tooltip,
  Skeleton,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CategoryIcon from '@mui/icons-material/Category';
import RefreshIcon from '@mui/icons-material/Refresh';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

import {
  getProducts,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  saveProductOptions,
  saveProductTiers,
} from './api';
import { ProductFormDialog } from './components/ProductFormDialog';
import { CategoryManagerDialog } from './components/CategoryManagerDialog';

export const ProductManagementPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialogs
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cats, prods] = await Promise.all([
        getCategories(true),
        getProducts({
          categoryId: selectedCategory === 'ALL' ? null : selectedCategory,
          searchQuery,
          includeInactive: true,
        }),
      ]);
      setCategories(cats);
      setProducts(prods);
    } catch (err) {
      setError(err.message || 'Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateProduct = () => {
    setEditingProductId(null);
    setProductFormOpen(true);
  };

  const handleEditProduct = (productId) => {
    setEditingProductId(productId);
    setProductFormOpen(true);
  };

  const handleSaveProduct = async ({ productData, options, tiers }) => {
    let savedProd;
    if (editingProductId) {
      savedProd = await updateProduct(editingProductId, productData);
    } else {
      savedProd = await createProduct(productData);
    }

    const prodId = savedProd.product_id;

    // Save options and tiers
    await Promise.all([
      saveProductOptions(prodId, options),
      saveProductTiers(prodId, tiers),
    ]);

    await loadData();
  };

  const handleToggleActive = async (product) => {
    try {
      await updateProduct(product.product_id, {
        ...product,
        is_active: !product.is_active,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === product.product_id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (err) {
      alert('Failed to toggle active status: ' + err.message);
    }
  };

  const handleToggleFeatured = async (product) => {
    try {
      await updateProduct(product.product_id, {
        ...product,
        is_featured: !product.is_featured,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p.product_id === product.product_id ? { ...p, is_featured: !p.is_featured } : p
        )
      );
    } catch (err) {
      alert('Failed to toggle featured status: ' + err.message);
    }
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct(productToDelete.product_id);
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      await loadData();
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  // Filter products by status
  const filteredProducts = products.filter((prod) => {
    if (statusFilter === 'ACTIVE') return prod.is_active;
    if (statusFilter === 'INACTIVE') return !prod.is_active;
    if (statusFilter === 'FEATURED') return prod.is_featured;
    return true;
  });

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header & Metric Summary */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Online Product Catalog
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage public products, customizable finishing options, and volume pricing brackets for the online storefront.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CategoryIcon fontSize="small" />}
            onClick={() => setCategoryManagerOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Manage Categories ({categories.length})
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon fontSize="small" />}
            onClick={handleCreateProduct}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            New Product
          </Button>
        </Box>
      </Box>

      {/* Filter and Action Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by product name, slug, or details..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c.category_id} value={c.category_id}>
              {c.icon ? `${c.icon} ` : ''}{c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="ALL">All Statuses</MenuItem>
          <MenuItem value="ACTIVE">Active Only</MenuItem>
          <MenuItem value="INACTIVE">Inactive Only</MenuItem>
          <MenuItem value="FEATURED">Featured Only</MenuItem>
        </TextField>

        <IconButton size="small" onClick={loadData} title="Refresh catalog">
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={
          <Button color="inherit" size="small" onClick={loadData}>Retry</Button>
        }>
          {error}
        </Alert>
      )}

      {/* High-Density Products Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 60 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Product Name &amp; Slug</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Base Price</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Min Qty</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Featured</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Active</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 100 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: 1 }} /></TableCell>
                  <TableCell><Skeleton variant="text" width="60%" /><Skeleton variant="text" width="40%" height={14} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={60} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={50} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="center"><Skeleton variant="circular" width={24} height={24} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={60} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    No products found matching your criteria.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Adjust your filters or create a new product catalog entry.
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={handleCreateProduct}
                    sx={{ mt: 2 }}
                  >
                    Add Product
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((prod) => (
                <TableRow
                  key={prod.product_id}
                  hover
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    bgcolor: !prod.is_active ? 'rgba(0,0,0,0.02)' : 'inherit',
                  }}
                >
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={prod.main_image_url}
                      alt={prod.name}
                      sx={{ width: 44, height: 44, bgcolor: 'grey.100', border: '1px solid', borderColor: 'divider' }}
                    >
                      <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: '1.25rem' }} />
                    </Avatar>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ color: 'text.primary' }}>
                      {prod.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      /products/{prod.slug}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    {prod.category ? (
                      <Chip
                        label={prod.category.name}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">Uncategorized</Typography>
                    )}
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{parseFloat(prod.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2">
                      {prod.min_quantity.toLocaleString('en-IN')} units
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={Boolean(prod.is_featured)}
                      onChange={() => handleToggleFeatured(prod)}
                      color="secondary"
                    />
                  </TableCell>

                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={Boolean(prod.is_active)}
                      onChange={() => handleToggleActive(prod)}
                      color="primary"
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="Edit Product">
                      <IconButton
                        size="small"
                        onClick={() => handleEditProduct(prod.product_id)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Product">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(prod)}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={productFormOpen}
        onClose={() => setProductFormOpen(false)}
        onSave={handleSaveProduct}
        initialProductId={editingProductId}
        categories={categories}
      />

      {/* Category Manager Dialog */}
      <CategoryManagerDialog
        open={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
        categories={categories}
        onRefresh={loadData}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Product?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{productToDelete?.name}</strong>?
            All associated options and quantity tiers will also be deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  MenuItem,
  CircularProgress,
  IconButton,
  Avatar,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { ProductOptionsEditor } from './ProductOptionsEditor';
import { PricingTiersEditor } from './PricingTiersEditor';
import { uploadProductImage, getProductById } from '../api';

export const ProductFormDialog = ({ open, onClose, onSave, initialProductId, categories = [] }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    slug: '',
    short_description: '',
    description: '',
    base_price: '0.00',
    min_quantity: '100',
    main_image_url: '',
    is_featured: false,
    is_active: true,
    display_order: 0,
  });

  const [options, setOptions] = useState([]);
  const [tiers, setTiers] = useState([]);

  useEffect(() => {
    if (!open) return;

    if (initialProductId) {
      setLoading(true);
      getProductById(initialProductId)
        .then((prod) => {
          setFormData({
            category_id: prod.category_id || '',
            name: prod.name || '',
            slug: prod.slug || '',
            short_description: prod.short_description || '',
            description: prod.description || '',
            base_price: prod.base_price?.toString() || '0.00',
            min_quantity: prod.min_quantity?.toString() || '100',
            main_image_url: prod.main_image_url || '',
            is_featured: Boolean(prod.is_featured),
            is_active: Boolean(prod.is_active),
            display_order: prod.display_order ?? 0,
          });

          // Map options and option values
          if (prod.options) {
            const mappedOpts = prod.options.map((opt) => ({
              name: opt.name,
              is_required: opt.is_required,
              values: (opt.values || []).map((v) => ({
                label: v.label,
                price_adjustment: v.price_adjustment?.toString() || '0.00',
                is_default: Boolean(v.is_default),
              })),
            }));
            setOptions(mappedOpts);
          } else {
            setOptions([]);
          }

          // Map tiers
          if (prod.tiers) {
            const mappedTiers = prod.tiers.map((t) => ({
              min_quantity: t.min_quantity,
              max_quantity: t.max_quantity ?? '',
              price_per_unit: t.price_per_unit?.toString() || '0.00',
            }));
            setTiers(mappedTiers);
          } else {
            setTiers([]);
          }
        })
        .catch((err) => {
          setError(err.message || 'Failed to load product details.');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setFormData({
        category_id: categories[0]?.category_id || '',
        name: '',
        slug: '',
        short_description: '',
        description: '',
        base_price: '0.00',
        min_quantity: '100',
        main_image_url: '',
        is_featured: false,
        is_active: true,
        display_order: 0,
      });
      setOptions([]);
      setTiers([]);
      setError(null);
    }
    setActiveTab(0);
  }, [open, initialProductId, categories]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!initialProductId) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, name: val, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setError(null);
      const url = await uploadProductImage(file);
      setFormData((prev) => ({ ...prev, main_image_url: url }));
    } catch (err) {
      setError(err.message || 'Failed to upload image.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Product name is required.');
      setActiveTab(0);
      return;
    }
    if (!formData.slug.trim()) {
      setError('Product slug is required.');
      setActiveTab(0);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave({
        productData: formData,
        options,
        tiers,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{initialProductId ? 'Edit Product Catalog Item' : 'Create New Product'}</span>
          {initialProductId && (
            <Typography variant="caption" color="text.secondary">
              ID: {initialProductId.slice(0, 8)}...
            </Typography>
          )}
        </DialogTitle>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="1. General Info" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab label="2. Media & Description" sx={{ textTransform: 'none', fontWeight: 600 }} />
            <Tab
              label={`3. Options (${options.length})`}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
            <Tab
              label={`4. Volume Tiers (${tiers.length})`}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            />
          </Tabs>
        </Box>

        <DialogContent dividers sx={{ minHeight: 380 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={36} />
            </Box>
          ) : (
            <>
              {/* TAB 0: GENERAL INFO */}
              {activeTab === 0 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={8}>
                    <TextField
                      label="Product Name"
                      value={formData.name}
                      onChange={handleNameChange}
                      fullWidth
                      size="small"
                      required
                      placeholder="e.g. Premium Visiting Cards"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      select
                      label="Category"
                      value={formData.category_id}
                      onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                      fullWidth
                      size="small"
                      required
                    >
                      {categories.map((c) => (
                        <MenuItem key={c.category_id} value={c.category_id}>
                          {c.icon ? `${c.icon} ` : ''}{c.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="URL Slug"
                      value={formData.slug}
                      onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                      fullWidth
                      size="small"
                      required
                      helperText="Used in customer URL path: /products/your-slug"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Base Starting Price (₹)"
                      type="number"
                      value={formData.base_price}
                      onChange={(e) => setFormData((p) => ({ ...p, base_price: e.target.value }))}
                      fullWidth
                      size="small"
                      required
                      inputProps={{ min: 0, step: 0.01 }}
                      helperText="Minimum base order price (without option add-ons)"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Minimum Order Quantity (Units)"
                      type="number"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData((p) => ({ ...p, min_quantity: e.target.value }))}
                      fullWidth
                      size="small"
                      required
                      inputProps={{ min: 1 }}
                      helperText="Cart will enforce this as minimum order count"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Display Order"
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData((p) => ({ ...p, display_order: parseInt(e.target.value, 10) || 0 }))}
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_active}
                          onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                          color="primary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formData.is_active ? 'Active' : 'Inactive'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Visible to online shoppers
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.is_featured}
                          onChange={(e) => setFormData((p) => ({ ...p, is_featured: e.target.checked }))}
                          color="secondary"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {formData.is_featured ? 'Featured' : 'Standard'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Show on homepage
                          </Typography>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              )}

              {/* TAB 1: MEDIA & DESCRIPTION */}
              {activeTab === 1 && (
                <Grid container spacing={2.5}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                      Main Product Image
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Avatar
                        variant="rounded"
                        src={formData.main_image_url}
                        sx={{ width: 90, height: 90, bgcolor: 'grey.100' }}
                      >
                        <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: '2rem' }} />
                      </Avatar>
                      <Box sx={{ flexGrow: 1 }}>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? 'Uploading...' : 'Upload New Image'}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleImageUpload}
                          />
                        </Button>
                        <TextField
                          size="small"
                          fullWidth
                          label="Or direct Image URL"
                          value={formData.main_image_url}
                          onChange={(e) => setFormData((p) => ({ ...p, main_image_url: e.target.value }))}
                          sx={{ mt: 1.5 }}
                          placeholder="https://..."
                        />
                      </Box>
                      {formData.main_image_url && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => setFormData((p) => ({ ...p, main_image_url: '' }))}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Short Teaser / Summary"
                      value={formData.short_description}
                      onChange={(e) => setFormData((p) => ({ ...p, short_description: e.target.value }))}
                      fullWidth
                      size="small"
                      placeholder="Brief 1-2 sentence preview for product cards"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Full Description & Specifications"
                      value={formData.description}
                      onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                      fullWidth
                      size="small"
                      multiline
                      rows={5}
                      placeholder="Detailed specifications, paper GSM info, turnaround times, and print technology."
                    />
                  </Grid>
                </Grid>
              )}

              {/* TAB 2: OPTIONS */}
              {activeTab === 2 && (
                <ProductOptionsEditor
                  options={options}
                  onChange={setOptions}
                />
              )}

              {/* TAB 3: TIERS */}
              {activeTab === 3 && (
                <PricingTiersEditor
                  tiers={tiers}
                  onChange={setTiers}
                />
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving || loading}>
            {saving ? 'Saving...' : initialProductId ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

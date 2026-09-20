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
  Stack,
  Chip,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CollectionsIcon from '@mui/icons-material/Collections';
import { ProductOptionsEditor } from './ProductOptionsEditor';
import { PricingTiersEditor } from './PricingTiersEditor';
import {
  uploadProductImage,
  deleteProductImageFromStorage,
  rollbackUploadedProductImage,
  getProductById,
} from '../api';

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

  // Staged image upload state (prevents orphaned files if admin cancels or changes selection)
  const [initialImageUrl, setInitialImageUrl] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [imageRemoved, setImageRemoved] = useState(false);

  // Additional gallery images (up to 4 more, total 5)
  // Array of { id, image_url, alt_text, file, previewUrl }
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryUrlInput, setGalleryUrlInput] = useState('');

  // Revoke object URL on unmount or previewUrl replacement to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      galleryImages.forEach((item) => {
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, [previewUrl, galleryImages]);

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
          setInitialImageUrl(prod.main_image_url || '');
          setPreviewUrl(prod.main_image_url || '');
          setSelectedImageFile(null);
          setImageRemoved(false);

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

          // Map existing gallery images (excluding main_image_url)
          if (prod.images && prod.images.length > 0) {
            const sortedGallery = [...prod.images]
              .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
              .filter((img) => img.image_url !== prod.main_image_url)
              .map((img) => ({
                id: img.image_id,
                image_url: img.image_url,
                previewUrl: img.image_url,
                alt_text: img.alt_text || '',
              }));
            setGalleryImages(sortedGallery);
          } else {
            setGalleryImages([]);
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
      setInitialImageUrl('');
      setPreviewUrl('');
      setSelectedImageFile(null);
      setImageRemoved(false);
      setGalleryImages([]);
      setGalleryUrlInput('');
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

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedImageFile(file);
    setPreviewUrl(objectUrl);
    setImageRemoved(false);
    setFormData((prev) => ({ ...prev, main_image_url: '' }));
    e.target.value = '';
  };

  const handleDirectUrlChange = (e) => {
    const url = e.target.value;
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImageFile(null);
    setPreviewUrl(url);
    setImageRemoved(false);
    setFormData((prev) => ({ ...prev, main_image_url: url }));
  };

  const handleRemoveImage = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedImageFile(null);
    setPreviewUrl('');
    setImageRemoved(true);
    setFormData((prev) => ({ ...prev, main_image_url: '' }));
  };

  const handleAddGalleryFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (galleryImages.length >= 4) {
      setError('You can add up to 4 additional gallery images (5 images total).');
      return;
    }
    const blobUrl = URL.createObjectURL(file);
    setGalleryImages((prev) => [
      ...prev,
      {
        id: `file_${Date.now()}`,
        image_url: '',
        previewUrl: blobUrl,
        file,
        alt_text: '',
      },
    ]);
    e.target.value = '';
  };

  const handleAddGalleryUrl = () => {
    if (!galleryUrlInput.trim()) return;
    if (galleryImages.length >= 4) {
      setError('You can add up to 4 additional gallery images (5 images total).');
      return;
    }
    setGalleryImages((prev) => [
      ...prev,
      {
        id: `url_${Date.now()}`,
        image_url: galleryUrlInput.trim(),
        previewUrl: galleryUrlInput.trim(),
        alt_text: '',
      },
    ]);
    setGalleryUrlInput('');
  };

  const handleRemoveGalleryImage = (index) => {
    setGalleryImages((prev) => {
      const target = prev[index];
      if (target?.previewUrl && target.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleGalleryAltChange = (index, alt) => {
    setGalleryImages((prev) =>
      prev.map((item, i) => (i === index ? { ...item, alt_text: alt } : item))
    );
  };

  const handleDialogClose = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    galleryImages.forEach((item) => {
      if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setSelectedImageFile(null);
    onClose();
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

      let finalImageUrl = formData.main_image_url?.trim() || null;
      let newlyUploadedUrl = null;

      // 1. If user staged a new local main image file, upload it now
      if (selectedImageFile) {
        setUploadingImage(true);
        newlyUploadedUrl = await uploadProductImage(selectedImageFile);
        finalImageUrl = newlyUploadedUrl;
      } else if (imageRemoved) {
        finalImageUrl = null;
      }

      // 1b. Upload any staged gallery image files
      const uploadedGalleryItems = [];
      for (const item of galleryImages) {
        if (item.file) {
          setUploadingImage(true);
          const uploadedUrl = await uploadProductImage(item.file);
          uploadedGalleryItems.push({
            image_url: uploadedUrl,
            alt_text: item.alt_text || null,
          });
        } else if (item.image_url) {
          uploadedGalleryItems.push({
            image_url: item.image_url,
            alt_text: item.alt_text || null,
          });
        }
      }

      // 2. Perform database save
      try {
        await onSave({
          productData: {
            ...formData,
            main_image_url: finalImageUrl,
          },
          options,
          tiers,
          galleryImages: uploadedGalleryItems,
        });
      } catch (dbErr) {
        // Rollback newly uploaded file immediately if DB save failed
        if (newlyUploadedUrl) {
          await rollbackUploadedProductImage(newlyUploadedUrl);
        }
        throw dbErr;
      }

      // 3. Clean up replaced old image if it was replaced/removed and is not referenced in orders
      if (initialImageUrl && initialImageUrl !== finalImageUrl) {
        deleteProductImageFromStorage(initialImageUrl, {
          productId: initialProductId || undefined,
        }).catch((cleanupErr) =>
          console.warn('Background cleanup of replaced product image failed:', cleanupErr)
        );
      }

      handleDialogClose();
    } catch (err) {
      setError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
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
                  {/* 1. Main Display / Primary Card Image */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Primary Product Image (Slot 1 of 5)
                      </Typography>
                      <Chip label="Required for Cards &amp; Catalog" size="small" color="primary" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1.5 }}>
                      <Avatar
                        variant="rounded"
                        src={previewUrl}
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
                          disabled={uploadingImage || saving}
                        >
                          {selectedImageFile ? 'Change Selected File' : 'Select Image File'}
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleFileSelect}
                          />
                        </Button>
                        {selectedImageFile && (
                          <Typography variant="caption" display="block" color="primary" sx={{ mt: 0.5, fontWeight: 600 }}>
                            Selected: {selectedImageFile.name} (will be uploaded on save)
                          </Typography>
                        )}
                        <TextField
                          size="small"
                          fullWidth
                          label="Or direct Image URL"
                          value={formData.main_image_url}
                          onChange={handleDirectUrlChange}
                          sx={{ mt: 1.5 }}
                          placeholder="https://..."
                        />
                      </Box>
                      {previewUrl && (
                        <IconButton
                          color="error"
                          size="small"
                          onClick={handleRemoveImage}
                          title="Remove Primary Image"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Grid>

                  {/* 2. Additional Gallery Images (Slots 2 to 5) */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, mt: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CollectionsIcon fontSize="small" color="action" />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Additional Gallery Images ({galleryImages.length} of 4 additional, total {1 + (previewUrl ? 1 : 0) + galleryImages.length - (previewUrl ? 1 : 0)}/5)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Shown in swipeable customer product detail gallery
                      </Typography>
                    </Box>

                    {/* Existing Gallery Images List */}
                    {galleryImages.length > 0 && (
                      <Stack spacing={1.5} sx={{ mb: 2 }}>
                        {galleryImages.map((img, idx) => (
                          <Box
                            key={img.id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2,
                              p: 1.5,
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1.5,
                              bgcolor: 'background.paper',
                            }}
                          >
                            <Avatar
                              variant="rounded"
                              src={img.previewUrl || img.image_url}
                              sx={{ width: 56, height: 56, bgcolor: 'grey.100', flexShrink: 0 }}
                            >
                              <Inventory2OutlinedIcon sx={{ color: 'text.disabled' }} />
                            </Avatar>

                            <Box sx={{ flexGrow: 1 }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                Gallery Slot {idx + 2} of 5
                              </Typography>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder="Alt text / description (e.g. Back view, packaging)"
                                value={img.alt_text}
                                onChange={(e) => handleGalleryAltChange(idx, e.target.value)}
                                sx={{ mt: 0.5 }}
                              />
                            </Box>

                            <IconButton
                              color="error"
                              size="small"
                              onClick={() => handleRemoveGalleryImage(idx)}
                              title="Remove Gallery Image"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ))}
                      </Stack>
                    )}

                    {/* Add Gallery Image Controls (if under 4 additional images) */}
                    {galleryImages.length < 4 ? (
                      <Box
                        sx={{
                          p: 2,
                          border: '1px dashed',
                          borderColor: 'primary.light',
                          borderRadius: 1.5,
                          bgcolor: 'rgba(25, 118, 210, 0.02)',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} color="primary" sx={{ display: 'block', mb: 1 }}>
                          + Add Gallery Image (Slot {galleryImages.length + 2} of 5)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            startIcon={<AddPhotoAlternateIcon />}
                            disabled={uploadingImage || saving}
                          >
                            Upload File
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleAddGalleryFile}
                            />
                          </Button>

                          <Box sx={{ display: 'flex', gap: 1, flexGrow: 1, minWidth: 220 }}>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Or paste direct image URL (https://...)"
                              value={galleryUrlInput}
                              onChange={(e) => setGalleryUrlInput(e.target.value)}
                            />
                            <Button
                              variant="contained"
                              size="small"
                              onClick={handleAddGalleryUrl}
                              disabled={!galleryUrlInput.trim()}
                              sx={{ textTransform: 'none' }}
                            >
                              Add
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      <Alert severity="info" sx={{ py: 0.5 }}>
                        Maximum limit of 5 product images reached (1 primary + 4 gallery).
                      </Alert>
                    )}
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
          <Button onClick={handleDialogClose} disabled={saving} color="inherit">
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

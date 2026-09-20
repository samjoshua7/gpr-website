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
} from '@mui/material';

export const CategoryFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: '',
    display_order: 0,
    active: true,
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        icon: initialData.icon || '',
        display_order: initialData.display_order ?? 0,
        active: initialData.active ?? true,
      });
    } else {
      setFormData({
        name: '',
        slug: '',
        description: '',
        icon: '',
        display_order: 0,
        active: true,
      });
    }
    setError(null);
  }, [initialData, open]);

  const handleNameChange = (e) => {
    const val = e.target.value;
    if (!initialData) {
      // Auto-generate slug when creating new category
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setFormData((prev) => ({ ...prev, name: val, slug: autoSlug }));
    } else {
      setFormData((prev) => ({ ...prev, name: val }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Category slug is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
          {initialData ? 'Edit Product Category' : 'New Product Category'}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField
                label="Category Name"
                value={formData.name}
                onChange={handleNameChange}
                fullWidth
                size="small"
                required
                autoFocus
                placeholder="e.g. Wedding Printing"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Icon Key"
                value={formData.icon}
                onChange={(e) => setFormData((p) => ({ ...p, icon: e.target.value }))}
                fullWidth
                size="small"
                placeholder="e.g. card, invite, flyer"
                helperText="Optional keyword to match vector icon"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="URL Slug"
                value={formData.slug}
                onChange={(e) => setFormData((p) => ({ ...p, slug: e.target.value }))}
                fullWidth
                size="small"
                required
                helperText="URL-friendly identifier (e.g. wedding-printing)"
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Brief category summary for storefront browsing"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData((p) => ({ ...p, display_order: parseInt(e.target.value, 10) || 0 }))}
                fullWidth
                size="small"
                helperText="Lower numbers appear first"
              />
            </Grid>

            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData((p) => ({ ...p, active: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {formData.active ? 'Active' : 'Inactive'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Visible in online storefront
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? 'Saving...' : initialData ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

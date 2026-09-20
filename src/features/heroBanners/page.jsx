import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import PanoramaOutlinedIcon from '@mui/icons-material/PanoramaOutlined';

import { PageToolbar } from '../../components/layout/PageToolbar';
import { HeroBannerFormDialog } from './components/HeroBannerFormDialog';
import {
  getHeroBannersAdmin,
  createHeroBanner,
  updateHeroBanner,
  deleteHeroBanner,
  toggleHeroBannerActive,
} from './api';

export const HeroBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [formOpen, setFormOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getHeroBannersAdmin();
      setBanners(data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch hero banners.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const handleOpenCreate = () => {
    setEditingBanner(null);
    setFormOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setEditingBanner(banner);
    setFormOpen(true);
  };

  const handleSaveBanner = async (formData) => {
    if (editingBanner) {
      await updateHeroBanner(editingBanner.banner_id, formData);
    } else {
      await createHeroBanner(formData);
    }
    await fetchBanners();
  };

  const handleToggleActive = async (banner) => {
    try {
      await toggleHeroBannerActive(banner.banner_id, banner.is_active);
      setBanners((prev) =>
        prev.map((b) => (b.banner_id === banner.banner_id ? { ...b, is_active: !b.is_active } : b))
      );
    } catch (err) {
      setError(err.message || 'Failed to toggle banner status.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    try {
      await deleteHeroBanner(bannerToDelete.banner_id);
      setDeleteConfirmOpen(false);
      setBannerToDelete(null);
      await fetchBanners();
    } catch (err) {
      setError(err.message || 'Failed to delete banner.');
    }
  };

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const currentBanner = banners[index];
    const targetBanner = banners[targetIndex];

    try {
      // Swap display_order
      await updateHeroBanner(currentBanner.banner_id, {
        ...currentBanner,
        display_order: targetBanner.display_order,
      });
      await updateHeroBanner(targetBanner.banner_id, {
        ...targetBanner,
        display_order: currentBanner.display_order,
      });
      await fetchBanners();
    } catch (err) {
      setError(err.message || 'Failed to reorder banner.');
    }
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <PageToolbar
        title="Hero Carousel CMS"
        subtitle="Manage promotional hero banners, visual design, custom copy, and click-through buttons on the storefront."
        actions={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={fetchBanners}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
            >
              Add New Banner
            </Button>
          </Box>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2.5 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, width: 80 }}>Preview</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Banner Name &amp; Title</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 140 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 180 }}>Buttons / Action</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 90 }} align="center">Order</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 100 }} align="center">Status</TableCell>
              <TableCell sx={{ fontWeight: 700, width: 120 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="rounded" width={64} height={40} /></TableCell>
                  <TableCell><Skeleton width="60%" /><Skeleton width="40%" /></TableCell>
                  <TableCell><Skeleton width={80} /></TableCell>
                  <TableCell><Skeleton width={120} /></TableCell>
                  <TableCell><Skeleton width={40} /></TableCell>
                  <TableCell><Skeleton width={50} /></TableCell>
                  <TableCell align="right"><Skeleton width={80} /></TableCell>
                </TableRow>
              ))
            ) : banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: 'center' }}>
                  <PanoramaOutlinedIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={700} color="text.primary">
                    No Hero Banners Found
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Create your first promotional carousel banner for the storefront.
                  </Typography>
                  <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenCreate}>
                    Create Banner
                  </Button>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner, idx) => (
                <TableRow key={banner.banner_id} hover>
                  {/* Thumbnail */}
                  <TableCell>
                    <Avatar
                      variant="rounded"
                      src={banner.image_url}
                      sx={{ width: 68, height: 38, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.100' }}
                    >
                      <PanoramaOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Avatar>
                  </TableCell>

                  {/* Title & Info */}
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="text.primary">
                      {banner.banner_name || banner.title || 'Untitled Banner'}
                    </Typography>
                    {banner.eyebrow && (
                      <Typography variant="caption" sx={{ color: 'primary.main', display: 'block', fontWeight: 600 }}>
                        {banner.eyebrow}
                      </Typography>
                    )}
                    {banner.subtitle && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 400, noWrap: true }}>
                        {banner.subtitle}
                      </Typography>
                    )}
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <Chip
                      label={banner.banner_type === 'image_only' ? 'Image Only' : 'Image + Text'}
                      size="small"
                      variant={banner.banner_type === 'image_only' ? 'outlined' : 'filled'}
                      color={banner.banner_type === 'image_only' ? 'default' : 'primary'}
                      sx={{ fontSize: '0.72rem', fontWeight: 600 }}
                    />
                  </TableCell>

                  {/* Buttons */}
                  <TableCell>
                    {banner.btn1_label ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Typography variant="caption" fontWeight={600}>
                          1: {banner.btn1_label} &rarr; <span style={{ fontFamily: 'monospace' }}>{banner.btn1_url || '/products'}</span>
                        </Typography>
                        {banner.btn2_label && (
                          <Typography variant="caption" color="text.secondary">
                            2: {banner.btn2_label} &rarr; <span style={{ fontFamily: 'monospace' }}>{banner.btn2_url}</span>
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">
                        No buttons
                      </Typography>
                    )}
                  </TableCell>

                  {/* Reorder */}
                  <TableCell align="center">
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}>
                      <IconButton
                        size="small"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, 'up')}
                      >
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" fontWeight={700}>
                        {banner.display_order}
                      </Typography>
                      <IconButton
                        size="small"
                        disabled={idx === banners.length - 1}
                        onClick={() => handleMoveOrder(idx, 'down')}
                      >
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>

                  {/* Active Toggle */}
                  <TableCell align="center">
                    <Switch
                      size="small"
                      checked={banner.is_active}
                      onChange={() => handleToggleActive(banner)}
                      color="primary"
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right">
                    <Tooltip title="Edit Banner">
                      <IconButton size="small" onClick={() => handleOpenEdit(banner)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete Banner">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          setBannerToDelete(banner);
                          setDeleteConfirmOpen(true);
                        }}
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

      {/* Banner Create / Edit Dialog */}
      <HeroBannerFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSaveBanner}
        initialData={editingBanner}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs">
        <DialogTitle>Delete Hero Banner?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{bannerToDelete?.banner_name || 'this banner'}</strong>? This action cannot be undone and will immediately remove it from the storefront carousel.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete Banner
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

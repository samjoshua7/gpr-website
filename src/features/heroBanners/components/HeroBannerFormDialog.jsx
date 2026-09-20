import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  Alert,
  Tabs,
  Tab,
  MenuItem,
  CircularProgress,
  FormControlLabel,
  Switch,
  Paper,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
  ToggleButtonGroup,
  ToggleButton,
  Divider,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import DesktopWindowsOutlinedIcon from '@mui/icons-material/DesktopWindowsOutlined';
import PhoneIphoneOutlinedIcon from '@mui/icons-material/PhoneIphoneOutlined';

import { HeroBannerPreview } from './HeroBannerPreview';
import {
  uploadHeroBannerImage,
  deleteHeroBannerImageFromStorage,
  rollbackUploadedHeroBannerImage,
} from '../api';

const ACTION_TYPE_PRESETS = [
  { value: 'catalog', label: 'Open Full Catalog (/products)' },
  { value: 'category', label: 'Open Category (e.g. /products?category=...)' },
  { value: 'product', label: 'Open Specific Product (e.g. /products/...)' },
  { value: 'custom', label: 'Custom / External URL' },
  { value: 'none', label: 'No Action Button' },
];

export const HeroBannerFormDialog = ({ open, onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [previewViewport, setPreviewViewport] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    banner_name: '',
    image_url: '',
    mobile_image_url: '',
    alt_text: '',
    banner_type: 'image_text',
    eyebrow: '',
    title: '',
    subtitle: '',
    text_align: 'left',
    text_position: 'center-left',
    btn1_label: 'Explore Catalog',
    btn1_action_type: 'catalog',
    btn1_url: '/products',
    btn2_label: '',
    btn2_action_type: 'none',
    btn2_url: '',
    display_order: 0,
    is_active: true,
    start_date: '',
    end_date: '',
  });

  // Staged desktop & mobile artwork state (prevents orphaned files if user cancels or changes selection)
  const [initialDesktopUrl, setInitialDesktopUrl] = useState('');
  const [selectedDesktopFile, setSelectedDesktopFile] = useState(null);
  const [desktopPreview, setDesktopPreview] = useState('');
  const [desktopImageRemoved, setDesktopImageRemoved] = useState(false);

  const [initialMobileUrl, setInitialMobileUrl] = useState('');
  const [selectedMobileFile, setSelectedMobileFile] = useState(null);
  const [mobilePreview, setMobilePreview] = useState('');
  const [mobileImageRemoved, setMobileImageRemoved] = useState(false);

  // Revoke object URLs on unmount or replacement to avoid browser memory leaks
  useEffect(() => {
    return () => {
      if (desktopPreview && desktopPreview.startsWith('blob:')) {
        URL.revokeObjectURL(desktopPreview);
      }
      if (mobilePreview && mobilePreview.startsWith('blob:')) {
        URL.revokeObjectURL(mobilePreview);
      }
    };
  }, [desktopPreview, mobilePreview]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        banner_name: initialData.banner_name || initialData.title || '',
        image_url: initialData.image_url || '',
        mobile_image_url: initialData.mobile_image_url || '',
        alt_text: initialData.alt_text || '',
        banner_type: initialData.banner_type || 'image_text',
        eyebrow: initialData.eyebrow || '',
        title: initialData.title || '',
        subtitle: initialData.subtitle || '',
        text_align: initialData.text_align || 'left',
        text_position: initialData.text_position || 'center-left',
        btn1_label: initialData.btn1_label || '',
        btn1_action_type: initialData.btn1_action_type || 'catalog',
        btn1_url: initialData.btn1_url || initialData.link_url || '/products',
        btn2_label: initialData.btn2_label || '',
        btn2_action_type: initialData.btn2_action_type || 'none',
        btn2_url: initialData.btn2_url || '',
        display_order: initialData.display_order ?? 0,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        start_date: initialData.start_date ? initialData.start_date.substring(0, 16) : '',
        end_date: initialData.end_date ? initialData.end_date.substring(0, 16) : '',
      });
      setInitialDesktopUrl(initialData.image_url || '');
      setDesktopPreview(initialData.image_url || '');
      setSelectedDesktopFile(null);
      setDesktopImageRemoved(false);

      setInitialMobileUrl(initialData.mobile_image_url || '');
      setMobilePreview(initialData.mobile_image_url || '');
      setSelectedMobileFile(null);
      setMobileImageRemoved(false);
    } else {
      setFormData({
        banner_name: '',
        image_url: '',
        mobile_image_url: '',
        alt_text: '',
        banner_type: 'image_text',
        eyebrow: 'Factory Direct Printing • Tirunelveli',
        title: 'New Promotional Offer',
        subtitle: 'High precision offset print runs with live customization and factory rates.',
        text_align: 'left',
        text_position: 'center-left',
        btn1_label: 'Explore Catalog',
        btn1_action_type: 'catalog',
        btn1_url: '/products',
        btn2_label: '',
        btn2_action_type: 'none',
        btn2_url: '',
        display_order: 0,
        is_active: true,
        start_date: '',
        end_date: '',
      });
      setInitialDesktopUrl('');
      setDesktopPreview('');
      setSelectedDesktopFile(null);
      setDesktopImageRemoved(false);

      setInitialMobileUrl('');
      setMobilePreview('');
      setSelectedMobileFile(null);
      setMobileImageRemoved(false);
    }
    setError(null);
    setActiveTab(0);
  }, [initialData, open]);

  const handleDesktopFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (desktopPreview && desktopPreview.startsWith('blob:')) {
      URL.revokeObjectURL(desktopPreview);
    }
    const objUrl = URL.createObjectURL(file);
    setSelectedDesktopFile(file);
    setDesktopPreview(objUrl);
    setDesktopImageRemoved(false);
    setFormData((prev) => ({ ...prev, image_url: '' }));
    e.target.value = '';
  };

  const handleMobileFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (mobilePreview && mobilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobilePreview);
    }
    const objUrl = URL.createObjectURL(file);
    setSelectedMobileFile(file);
    setMobilePreview(objUrl);
    setMobileImageRemoved(false);
    setFormData((prev) => ({ ...prev, mobile_image_url: '' }));
    e.target.value = '';
  };

  const handleDesktopUrlChange = (e) => {
    const url = e.target.value;
    if (desktopPreview && desktopPreview.startsWith('blob:')) {
      URL.revokeObjectURL(desktopPreview);
    }
    setSelectedDesktopFile(null);
    setDesktopPreview(url);
    setDesktopImageRemoved(false);
    setFormData((prev) => ({ ...prev, image_url: url }));
  };

  const handleMobileUrlChange = (e) => {
    const url = e.target.value;
    if (mobilePreview && mobilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobilePreview);
    }
    setSelectedMobileFile(null);
    setMobilePreview(url);
    setMobileImageRemoved(false);
    setFormData((prev) => ({ ...prev, mobile_image_url: url }));
  };

  const handleRemoveDesktop = () => {
    if (desktopPreview && desktopPreview.startsWith('blob:')) {
      URL.revokeObjectURL(desktopPreview);
    }
    setSelectedDesktopFile(null);
    setDesktopPreview('');
    setDesktopImageRemoved(true);
    setFormData((prev) => ({ ...prev, image_url: '' }));
  };

  const handleRemoveMobile = () => {
    if (mobilePreview && mobilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobilePreview);
    }
    setSelectedMobileFile(null);
    setMobilePreview('');
    setMobileImageRemoved(true);
    setFormData((prev) => ({ ...prev, mobile_image_url: '' }));
  };

  const handleDialogClose = () => {
    if (desktopPreview && desktopPreview.startsWith('blob:')) {
      URL.revokeObjectURL(desktopPreview);
    }
    if (mobilePreview && mobilePreview.startsWith('blob:')) {
      URL.revokeObjectURL(mobilePreview);
    }
    setSelectedDesktopFile(null);
    setSelectedMobileFile(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasDesktop = selectedDesktopFile || formData.image_url?.trim();
    if (!hasDesktop) {
      setError('A desktop banner image is required (URL or uploaded file).');
      setActiveTab(0);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      let finalDesktopUrl = formData.image_url?.trim() || null;
      let finalMobileUrl = formData.mobile_image_url?.trim() || null;
      let newUploadedDesktopUrl = null;
      let newUploadedMobileUrl = null;

      // 1. Upload staged desktop artwork if present
      if (selectedDesktopFile) {
        setUploadingDesktop(true);
        newUploadedDesktopUrl = await uploadHeroBannerImage(selectedDesktopFile);
        finalDesktopUrl = newUploadedDesktopUrl;
      } else if (desktopImageRemoved) {
        finalDesktopUrl = null;
      }

      // 2. Upload staged mobile artwork if present
      if (selectedMobileFile) {
        setUploadingMobile(true);
        newUploadedMobileUrl = await uploadHeroBannerImage(selectedMobileFile);
        finalMobileUrl = newUploadedMobileUrl;
      } else if (mobileImageRemoved) {
        finalMobileUrl = null;
      }

      if (!finalDesktopUrl) {
        throw new Error('A desktop banner image is required.');
      }

      // 3. Perform database save
      try {
        await onSave({
          ...formData,
          image_url: finalDesktopUrl,
          mobile_image_url: finalMobileUrl,
          start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
          end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        });
      } catch (dbErr) {
        // Rollback uploaded files immediately if database save fails
        if (newUploadedDesktopUrl) {
          await rollbackUploadedHeroBannerImage(newUploadedDesktopUrl);
        }
        if (newUploadedMobileUrl) {
          await rollbackUploadedHeroBannerImage(newUploadedMobileUrl);
        }
        throw dbErr;
      }

      // 4. Safely clean up replaced old images if unreferenced
      if (initialDesktopUrl && initialDesktopUrl !== finalDesktopUrl) {
        deleteHeroBannerImageFromStorage(initialDesktopUrl, {
          bannerId: initialData?.banner_id || undefined,
        }).catch((err) =>
          console.warn('Background cleanup of replaced desktop banner failed:', err)
        );
      }
      if (initialMobileUrl && initialMobileUrl !== finalMobileUrl) {
        deleteHeroBannerImageFromStorage(initialMobileUrl, {
          bannerId: initialData?.banner_id || undefined,
        }).catch((err) =>
          console.warn('Background cleanup of replaced mobile banner failed:', err)
        );
      }

      handleDialogClose();
    } catch (err) {
      setError(err.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
      setUploadingDesktop(false);
      setUploadingMobile(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleDialogClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>
            {initialData ? 'Edit Hero Banner' : 'New Promotional Hero Banner'}
          </Typography>

          {/* Viewport switcher for live preview */}
          <ToggleButtonGroup
            size="small"
            value={previewViewport}
            exclusive
            onChange={(_, val) => val && setPreviewViewport(val)}
            aria-label="preview viewport"
          >
            <ToggleButton value="desktop" sx={{ px: 1.5, py: 0.5 }}>
              <DesktopWindowsOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
              Desktop
            </ToggleButton>
            <ToggleButton value="mobile" sx={{ px: 1.5, py: 0.5 }}>
              <PhoneIphoneOutlinedIcon fontSize="small" sx={{ mr: 0.5 }} />
              Mobile
            </ToggleButton>
          </ToggleButtonGroup>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2.5 }}>
              {error}
            </Alert>
          )}

          {/* Real-time Interactive Preview */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
              LIVE STOREFRONT PREVIEW ({previewViewport.toUpperCase()})
            </Typography>
            <HeroBannerPreview
              banner={{
                ...formData,
                image_url: desktopPreview || formData.image_url,
                mobile_image_url: mobilePreview || formData.mobile_image_url,
              }}
              viewport={previewViewport}
            />
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Navigation Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label="1. Images & Text" />
            <Tab label="2. Action Buttons" />
            <Tab label="3. Scheduling & Details" />
          </Tabs>

          {/* Tab 0: Images & Text */}
          {activeTab === 0 && (
            <Grid container spacing={2.5}>
              {/* Banner Type: Image-Only vs Image + Text */}
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                    Banner Presentation Mode
                  </FormLabel>
                  <RadioGroup
                    row
                    value={formData.banner_type}
                    onChange={(e) => setFormData((p) => ({ ...p, banner_type: e.target.value }))}
                  >
                    <FormControlLabel
                      value="image_text"
                      control={<Radio size="small" />}
                      label="Image + Text & Action Buttons"
                    />
                    <FormControlLabel
                      value="image_only"
                      control={<Radio size="small" />}
                      label="Image Only (Pure Graphic Design)"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Desktop Image */}
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Desktop Banner Image URL"
                  value={formData.image_url}
                  onChange={handleDesktopUrlChange}
                  fullWidth
                  size="small"
                  required={!selectedDesktopFile}
                  placeholder="https://... or select image file"
                  helperText={
                    selectedDesktopFile
                      ? `Selected: ${selectedDesktopFile.name} (will be uploaded on save)`
                      : 'Recommended ratio: 16:9 or 21:9 (~1600x600px)'
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={uploadingDesktop ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  disabled={uploadingDesktop || saving}
                  sx={{ height: 40 }}
                >
                  {selectedDesktopFile ? 'Change Desktop' : 'Select Desktop'}
                  <input type="file" hidden accept="image/*" onChange={handleDesktopFileSelect} />
                </Button>
                {(desktopPreview || formData.image_url) && (
                  <IconButton
                    color="error"
                    onClick={handleRemoveDesktop}
                    title="Clear Desktop Image"
                    sx={{ height: 40, width: 40 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Grid>

              {/* Mobile Image (Optional) */}
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Mobile Banner Image URL (Optional)"
                  value={formData.mobile_image_url}
                  onChange={handleMobileUrlChange}
                  fullWidth
                  size="small"
                  placeholder="https://... (Optional mobile-cropped art)"
                  helperText={
                    selectedMobileFile
                      ? `Selected: ${selectedMobileFile.name} (will be uploaded on save)`
                      : 'Recommended ratio: 4:3 or 1:1 (~800x600px)'
                  }
                />
              </Grid>
              <Grid item xs={12} sm={4} sx={{ display: 'flex', gap: 1 }}>
                <Button
                  component="label"
                  variant="outlined"
                  fullWidth
                  startIcon={uploadingMobile ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  disabled={uploadingMobile || saving}
                  sx={{ height: 40 }}
                >
                  {selectedMobileFile ? 'Change Mobile' : 'Select Mobile'}
                  <input type="file" hidden accept="image/*" onChange={handleMobileFileSelect} />
                </Button>
                {(mobilePreview || formData.mobile_image_url) && (
                  <IconButton
                    color="error"
                    onClick={handleRemoveMobile}
                    title="Clear Mobile Image"
                    sx={{ height: 40, width: 40 }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
              </Grid>

              {/* Text Fields (Only enabled if banner_type === 'image_text') */}
              {formData.banner_type === 'image_text' && (
                <>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Eyebrow / Overline Badge"
                      value={formData.eyebrow}
                      onChange={(e) => setFormData((p) => ({ ...p, eyebrow: e.target.value }))}
                      fullWidth
                      size="small"
                      placeholder="e.g. Factory Direct Printing • Tirunelveli"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        select
                        label="Text Alignment"
                        value={formData.text_align}
                        onChange={(e) => setFormData((p) => ({ ...p, text_align: e.target.value }))}
                        size="small"
                        sx={{ minWidth: 140 }}
                      >
                        <MenuItem value="left">Left Aligned</MenuItem>
                        <MenuItem value="center">Centered</MenuItem>
                        <MenuItem value="right">Right Aligned</MenuItem>
                      </TextField>

                      <TextField
                        select
                        label="Text Position"
                        value={formData.text_position}
                        onChange={(e) => setFormData((p) => ({ ...p, text_position: e.target.value }))}
                        size="small"
                        sx={{ flexGrow: 1 }}
                      >
                        <MenuItem value="center-left">Center Left (Default)</MenuItem>
                        <MenuItem value="center">Middle Center</MenuItem>
                        <MenuItem value="center-right">Center Right</MenuItem>
                        <MenuItem value="bottom-left">Bottom Left</MenuItem>
                        <MenuItem value="bottom-center">Bottom Center</MenuItem>
                      </TextField>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Main Heading / Title"
                      value={formData.title}
                      onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                      fullWidth
                      size="small"
                      placeholder="e.g. High-Precision Commercial Offset Printing"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      label="Subtitle / Description"
                      value={formData.subtitle}
                      onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))}
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      placeholder="e.g. Premium Business Cards, Catalogs, Flex Banners & Wedding Invites Crafted with Master Precision."
                    />
                  </Grid>
                </>
              )}
            </Grid>
          )}

          {/* Tab 1: Action Buttons */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              {/* Button 1 (Primary) */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="primary.main" sx={{ mb: 1.5 }}>
                    Primary Action Button (Button 1)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Button Label"
                        value={formData.btn1_label}
                        onChange={(e) => setFormData((p) => ({ ...p, btn1_label: e.target.value }))}
                        fullWidth
                        size="small"
                        placeholder="e.g. Explore Catalog"
                        helperText="Leave blank if no button"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        label="Action Type"
                        value={formData.btn1_action_type}
                        onChange={(e) => {
                          const type = e.target.value;
                          let defaultUrl = formData.btn1_url;
                          if (type === 'catalog') defaultUrl = '/products';
                          if (type === 'none') defaultUrl = '';
                          setFormData((p) => ({ ...p, btn1_action_type: type, btn1_url: defaultUrl }));
                        }}
                        fullWidth
                        size="small"
                      >
                        {ACTION_TYPE_PRESETS.map((p) => (
                          <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Target Destination URL"
                        value={formData.btn1_url}
                        onChange={(e) => setFormData((p) => ({ ...p, btn1_url: e.target.value }))}
                        fullWidth
                        size="small"
                        placeholder="/products or https://..."
                        disabled={formData.btn1_action_type === 'none'}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Button 2 (Secondary) */}
              <Grid item xs={12}>
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1.5 }}>
                    Secondary Action Button (Button 2 - Outlined)
                  </Typography>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Button Label"
                        value={formData.btn2_label}
                        onChange={(e) => setFormData((p) => ({ ...p, btn2_label: e.target.value }))}
                        fullWidth
                        size="small"
                        placeholder="e.g. Visiting Cards"
                        helperText="Leave blank for single button"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        select
                        label="Action Type"
                        value={formData.btn2_action_type}
                        onChange={(e) => {
                          const type = e.target.value;
                          let defaultUrl = formData.btn2_url;
                          if (type === 'category' && !defaultUrl) defaultUrl = '/products?category=visiting-cards';
                          if (type === 'none') defaultUrl = '';
                          setFormData((p) => ({ ...p, btn2_action_type: type, btn2_url: defaultUrl }));
                        }}
                        fullWidth
                        size="small"
                      >
                        {ACTION_TYPE_PRESETS.map((p) => (
                          <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <TextField
                        label="Target Destination URL"
                        value={formData.btn2_url}
                        onChange={(e) => setFormData((p) => ({ ...p, btn2_url: e.target.value }))}
                        fullWidth
                        size="small"
                        placeholder="/products?category=... or https://..."
                        disabled={formData.btn2_action_type === 'none'}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Scheduling & Details */}
          {activeTab === 2 && (
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={8}>
                <TextField
                  label="Internal Banner Reference Name"
                  value={formData.banner_name}
                  onChange={(e) => setFormData((p) => ({ ...p, banner_name: e.target.value }))}
                  fullWidth
                  size="small"
                  required
                  placeholder="e.g. Deepavali Mega Print Promotion 2026"
                  helperText="Used in Admin Portal banner list"
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
                  helperText="Lower numbers appear first"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Alt Text / Accessibility Description"
                  value={formData.alt_text}
                  onChange={(e) => setFormData((p) => ({ ...p, alt_text: e.target.value }))}
                  fullWidth
                  size="small"
                  placeholder="Screen reader description for this banner graphic"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Visibility Date (Optional)"
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Leaves active immediately if blank"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Visibility Date (Optional)"
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  helperText="Leaves active indefinitely if blank"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData((p) => ({ ...p, is_active: e.target.checked }))}
                      color="primary"
                    />
                  }
                  label="Publish Banner (Visible on Storefront)"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleDialogClose} color="inherit" disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : initialData ? 'Save Changes' : 'Create Banner'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

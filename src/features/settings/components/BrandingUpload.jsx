import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Grid,
  Box,
  Button,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { uploadCompanyAsset } from '../api';

export const BrandingUpload = ({ settings, onChange, isSuperAdmin = true }) => {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSignatory, setUploadingSignatory] = useState(false);
  const [error, setError] = useState(null);

  const handleLogoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError(null);
      const url = await uploadCompanyAsset(file, 'logo');
      onChange({
        target: {
          name: 'logo_url',
          value: url,
        },
      });
    } catch (err) {
      console.error('Logo upload error:', err);
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSignatoryUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploadingSignatory(true);
      setError(null);
      const url = await uploadCompanyAsset(file, 'signatory');
      onChange({
        target: {
          name: 'signatory_image_url',
          value: url,
        },
      });
    } catch (err) {
      console.error('Signatory image upload error:', err);
      setError(err.message || 'Failed to upload signatory image');
    } finally {
      setUploadingSignatory(false);
    }
  };

  const handleRemoveAsset = (fieldName) => {
    onChange({
      target: {
        name: fieldName,
        value: '',
      },
    });
  };

  return (
    <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={1}>
        Branding & Signatory Assets
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        Upload company logo and authorized signatory signature image for printed and PDF invoices.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Company Logo Section */}
        <Grid item xs={12} sm={6}>
          <Box border="1px dashed" borderColor="divider" borderRadius={2} p={2} textAlign="center">
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Company Logo
            </Typography>
            {settings?.logo_url ? (
              <Box mb={2} display="flex" flexDirection="column" alignItems="center">
                <Box
                  component="img"
                  src={settings.logo_url}
                  alt="Company Logo"
                  sx={{ maxHeight: 80, maxWidth: '100%', objectFit: 'contain', mb: 1 }}
                />
                {isSuperAdmin && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveAsset('logo_url')}
                  >
                    Remove Logo
                  </Button>
                )}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                No logo uploaded
              </Typography>
            )}

            {isSuperAdmin && (
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={uploadingLogo ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                disabled={uploadingLogo}
              >
                {settings?.logo_url ? 'Change Logo' : 'Upload Logo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
              </Button>
            )}
          </Box>
        </Grid>

        {/* Authorized Signatory Section */}
        <Grid item xs={12} sm={6}>
          <Box border="1px dashed" borderColor="divider" borderRadius={2} p={2} textAlign="center">
            <Typography variant="subtitle2" fontWeight={600} mb={1}>
              Authorized Signatory Signature
            </Typography>
            {settings?.signatory_image_url ? (
              <Box mb={2} display="flex" flexDirection="column" alignItems="center">
                <Box
                  component="img"
                  src={settings.signatory_image_url}
                  alt="Signatory Signature"
                  sx={{ maxHeight: 60, maxWidth: '100%', objectFit: 'contain', mb: 1 }}
                />
                {isSuperAdmin && (
                  <Button
                    size="small"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleRemoveAsset('signatory_image_url')}
                  >
                    Remove Signature
                  </Button>
                )}
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                No signature image uploaded
              </Typography>
            )}

            {isSuperAdmin && (
              <Button
                variant="outlined"
                component="label"
                size="small"
                startIcon={uploadingSignatory ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                disabled={uploadingSignatory}
              >
                {settings?.signatory_image_url ? 'Change Signature' : 'Upload Signature'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleSignatoryUpload}
                />
              </Button>
            )}
          </Box>
        </Grid>

        {/* Signatory Name Field */}
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Authorized Signatory Name"
            name="signatory_name"
            placeholder="e.g. Authorized Signatory / Manager"
            value={settings?.signatory_name || ''}
            onChange={onChange}
            disabled={!isSuperAdmin}
            helperText="Appears below the signature line on generated invoices."
          />
        </Grid>
      </Grid>
    </Paper>
  );
};

export default BrandingUpload;

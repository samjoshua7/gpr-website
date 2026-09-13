import React from 'react';
import { Snackbar, Button, IconButton, Box, Typography, Alert } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import { showSavedFolder } from '../../lib/savedLocation';

/**
 * Standardized Application Toast / Snackbar Component
 *
 * Provides:
 * 1. Consistent Dismiss / Close button [×] with keyboard accessibility & aria-label.
 * 2. "Show in folder" action where a downloaded/generated file is represented.
 * 3. Consistent styling across standard notifications and severity alerts.
 * 4. Auto-hide functionality matching user preferences.
 */
export const AppSnackbar = ({
  open,
  onClose,
  message,
  severity,
  autoHideDuration = 5000,
  anchorOrigin = { vertical: 'bottom', horizontal: 'center' },
  showInFolder = false,
  subfolder = '',
  filePath = '',
  fileBlob = null,
  action,
  sx,
  ...props
}) => {
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.(event, reason);
  };

  const handleShowInFolder = async () => {
    const res = await showSavedFolder(subfolder, filePath);
    // If native folder dialog could not be invoked and file blob exists, open blob as fallback
    if (!res.success && fileBlob) {
      const url = URL.createObjectURL(fileBlob);
      window.open(url, '_blank');
    }
  };

  const actionControls = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, ml: 1 }}>
      {showInFolder && (
        <Button
          color="secondary"
          size="small"
          variant="contained"
          startIcon={<FolderOpenIcon sx={{ fontSize: '1rem !important' }} />}
          onClick={handleShowInFolder}
          sx={{
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.8rem',
            py: 0.25,
            px: 1.25,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          Show in folder
        </Button>
      )}
      {action}
      <IconButton
        size="small"
        aria-label="close"
        title="Dismiss"
        onClick={handleClose}
        sx={{
          color: 'inherit',
          p: 0.5,
          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.15)' },
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </Box>
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      sx={sx}
      {...props}
    >
      {severity ? (
        <Alert
          severity={severity}
          variant="filled"
          sx={{ width: '100%', alignItems: 'center' }}
          action={actionControls}
        >
          {message}
        </Alert>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: '#1e293b',
            color: '#ffffff',
            px: 2,
            py: 1,
            borderRadius: 1.5,
            boxShadow: 6,
            minWidth: 288,
            maxWidth: 600,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 500, pr: 1.5 }}>
            {message}
          </Typography>
          {actionControls}
        </Box>
      )}
    </Snackbar>
  );
};

export default AppSnackbar;

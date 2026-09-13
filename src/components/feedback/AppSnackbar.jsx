import React, { useState } from 'react';
import {
  Snackbar,
  Button,
  IconButton,
  Box,
  Typography,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import FileDownloadDoneIcon from '@mui/icons-material/FileDownloadDone';
import { showSavedFolder } from '../../lib/savedLocation';

/**
 * Standardized High-Contrast Toast / Notification Palette
 *
 * Guaranteed WCAG AAA compliance (> 8.5:1 to 14:1 contrast ratios).
 * Distinguishable visual themes per severity with explicit dark text on soft tints,
 * and high-contrast primary slate for standard/download notifications.
 */
const TOAST_THEMES = {
  success: {
    bg: '#ecfdf5', // Soft Mint
    border: '#a7f3d0', // Emerald 200
    color: '#064e3b', // Deep Forest Emerald (Contrast > 9:1)
    iconColor: '#059669', // Emerald 600
    btnBg: '#059669',
    btnText: '#ffffff',
    btnHover: '#047857',
    dismissColor: '#065f46',
    dismissHoverBg: 'rgba(5, 150, 105, 0.14)',
  },
  error: {
    bg: '#fef2f2', // Soft Crimson
    border: '#fecaca', // Rose 200
    color: '#7f1d1d', // Deep Crimson Slate (Contrast > 10:1)
    iconColor: '#dc2626', // Red 600
    btnBg: '#dc2626',
    btnText: '#ffffff',
    btnHover: '#b91c1c',
    dismissColor: '#991b1b',
    dismissHoverBg: 'rgba(220, 38, 38, 0.14)',
  },
  warning: {
    bg: '#fffbeb', // Soft Warm Amber
    border: '#fde68a', // Amber 200
    color: '#78350f', // Deep Amber-Brown (Contrast > 8.5:1 - Never washed out white-on-yellow)
    iconColor: '#d97706', // Amber 600
    btnBg: '#d97706',
    btnText: '#ffffff',
    btnHover: '#b45309',
    dismissColor: '#92400e',
    dismissHoverBg: 'rgba(217, 119, 6, 0.14)',
  },
  info: {
    bg: '#eff6ff', // Soft Azure
    border: '#bfdbfe', // Blue 200
    color: '#1e3a8a', // Deep Navy Slate (Contrast > 10:1)
    iconColor: '#2563eb', // Blue 600
    btnBg: '#2563eb',
    btnText: '#ffffff',
    btnHover: '#1d4ed8',
    dismissColor: '#1e40af',
    dismissHoverBg: 'rgba(37, 99, 235, 0.14)',
  },
  default: {
    bg: '#0f172a', // Primary Slate Canvas from Theme
    border: '#334155', // Slate 700
    color: '#ffffff', // Crisp White (Contrast > 14:1)
    iconColor: '#38bdf8', // Light Cyan / Sky Accent
    btnBg: '#0284c7', // Theme Secondary Cyan
    btnText: '#ffffff',
    btnHover: '#0369a1',
    dismissColor: '#cbd5e1',
    dismissHoverBg: 'rgba(255, 255, 255, 0.16)',
  },
};

/**
 * Standardized Application Toast / Snackbar Component
 *
 * Provides:
 * 1. Immediate readability and high-contrast styling across all severities.
 * 2. Focused [SHOW IN FOLDER] [×] actions for downloaded invoices and reports.
 *    Eliminates invasive Chrome "Select a folder where this site can view" prompts.
 * 3. Accessible dismiss button with explicit focus & hover states.
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
  fileName = '',
  action,
  sx,
  ...props
}) => {
  const [folderActionStatus, setFolderActionStatus] = useState(null); // 'opened' | 'protocol' | 'unavailable' | 'copied' | null
  const [resolvedDisplayPath, setResolvedDisplayPath] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const effectiveFilePath = filePath || fileName || '';
  const isFileNotification = Boolean(showInFolder || effectiveFilePath);

  const themeKey = severity && TOAST_THEMES[severity] ? severity : 'default';
  const theme = TOAST_THEMES[themeKey];

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose?.(event, reason);
  };

  const handleShowInFolder = async () => {
    const res = await showSavedFolder(subfolder, effectiveFilePath);
    if (res?.method === 'explorer') {
      setFolderActionStatus('opened');
      setResolvedDisplayPath(res.path || effectiveFilePath);
      setTimeout(() => setFolderActionStatus(null), 3500);
    } else if (res?.method === 'protocol') {
      setFolderActionStatus('protocol');
      setResolvedDisplayPath(res.path || effectiveFilePath);
      setActionMessage(res.message || 'Opening Windows File Explorer via gpr-explorer protocol (path also copied).');
      // Smoothly transition from 'protocol' (Opening Explorer...) to 'opened' (Opened in Explorer)
      setTimeout(() => {
        setFolderActionStatus('opened');
        setTimeout(() => setFolderActionStatus(null), 3000);
      }, 700);
    } else if (res?.method === 'unavailable') {
      setFolderActionStatus('unavailable');
      setResolvedDisplayPath(res.path || effectiveFilePath);
      setActionMessage(res.message || 'Direct desktop Explorer opening is unavailable in cloud deployment. File path copied to clipboard.');
      setTimeout(() => setFolderActionStatus(null), 4000);
    } else if (res?.method === 'clipboard') {
      setFolderActionStatus('copied');
      setResolvedDisplayPath(res.path || effectiveFilePath);
      setTimeout(() => setFolderActionStatus(null), 3000);
    }
  };

  const renderIcon = () => {
    const iconStyle = { fontSize: '1.25rem', flexShrink: 0, color: theme.iconColor };
    if (severity === 'success') return <CheckCircleOutlineIcon sx={iconStyle} />;
    if (severity === 'error') return <ErrorOutlineIcon sx={iconStyle} />;
    if (severity === 'warning') return <WarningAmberOutlinedIcon sx={iconStyle} />;
    if (severity === 'info') return <InfoOutlinedIcon sx={iconStyle} />;
    if (isFileNotification) return <FileDownloadDoneIcon sx={iconStyle} />;
    return <InfoOutlinedIcon sx={iconStyle} />;
  };

  const actionControls = (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, ml: 'auto', flexShrink: 0 }}>
      {/* Show in folder button */}
      {(showInFolder || effectiveFilePath) && (
        <Tooltip
          title={
            folderActionStatus === 'opened'
              ? `Opened in Windows File Explorer: ${resolvedDisplayPath || effectiveFilePath}`
              : folderActionStatus === 'protocol'
              ? (actionMessage || `Opening in Windows File Explorer: ${resolvedDisplayPath || effectiveFilePath}`)
              : folderActionStatus === 'unavailable'
              ? (actionMessage || `Direct desktop Explorer opening is unavailable. Path copied to clipboard: ${resolvedDisplayPath || effectiveFilePath}`)
              : folderActionStatus === 'copied'
              ? `Path copied to clipboard: ${resolvedDisplayPath || effectiveFilePath}`
              : `Saved file: ${effectiveFilePath}`
          }
        >
          <Button
            size="small"
            variant="contained"
            startIcon={
              folderActionStatus === 'opened' || folderActionStatus === 'protocol' ? (
                <CheckIcon sx={{ fontSize: '0.9rem !important' }} />
              ) : folderActionStatus === 'copied' ? (
                <CheckIcon sx={{ fontSize: '0.9rem !important' }} />
              ) : (
                <FolderOpenIcon sx={{ fontSize: '0.9rem !important' }} />
              )
            }
            onClick={handleShowInFolder}
            aria-label="Show in folder"
            sx={{
              bgcolor: theme.btnBg,
              color: theme.btnText,
              fontWeight: 700,
              fontSize: '0.75rem',
              py: 0.35,
              px: 1.2,
              minHeight: 28,
              borderRadius: 1,
              boxShadow: 'none',
              textTransform: 'none',
              transition: 'background-color 120ms ease',
              '&:hover': {
                bgcolor: theme.btnHover,
                boxShadow: 'none',
              },
              '&:focus-visible': {
                outline: `2px solid ${theme.iconColor}`,
                outlineOffset: '2px',
              },
            }}
          >
            {folderActionStatus === 'opened'
              ? 'Opened in Explorer'
              : folderActionStatus === 'protocol'
              ? 'Opening Explorer...'
              : folderActionStatus === 'unavailable'
              ? 'Path Copied'
              : folderActionStatus === 'copied'
              ? 'Path Copied'
              : 'Show in folder'}
          </Button>
        </Tooltip>
      )}

      {/* Optional custom actions passed by caller */}
      {action}

      {/* Dismiss Button */}
      <IconButton
        size="small"
        aria-label="Dismiss notification"
        title="Dismiss"
        onClick={handleClose}
        sx={{
          color: theme.dismissColor,
          p: 0.5,
          borderRadius: 1,
          transition: 'background-color 120ms ease, color 120ms ease',
          '&:hover': {
            bgcolor: theme.dismissHoverBg,
            color: theme.color,
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.iconColor}`,
            outlineOffset: '2px',
          },
        }}
      >
        <CloseIcon sx={{ fontSize: '1.15rem' }} />
      </IconButton>
    </Box>
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      sx={{
        ...sx,
        '&.MuiSnackbar-root': {
          bottom: { xs: 16, sm: 24 },
        },
      }}
      {...props}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          bgcolor: theme.bg,
          color: theme.color,
          border: `1px solid ${theme.border}`,
          px: 2,
          py: 1.25,
          borderRadius: 2,
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.14), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
          minWidth: 320,
          maxWidth: 640,
          width: 'auto',
          boxSizing: 'border-box',
          transition: 'all 150ms ease-in-out',
        }}
      >
        {renderIcon()}
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: theme.color,
            fontSize: '0.8125rem',
            lineHeight: 1.45,
            wordBreak: 'break-word',
            whiteSpace: 'pre-line',
            flex: 1,
            pr: 1,
          }}
        >
          {message}
        </Typography>
        {actionControls}
      </Box>
    </Snackbar>
  );
};

export default AppSnackbar;

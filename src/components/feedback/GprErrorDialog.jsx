import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';

export const GprErrorDialog = ({
  open,
  onClose,
  error = null,
  title = 'An error occurred',
  actionContext = '',
  payload = null,
}) => {
  const [copied, setCopied] = useState(false);

  if (!error && !open) return null;

  const errorMessage = error?.message || (typeof error === 'string' ? error : 'An unexpected error occurred.');
  const errorCode = error?.code || error?.status || error?.name || 'UNKNOWN_ERROR';
  const errorDetails = error?.details || error?.hint || error?.error_description || null;
  const timestamp = new Date().toISOString();

  const diagnosticReport = {
    app: 'GPR Printing Press Business Management App',
    timestamp,
    errorTitle: title,
    actionContext,
    errorCode,
    errorMessage,
    errorDetails,
    payloadSnapshot: payload || 'None provided',
    stack: error?.stack || null,
  };

  const formattedJson = JSON.stringify(diagnosticReport, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `=== GPR-ERROR REPORT ===\nDate: ${timestamp}\nAction: ${actionContext || title}\nError: [${errorCode}] ${errorMessage}\nDetails: ${errorDetails || 'N/A'}\nPayload: ${JSON.stringify(payload || {})}\n\n=== FULL DIAGNOSTIC JSON ===\n${formattedJson}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy error report to clipboard:', err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          borderTop: '6px solid',
          borderColor: 'error.main',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <ErrorOutlineIcon color="error" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={800} color="error.main" component="div">
              GPR-ERROR
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              System Error & Developer Diagnostics
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: '#fafafa' }}>
        <Alert severity="error" sx={{ mb: 2, fontWeight: 600 }}>
          {title}
        </Alert>

        {actionContext && (
          <Box mb={2}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
              OPERATION / CONTEXT:
            </Typography>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {actionContext}
            </Typography>
          </Box>
        )}

        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              ERROR CODE & MESSAGE:
            </Typography>
            <Chip label={errorCode} size="small" color="error" variant="outlined" sx={{ fontWeight: 700, height: 20 }} />
          </Box>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#ffffff', border: '1px solid #fca5a5' }}>
            <Typography variant="body2" color="error.dark" fontWeight={700} sx={{ wordBreak: 'break-word', fontFamily: 'monospace' }}>
              {errorMessage}
            </Typography>
            {errorDetails && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                Details/Hint: {errorDetails}
              </Typography>
            )}
          </Paper>
        </Box>

        {/* Developer Diagnostic Payload Box */}
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.75}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>
              DEVELOPER DIAGNOSTIC LOG:
            </Typography>
            <Button
              size="small"
              startIcon={copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
              color={copied ? 'success' : 'primary'}
              variant="outlined"
              onClick={handleCopy}
              sx={{ height: 24, fontSize: '0.75rem', textTransform: 'none' }}
            >
              {copied ? 'Copied to Clipboard!' : 'Copy Error Details'}
            </Button>
          </Box>

          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              bgcolor: '#0f172a',
              color: '#38bdf8',
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              fontSize: '0.78rem',
              maxHeight: 220,
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              borderRadius: 1.5,
            }}
          >
            {formattedJson}
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">
          Share this diagnostic report with your developer for immediate troubleshooting.
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
            color={copied ? 'success' : 'inherit'}
            onClick={handleCopy}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="contained" color="error" onClick={onClose}>
            Close
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default GprErrorDialog;

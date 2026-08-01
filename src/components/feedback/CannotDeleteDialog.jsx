import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export const CannotDeleteDialog = ({ open, onClose, recordName, recordType = 'record', details = [] }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', fontWeight: 700, gap: 1.5, color: 'error.main' }}>
        <WarningAmberIcon />
        Cannot Delete {recordType.charAt(0).toUpperCase() + recordType.slice(1)}
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" sx={{ mb: 2 }}>
          The {recordType} <strong>{recordName}</strong> is referenced by other operational or financial records and cannot be deleted.
        </Typography>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          This {recordType} is linked to:
        </Typography>

        <Box sx={{ pl: 2, mb: 3 }}>
          {details.map((detail, index) => (
            <Box key={index} sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', mb: 0.5 }}>
                • {detail.count} {detail.label}
              </Typography>
              {detail.examples && detail.examples.length > 0 && (
                <Box sx={{ pl: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Examples:
                  </Typography>
                  {detail.examples.map((ex, exIdx) => (
                    <Typography
                      key={exIdx}
                      variant="caption"
                      sx={{
                        bgcolor: 'action.hover',
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        border: '1px solid rgba(0,0,0,0.08)',
                        fontWeight: 600,
                      }}
                    >
                      {ex}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="body2" color="text.secondary">
          Please remove, re-link, or void these dependent records before attempting to delete this {recordType}.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CannotDeleteDialog;

import React from 'react';
import { Box, Typography } from '@mui/material';

export const SettingsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Company Settings
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage company details, GSTIN, invoice prefix settings, and fiscal boundaries.
      </Typography>
    </Box>
  );
};
export default SettingsPage;

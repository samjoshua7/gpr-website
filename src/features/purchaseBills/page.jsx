import React from 'react';
import { Box, Typography } from '@mui/material';

export const PurchaseBillsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Purchase Bills
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Record purchases of paper, ink, and plate materials, and track bill payment status.
      </Typography>
    </Box>
  );
};
export default PurchaseBillsPage;

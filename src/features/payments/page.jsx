import React from 'react';
import { Box, Typography } from '@mui/material';

export const PaymentsPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Supplier Payments
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Record payments made to suppliers for active or past purchase bills.
      </Typography>
    </Box>
  );
};
export default PaymentsPage;

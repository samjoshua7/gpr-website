import React from 'react';
import { Box, Typography } from '@mui/material';

export const PaymentsPage = () => {
  return (
    <Box sx={{ height: '100%', overflowY: 'auto' }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Supplier Payments
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Record payments made to suppliers for active or past purchase bills.
      </Typography>
    </Box>
  );
};
export default PaymentsPage;

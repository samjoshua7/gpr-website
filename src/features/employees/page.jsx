import React from 'react';
import { Box, Typography } from '@mui/material';

export const EmployeesPage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Employees
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Manage employee records, join dates, activity status, and salary details (restricted to SUPER_ADMIN).
      </Typography>
    </Box>
  );
};
export default EmployeesPage;

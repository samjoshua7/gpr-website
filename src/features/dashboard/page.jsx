import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Box, Button, Typography, Container, Card, CardContent } from '@mui/material';

export const DashboardPage = () => {
  const { profile, signOut } = useAuth();

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Card>
          <CardContent>
            <Typography variant="h4" gutterBottom>
              Dashboard
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Welcome back, {profile?.name || 'User'}!
            </Typography>
            <Button variant="outlined" color="primary" onClick={signOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

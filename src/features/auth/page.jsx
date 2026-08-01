import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Card, CardContent, Container, Alert, CircularProgress } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

export const LoginPage = () => {
  const { session, profile, loading: authLoading, authError, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle automatic redirects if already logged in / restored session
  useEffect(() => {
    if (!authLoading && session && profile) {
      if (profile.role === 'SUPER_ADMIN' || profile.role === 'STAFF') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [session, profile, authLoading, navigate]);

  const handleGoogleLogin = async () => {
    clearError();
    setError(null);
    setLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setLoading(false);
      }
    } catch (err) {
      setError('An unexpected error occurred during Google sign-in.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            bgcolor: 'rgba(30, 41, 59, 0.8)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {/* Visual Branding Element */}
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 0 20px rgba(26, 35, 126, 0.5)',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
                P
              </Typography>
            </Box>

            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#ffffff',
                mb: 1,
                letterSpacing: '-0.5px',
              }}
            >
              G.P.R Offset Printers, Tirunelveli
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255, 255, 255, 0.6)',
                mb: 4,
              }}
            >
              Business Management System
            </Typography>

            {/* Display local or global auth errors */}
            {(error || authError) && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  textAlign: 'left',
                  borderRadius: 2,
                  bgcolor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}
              >
                {error || authError}
              </Alert>
            )}

            <Button
              variant="contained"
              fullWidth
              size="large"
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                borderRadius: 2.5,
                bgcolor: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '1rem',
                textTransform: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.5)',
                  color: 'rgba(15, 23, 42, 0.5)',
                }
              }}
            >
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

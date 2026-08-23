import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Card, CardContent, Container, Alert, CircularProgress, Stack, Chip } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export const LoginPage = () => {
  const { session, profile, loading: authLoading, authError, clearError } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Handle automatic redirects if already logged in / restored session
  useEffect(() => {
    if (!authLoading && session && profile) {
      const isInternalUser = ['SUPER_ADMIN', 'STAFF', 'STAKEHOLDER', 'ACCOUNTS'].includes(profile.role);
      if (isInternalUser) {
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
      console.error(err);
      setError('An unexpected error occurred during Google sign-in.');
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0f172a',
        position: 'relative',
        overflow: 'hidden',
        px: 2,
        py: 4,
      }}
    >
      {/* Background radial ambient lights */}
      <Box
        sx={{
          position: 'absolute',
          top: -150,
          right: -150,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(49, 46, 129, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* Top back navigation */}
      <Box sx={{ position: 'absolute', top: 24, left: 24, zIndex: 10 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            borderRadius: 2,
            px: 2,
            py: 0.75,
            '&:hover': {
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.08)',
            },
          }}
        >
          Back to Store
        </Button>
      </Box>

      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 1 }}>
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            bgcolor: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(16px)',
          }}
        >
          <CardContent sx={{ p: { xs: 3.5, sm: 4.5 }, textAlign: 'center' }}>
            {/* Visual Branding Logo */}
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '16px',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
                boxShadow: '0 10px 25px -5px rgba(255, 255, 255, 1)',
                border: '1px solid rgba(255, 255, 255, 1)',
                p: 1,
              }}
            >
              <Box component="img" src="/favicon.svg" alt="G.P.R. Printers Logo" sx={{ width: 42, height: 42, objectFit: 'contain' }} />
            </Box>

            <Chip
              label="ERP PORTAL & CUSTOMER AUTH"
              size="small"
              sx={{
                bgcolor: 'rgba(2, 132, 199, 0.15)',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.7rem',
                letterSpacing: '0.05em',
                mb: 2,
                border: '1px solid rgba(56, 189, 248, 0.2)',
              }}
            />

            <Typography
              component="h1"
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#ffffff',
                mb: 1,
                letterSpacing: '-0.02em',
              }}
            >
              G.P.R. Printers
            </Typography>

            <Typography
              variant="body2"
              sx={{
                color: 'rgba(226, 232, 240, 0.7)',
                mb: 4,
                lineHeight: 1.5,
              }}
            >
              Sign in with your registered Google account to access your account & management dashboard.
            </Typography>

            {/* Display errors */}
            {(error || authError) && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  textAlign: 'left',
                  borderRadius: 2,
                  bgcolor: 'rgba(220, 38, 38, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  '& .MuiAlert-icon': { color: '#f87171' },
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
              disabled={loading || authLoading}
              sx={{
                py: 1.6,
                borderRadius: 2.5,
                bgcolor: '#ffffff',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '0.975rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
                '&:hover': {
                  bgcolor: '#f8fafc',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
                },
                '&:disabled': {
                  bgcolor: 'rgba(255, 255, 255, 0.4)',
                  color: 'rgba(15, 23, 42, 0.4)',
                },
              }}
            >
              {loading ? 'Connecting...' : 'Continue with Google'}
            </Button>

            <Typography variant="caption" sx={{ display: 'block', mt: 3, color: 'rgba(148, 163, 184, 0.6)' }}>
              Protected by Supabase OAuth & Row-Level Security
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;

import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { Box, Button, Typography, Container, Paper, Collapse } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';

export const RouteErrorPage = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = React.useState(false);

  const errorMessage = error?.statusText || error?.message || (typeof error === 'string' ? error : 'An unexpected runtime error occurred.');
  const errorStack = error?.stack || null;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        px: 2,
        py: 4,
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <ErrorOutlineIcon sx={{ fontSize: 80, color: '#f44336', mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          Unexpected Application Error
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 3 }}>
          Something went wrong while executing the requested action or rendering this view.
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            mb: 4,
            bgcolor: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
            borderRadius: 2,
            textAlign: 'left',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ff8a80', mb: 1 }}>
            Error Details:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: 'monospace', color: '#ffffff', wordBreak: 'break-word' }}
          >
            {errorMessage}
          </Typography>

          {errorStack && (
            <React.Fragment>
              <Button
                size="small"
                onClick={() => setShowDetails(!showDetails)}
                sx={{ mt: 1.5, color: '#90caf9', textTransform: 'none', p: 0 }}
              >
                {showDetails ? 'Hide stack trace' : 'Show stack trace'}
              </Button>
              <Collapse in={showDetails}>
                <Box
                  component="pre"
                  sx={{
                    mt: 1,
                    p: 1.5,
                    bgcolor: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    overflowX: 'auto',
                    color: '#e0e0e0',
                  }}
                >
                  {errorStack}
                </Box>
              </Collapse>
            </React.Fragment>
          )}
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => window.location.reload()}
            sx={{ px: 3, py: 1, borderRadius: 2, fontWeight: 600, textTransform: 'none' }}
          >
            Reload Page
          </Button>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{
              px: 3,
              py: 1,
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '&:hover': { borderColor: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    </Box>
  );
};

export default RouteErrorPage;

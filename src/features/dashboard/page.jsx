import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  Chip,
  Avatar,
  Paper,
  Divider,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';

export const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  const STAT_CARDS = [
    {
      title: 'Active Customers',
      subtitle: 'Registered Accounts',
      icon: <PeopleIcon fontSize="medium" />,
      color: '#0284c7',
      bgcolor: 'rgba(2, 132, 199, 0.08)',
      link: '/dashboard/customers',
    },
    {
      title: 'Job Cards',
      subtitle: 'Press Production Queue',
      icon: <AssignmentIcon fontSize="medium" />,
      color: '#4338ca',
      bgcolor: 'rgba(67, 56, 202, 0.08)',
      link: '/dashboard/jobs',
    },
    {
      title: 'Sales Invoices',
      subtitle: 'Billed & Outstanding',
      icon: <DescriptionIcon fontSize="medium" />,
      color: '#059669',
      bgcolor: 'rgba(5, 150, 105, 0.08)',
      link: '/dashboard/invoices',
    },
    {
      title: 'Inventory Stock',
      subtitle: 'Paper & Ink Materials',
      icon: <LayersIcon fontSize="medium" />,
      color: '#d97706',
      bgcolor: 'rgba(217, 119, 6, 0.08)',
      link: '/dashboard/inventory',
    },
  ];

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Welcome Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 4 },
          mb: 4,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 250,
            height: 250,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Chip
                label={isSuperAdmin ? 'SUPER ADMIN ACCESS' : 'STAFF OPERATOR'}
                size="small"
                sx={{
                  bgcolor: 'rgba(56, 189, 248, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  letterSpacing: '0.05em',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                System Ready
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome back, {profile?.name || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(226, 232, 240, 0.8)', maxWidth: 600 }}>
              G.P.R Offset Printers central control panel. Manage job cards, sales invoices, customer receipts, and raw inventory material stocks.
            </Typography>
          </Grid>

          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              component={Link}
              to="/"
              variant="contained"
              color="secondary"
              startIcon={<StorefrontIcon />}
              sx={{ borderRadius: 2.5, fontWeight: 700, px: 3, py: 1.2 }}
            >
              Public Customer Site
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Metric Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {STAT_CARDS.map((stat, idx) => (
          <Grid item xs={12} sm={6} md={3} key={idx}>
            <Card
              onClick={() => navigate(stat.link)}
              sx={{
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.1)',
                  borderColor: stat.color,
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 3,
                      bgcolor: stat.bgcolor,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <ArrowForwardIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                </Stack>

                <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {stat.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Action Shortcuts & Workflow Guidance */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Action Shortcuts
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/jobs')}
                  sx={{ py: 1.5, justifyContent: 'flex-start', px: 2, borderRadius: 2.5 }}
                >
                  Create New Job Card
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/invoices')}
                  sx={{ py: 1.5, justifyContent: 'flex-start', px: 2, borderRadius: 2.5 }}
                >
                  Create Sales Invoice
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/customers')}
                  sx={{ py: 1.5, justifyContent: 'flex-start', px: 2, borderRadius: 2.5 }}
                >
                  Register New Customer
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/dashboard/inventory')}
                  sx={{ py: 1.5, justifyContent: 'flex-start', px: 2, borderRadius: 2.5 }}
                >
                  Manage Stock Items
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%', bgcolor: 'background.paper' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUpIcon color="secondary" /> Operational Status
            </Typography>
            <Divider sx={{ mb: 2.5 }} />

            <Stack spacing={2}>
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(2, 132, 199, 0.05)', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'secondary.dark', mb: 0.5 }}>
                  Phase 1 & Phase 2 Core Modules Active
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Job tracking, sales billing, customer receipts, purchasing, payments, and stock synchronization are active.
                </Typography>
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(15, 23, 42, 0.03)', border: '1px solid rgba(15, 23, 42, 0.08)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Row-Level Security Enforced
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Financial calculations, voiding rules, and audit history are database-enforced.
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

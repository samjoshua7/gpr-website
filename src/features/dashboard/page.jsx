import React, { useState, useEffect } from 'react';
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
  Paper,
  Divider,
  CircularProgress,
  Skeleton,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import StorefrontIcon from '@mui/icons-material/Storefront';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

import { getDashboardData } from './api';

export const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    if (profile?.role === 'STAFF') {
      navigate('/dashboard/jobs', { replace: true });
      return;
    }
  }, [profile?.role, navigate]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const data = await getDashboardData();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  const STAT_CARDS = [
    {
      title: 'Active Customers',
      val: metrics?.customerCount !== undefined ? metrics.customerCount : '...',
      subtitle: 'Registered Accounts',
      icon: <PeopleIcon fontSize="medium" />,
      color: '#0284c7',
      bgcolor: 'rgba(2, 132, 199, 0.08)',
      link: '/dashboard/customers',
    },
    {
      title: 'Production Tasks',
      val: metrics?.taskCount !== undefined ? metrics.taskCount : '...',
      subtitle: 'Press Production Queue',
      icon: <AssignmentIcon fontSize="medium" />,
      color: '#4338ca',
      bgcolor: 'rgba(67, 56, 202, 0.08)',
      link: '/dashboard/jobs',
    },
    {
      title: 'Sales Invoices',
      val: metrics?.activeInvoiceCount !== undefined ? metrics.activeInvoiceCount : '...',
      subtitle: metrics ? `Unpaid: ${formatCurrency(metrics.outstanding)}` : 'Billed & Outstanding',
      icon: <DescriptionIcon fontSize="medium" />,
      color: '#059669',
      bgcolor: 'rgba(5, 150, 105, 0.08)',
      link: '/dashboard/invoices',
    },
    {
      title: 'Inventory Stock',
      val: metrics?.itemCount !== undefined ? metrics.itemCount : '...',
      subtitle: 'Paper & Ink Materials',
      icon: <LayersIcon fontSize="medium" />,
      color: '#d97706',
      bgcolor: 'rgba(217, 119, 6, 0.08)',
      link: '/dashboard/inventory',
    },
  ];

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pr: 0.5, pb: 4 }}>
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
                System Live
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Welcome back, {profile?.name || 'User'}!
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(226, 232, 240, 0.8)', maxWidth: 600 }}>
              G.P.R Offset Printers central control panel. Real-time production analytics, revenue trends, and inventory stock monitoring.
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

                <Typography variant="h4" sx={{ fontWeight: 900, mb: 0.5 }}>
                  {loading ? <Skeleton width="50%" /> : stat.val}
                </Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {stat.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.subtitle}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recharts Analytics Section */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Monthly Revenue Trend Chart */}
        <Grid item xs={12} md={8}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Monthly Revenue Performance
              </Typography>
              {metrics && (
                <Chip label={`Total Billed: ${formatCurrency(metrics.totalBilled)}`} color="primary" size="small" sx={{ fontWeight: 700 }} />
              )}
            </Box>
            <Divider sx={{ mb: 3 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                <CircularProgress />
              </Box>
            ) : !metrics?.revenueTrend?.length ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                <Typography color="text.secondary">No invoice sales data recorded yet.</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={metrics.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(val) => `₹${val}`} />
                  <RechartsTooltip formatter={(val) => [formatCurrency(val), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Financial Collections vs Receivables */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Collections vs Receivables
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={260}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={metrics?.financialDistribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(metrics?.financialDistribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(val) => formatCurrency(val)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Production Stage Pipeline */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Department Production Pipeline
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics?.pipelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={50} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Tasks" fill="#4338ca" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        {/* Inventory Stock Levels */}
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
              Material Inventory Stock Levels
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={240}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={metrics?.inventoryStockData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="stock" name="Current Stock" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reorder" name="Alert Level" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Action Shortcuts */}
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

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  Chip,
  Paper,
  Divider,
  CircularProgress,
  Skeleton,
  Switch,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import LayersIcon from '@mui/icons-material/Layers';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

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

import { getDashboardData, getCachedDashboardData } from './api';

const FINANCIAL_VISIBILITY_KEY = 'gpr_dashboard_hide_financial_values';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

const getInitialFinancialVisibility = () => {
  try {
    return window.localStorage.getItem(FINANCIAL_VISIBILITY_KEY) === 'true';
  } catch {
    return false;
  }
};

const FinancialPrivacyPlaceholder = () => (
  <Stack height={260} alignItems="center" justifyContent="center" spacing={1} color="text.secondary">
    <VisibilityOffIcon />
    <Typography variant="body2" fontWeight={700}>Financial values are hidden</Typography>
    <Typography variant="caption">Use the switch above to reveal them.</Typography>
  </Stack>
);

export const DashboardPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const cachedDashboard = getCachedDashboardData();

  const [metrics, setMetrics] = useState(() => cachedDashboard || null);
  const [loading, setLoading] = useState(() => !cachedDashboard);
  const [refreshing, setRefreshing] = useState(false);
  const [hideFinancialValues, setHideFinancialValues] = useState(getInitialFinancialVisibility);

  useEffect(() => {
    if (profile?.role === 'STAFF') {
      navigate('/dashboard/jobs', { replace: true });
    }
  }, [profile?.role, navigate]);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      const hasCached = !!getCachedDashboardData();
      if (hasCached) setRefreshing(true);
      else setLoading(true);

      try {
        const data = await getDashboardData(false);
        if (active) setMetrics(data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadDashboard();
    return () => { active = false; };
  }, []);

  const handleFinancialVisibilityChange = (event) => {
    const nextValue = event.target.checked;
    setHideFinancialValues(nextValue);
    try {
      window.localStorage.setItem(FINANCIAL_VISIBILITY_KEY, String(nextValue));
    } catch {
      // Privacy preference remains active for this session if storage is unavailable.
    }
  };

  const financialValue = (value) => hideFinancialValues ? '••••••' : formatCurrency(value);

  const statCards = [
    {
      title: 'Active Customers',
      value: metrics?.customerCount,
      subtitle: 'Registered customer accounts',
      icon: <PeopleIcon fontSize="small" />,
      color: '#0284c7',
      background: 'rgba(2, 132, 199, 0.08)',
      link: '/dashboard/customers',
    },
    {
      title: 'Production Jobs',
      value: metrics?.taskCount,
      subtitle: 'Jobs across the production queue',
      icon: <AssignmentIcon fontSize="small" />,
      color: '#4338ca',
      background: 'rgba(67, 56, 202, 0.08)',
      link: '/dashboard/jobs',
    },
    {
      title: 'Active Invoices',
      value: metrics?.activeInvoiceCount,
      subtitle: 'Non-void sales invoices',
      icon: <DescriptionIcon fontSize="small" />,
      color: '#059669',
      background: 'rgba(5, 150, 105, 0.08)',
      link: '/dashboard/invoices',
    },
    {
      title: 'Inventory Items',
      value: metrics?.itemCount,
      subtitle: 'Tracked paper and materials',
      icon: <LayersIcon fontSize="small" />,
      color: '#d97706',
      background: 'rgba(217, 119, 6, 0.08)',
      link: '/dashboard/inventory',
    },
    {
      title: 'Total Billed',
      value: financialValue(metrics?.totalBilled),
      subtitle: 'All active invoice value',
      icon: <DescriptionIcon fontSize="small" />,
      color: '#0369a1',
      background: 'rgba(3, 105, 161, 0.08)',
      link: '/dashboard/invoices',
      financial: true,
    },
    {
      title: 'Collections',
      value: financialValue(metrics?.totalPaid),
      subtitle: 'Payments received against invoices',
      icon: <PaymentsIcon fontSize="small" />,
      color: '#047857',
      background: 'rgba(4, 120, 87, 0.08)',
      link: '/dashboard/receipts',
      financial: true,
    },
    {
      title: 'Receivables',
      value: financialValue(metrics?.outstanding),
      subtitle: 'Outstanding customer balance',
      icon: <AccountBalanceWalletIcon fontSize="small" />,
      color: '#b91c1c',
      background: 'rgba(185, 28, 28, 0.08)',
      link: '/dashboard/customers',
      financial: true,
    },
    {
      title: 'Low Stock Alerts',
      value: metrics?.lowStockCount,
      subtitle: 'Items at or below reorder level',
      icon: <WarningAmberIcon fontSize="small" />,
      color: '#c2410c',
      background: 'rgba(194, 65, 12, 0.08)',
      link: '/dashboard/inventory',
    },
  ];

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', pr: 0.5, pb: 4 }}>
      <Box sx={{ height: 2, mb: 1 }}>
        {refreshing && <LinearProgress aria-label="Refreshing dashboard data" sx={{ height: 2 }} />}
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em">
            Business Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sales, collections, production, and inventory at a glance.
          </Typography>
        </Box>
        <FormControlLabel
          control={(
            <Switch
              checked={hideFinancialValues}
              onChange={handleFinancialVisibilityChange}
              inputProps={{ 'aria-label': 'Hide financial values on dashboard' }}
            />
          )}
          label="Hide financial values"
          sx={{ m: 0 }}
        />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.title}>
            <Card
              variant="outlined"
              onClick={() => navigate(stat.link)}
              sx={{
                height: '100%',
                cursor: 'pointer',
                transition: 'border-color 160ms ease, box-shadow 160ms ease',
                '&:hover': {
                  borderColor: stat.color,
                  boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
                },
              }}
            >
              <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box
                    sx={{
                      width: 38,
                      height: 38,
                      borderRadius: 2,
                      bgcolor: stat.background,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 17 }} />
                </Stack>
                <Typography variant="h5" fontWeight={900} sx={{ mt: 1.5, mb: 0.25 }}>
                  {loading ? <Skeleton width="45%" /> : (stat.value ?? 0)}
                </Typography>
                <Typography variant="subtitle2" fontWeight={800}>{stat.title}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.subtitle}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>Monthly Revenue</Typography>
              {!hideFinancialValues && metrics && (
                <Chip label={`Total: ${formatCurrency(metrics.totalBilled)}`} color="primary" size="small" />
              )}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Stack height={260} alignItems="center" justifyContent="center"><CircularProgress /></Stack>
            ) : hideFinancialValues ? (
              <FinancialPrivacyPlaceholder />
            ) : !metrics?.revenueTrend?.length ? (
              <Stack height={260} alignItems="center" justifyContent="center">
                <Typography color="text.secondary">No invoice sales data recorded yet.</Typography>
              </Stack>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={metrics.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `Rs ${Number(value).toLocaleString('en-IN')}`} />
                  <RechartsTooltip formatter={(value) => [formatCurrency(value), 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#0284c7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Collections vs Receivables</Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Stack height={260} alignItems="center" justifyContent="center"><CircularProgress /></Stack>
            ) : hideFinancialValues ? (
              <FinancialPrivacyPlaceholder />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={metrics?.financialDistribution || []} cx="50%" cy="45%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                    {(metrics?.financialDistribution || []).map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value)} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Production Pipeline</Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Stack height={250} alignItems="center" justifyContent="center"><CircularProgress /></Stack>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics?.pipelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={58} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Bar dataKey="count" name="Jobs" fill="#4338ca" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={6}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="h6" fontWeight={800}>Inventory Stock Levels</Typography>
              {!!metrics?.lowStockCount && <Chip label={`${metrics.lowStockCount} low`} color="warning" size="small" />}
            </Stack>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Stack height={250} alignItems="center" justifyContent="center"><CircularProgress /></Stack>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={metrics?.inventoryStockData || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="stock" name="Current Stock" fill="#059669" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reorder" name="Reorder Level" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;

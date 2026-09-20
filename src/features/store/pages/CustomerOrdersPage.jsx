import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Button,
  Chip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';

export const CustomerOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from('online_orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (fetchErr) throw new Error(fetchErr.message);
        setOrders(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load order history.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const getStatusChip = (status) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="Confirmed" size="small" color="info" sx={{ fontWeight: 700 }} />;
      case 'processing':
        return <Chip label="Printing / In Press" size="small" color="primary" sx={{ fontWeight: 700 }} />;
      case 'ready':
        return <Chip label="Ready for Dispatch" size="small" color="secondary" sx={{ fontWeight: 700 }} />;
      case 'completed':
        return <Chip label="Completed / Delivered" size="small" color="success" sx={{ fontWeight: 700 }} />;
      case 'cancelled':
        return <Chip label="Cancelled" size="small" color="error" sx={{ fontWeight: 700 }} />;
      case 'pending':
      default:
        return <Chip label="Pending Review" size="small" color="warning" sx={{ fontWeight: 700 }} />;
    }
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Sign In Required
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to view your order history and track dispatch statuses.
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Link component={RouterLink} to="/account" color="inherit" underline="hover">
            Account
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            My Orders
          </Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em">
              My Order History
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Track the live press status and delivery progress of all your printing jobs.
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/products')}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
          >
            New Print Order
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <CircularProgress sx={{ display: 'block', mx: 'auto', my: 6 }} />
        ) : orders.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 8,
              textAlign: 'center',
              borderRadius: 3.5,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <ShoppingBagIcon sx={{ fontSize: '3rem', color: 'text.secondary', mb: 1.5 }} />
            <Typography variant="h5" fontWeight={800} color="text.primary">
              No orders placed yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 450, mx: 'auto' }}>
              Your order history will appear here as soon as you place your first commercial offset order.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Explore Products &amp; Order
            </Button>
          </Paper>
        ) : (
          <TableContainer
            component={Paper}
            elevation={0}
            sx={{
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
              bgcolor: 'background.paper',
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date Booked</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Delivery Location</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Grand Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.order_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={800} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                        {order.order_no || order.order_id.slice(0, 8)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(order.created_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {getStatusChip(order.status)}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 220 }}>
                        {order.city}, {order.state} ({order.pincode})
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(order.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon fontSize="small" />}
                        onClick={() => navigate(`/account/orders/${order.order_id}`)}
                        sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>

      <StoreFooter />
    </Box>
  );
};

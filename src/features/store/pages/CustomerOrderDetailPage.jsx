import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Divider,
  Button,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Breadcrumbs,
  Link,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import PrintIcon from '@mui/icons-material/Print';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { StoreFooter } from '../components/StoreFooter';
import { useAuth } from '../../../hooks/useAuth';
import { supabase } from '../../../lib/supabaseClient';

const ORDER_STEPS = ['Pending', 'Confirmed', 'Processing', 'Ready', 'Completed'];

const getStepIndex = (status) => {
  switch (status) {
    case 'confirmed': return 1;
    case 'processing': return 2;
    case 'ready': return 3;
    case 'completed': return 4;
    case 'cancelled': return -1;
    case 'pending':
    default: return 0;
  }
};

export const CustomerOrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId || !user) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const { data: orderData, error: orderErr } = await supabase
          .from('online_orders')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (orderErr) throw new Error(orderErr.message);
        setOrder(orderData);

        const { data: itemsData, error: itemsErr } = await supabase
          .from('online_order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsErr) throw new Error(itemsErr.message);
        setItems(itemsData || []);
      } catch (err) {
        setError(err.message || 'Failed to load order.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [orderId, user]);

  const handlePrint = () => {
    window.print();
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center', flexGrow: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
            Sign In Required
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="lg" sx={{ py: 12, textAlign: 'center', flexGrow: 1 }}>
          <CircularProgress />
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center', flexGrow: 1 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Order record not found.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/account/orders')}>
            Back to My Orders
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  const activeStep = getStepIndex(order.status);

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Link component={RouterLink} to="/account/orders" color="inherit" underline="hover">
            My Orders
          </Link>
          <Typography color="text.primary" fontWeight={600}>
            {order.order_no || order.order_id.slice(0, 8)}
          </Typography>
        </Breadcrumbs>

        {/* Top Action Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em">
              Order {order.order_no || order.order_id.slice(0, 8)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Print Invoice Summary
            </Button>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/account/orders')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              All Orders
            </Button>
          </Stack>
        </Box>

        {/* Status Stepper Card */}
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            mb: 4,
          }}
        >
          <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 3 }}>
            ORDER STATUS &amp; DISPATCH PROGRESS
          </Typography>

          {order.status === 'cancelled' ? (
            <Alert severity="error">
              This order has been cancelled. Please contact our sales team if you have any questions.
            </Alert>
          ) : (
            <Stepper activeStep={activeStep} alternativeLabel>
              {ORDER_STEPS.map((label, index) => (
                <Step key={label} completed={activeStep >= index}>
                  <StepLabel>
                    <Typography variant="caption" fontWeight={700}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          )}
        </Paper>

        <Grid container spacing={4}>
          {/* Items Snapshot Table */}
          <Grid item xs={12} lg={8}>
            <Paper
              elevation={0}
              sx={{
                p: 3.5,
                borderRadius: 3.5,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2.5 }}>
                Purchased Specifications ({items.length} items)
              </Typography>

              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="center">Quantity</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Unit Rate</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.order_item_id} hover>
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={800}>
                          {item.product_name}
                        </Typography>
                        {item.selected_options && typeof item.selected_options === 'object' && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, my: 0.8 }}>
                            {Object.entries(item.selected_options).map(([k, v]) => (
                              <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                            ))}
                          </Box>
                        )}
                        <Chip
                          label={item.design_provision === 'design_by_gpr' ? 'Design by GPR Studio' : 'Self-Supplied Artwork'}
                          size="small"
                          sx={{ height: 18, fontSize: '0.65rem' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{item.quantity.toLocaleString('en-IN')} units</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          ₹{parseFloat(item.unit_price).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                          ₹{parseFloat(item.subtotal).toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          {/* Customer & Address Details */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                  DELIVERY ADDRESS
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {order.customer_name} {order.customer_company && `(${order.customer_company})`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {order.customer_email} &bull; {order.customer_phone}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {order.billing_address}
                </Typography>
                <Typography variant="body2">
                  {order.city}, {order.state} – {order.pincode}
                </Typography>
                {order.customer_gstin && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontFamily: 'monospace' }}>
                    GSTIN: {order.customer_gstin}
                  </Typography>
                )}
                {order.notes && (
                  <Box sx={{ mt: 2, p: 1.5, bgcolor: 'grey.50', borderRadius: 1.5 }}>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">Notes / Instructions:</Typography>
                    <Typography variant="body2">{order.notes}</Typography>
                  </Box>
                )}
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2 }}>
                  FINANCIAL SUMMARY
                </Typography>
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{parseFloat(order.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">GST ({order.gst_rate}%):</Typography>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      ₹{parseFloat(order.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                  <Divider sx={{ my: 0.5 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Typography variant="subtitle1" fontWeight={800}>Grand Total:</Typography>
                    <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                      ₹{parseFloat(order.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </Box>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      <StoreFooter />
    </Box>
  );
};

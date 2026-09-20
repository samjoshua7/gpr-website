import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PrintIcon from '@mui/icons-material/Print';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HomeIcon from '@mui/icons-material/Home';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { supabase } from '../../../lib/supabaseClient';

export const OrderConfirmationPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [order, setOrder] = useState(location.state?.order || null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) return;

    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        // Fetch order details
        const { data: orderData, error: orderErr } = await supabase
          .from('online_orders')
          .select('*')
          .eq('order_id', orderId)
          .single();

        if (orderErr) throw new Error(orderErr.message);
        setOrder(orderData);

        // Fetch order items snapshot
        const { data: itemsData, error: itemsErr } = await supabase
          .from('online_order_items')
          .select('*')
          .eq('order_id', orderId);

        if (itemsErr) throw new Error(itemsErr.message);
        setItems(itemsData || []);
      } catch (err) {
        setError(err.message || 'Failed to load order confirmation details.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="md" sx={{ py: 12, textAlign: 'center', flexGrow: 1 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }} color="text.secondary">
            Loading order details...
          </Typography>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center', flexGrow: 1 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'Order record not found.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/')}>
            Back to Storefront
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      <Container maxWidth="md" sx={{ py: 6, flexGrow: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: '#ffffff',
            boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
          }}
        >
          {/* Success Banner */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <CheckCircleIcon sx={{ fontSize: '4.5rem', color: 'success.main', mb: 1.5 }} />
            <Typography variant="h4" fontWeight={900} letterSpacing="-0.02em" sx={{ color: 'text.primary' }}>
              Thank You! Order Confirmed
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Your print order has been placed successfully and registered in our Tirunelveli factory queue.
            </Typography>
            <Chip
              label={`Order Number: ${order.order_no || order.order_id?.slice(0, 8)}`}
              color="primary"
              sx={{ fontWeight: 800, fontSize: '0.9rem', mt: 2, px: 1, py: 2 }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Customer & Address Details */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1.5 }}>
              DISPATCH &amp; BILLING INFORMATION
            </Typography>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" fontWeight={700}>
                {order.customer_name} {order.customer_company && `(${order.customer_company})`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.customer_email} &bull; {order.customer_phone}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {order.billing_address}, {order.city}, {order.state} – {order.pincode}
              </Typography>
              {order.customer_gstin && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontFamily: 'monospace' }}>
                  GSTIN: {order.customer_gstin}
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Purchased Items Snapshot */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1.5 }}>
              PURCHASED SPECIFICATIONS
            </Typography>
            <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Item Description</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Quantity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Unit Rate</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.order_item_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {item.product_name}
                      </Typography>
                      {item.selected_options && typeof item.selected_options === 'object' && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {Object.entries(item.selected_options).map(([k, v]) => (
                            <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                          ))}
                        </Box>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Artwork: {item.design_provision === 'design_by_gpr' ? 'Design by GPR Studio' : 'Self-Supplied'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{item.quantity.toLocaleString('en-IN')}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(item.unit_price).toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(item.subtotal).toFixed(2)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Financial Totals */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2.5, bgcolor: 'grey.50', mb: 4 }}>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Item Subtotal:</Typography>
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

          {/* Actions */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={handlePrint}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              Print Confirmation
            </Button>
            <Button
              variant="contained"
              startIcon={<ShoppingBagIcon />}
              onClick={() => navigate('/account/orders')}
              sx={{ textTransform: 'none', fontWeight: 700 }}
            >
              View in My Orders
            </Button>
            <Button
              variant="text"
              startIcon={<HomeIcon />}
              onClick={() => navigate('/')}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Back to Home
            </Button>
          </Stack>
        </Paper>
      </Container>

      <StoreFooter />
    </Box>
  );
};

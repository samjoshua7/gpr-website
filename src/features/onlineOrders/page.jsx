import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Skeleton,
  Alert,
  Tooltip,
  Divider,
  Stack,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getOnlineOrders, getOnlineOrderById, updateOrderStatus } from './api';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending Review', color: 'warning' },
  { value: 'confirmed', label: 'Confirmed', color: 'info' },
  { value: 'processing', label: 'Printing / In Press', color: 'primary' },
  { value: 'ready', label: 'Ready for Dispatch', color: 'secondary' },
  { value: 'completed', label: 'Completed / Delivered', color: 'success' },
  { value: 'cancelled', label: 'Cancelled', color: 'error' },
];

export const OnlineOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Details Dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOnlineOrders({
        status: statusFilter,
        searchQuery,
      });
      setOrders(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load online orders.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.order_id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrder && selectedOrder.order_id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    }
  };

  const handleOpenDetails = async (orderId) => {
    try {
      setDetailsOpen(true);
      setDetailsLoading(true);
      const data = await getOnlineOrderById(orderId);
      setSelectedOrder(data);
    } catch (err) {
      alert('Failed to fetch order details: ' + err.message);
      setDetailsOpen(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Storefront Online Orders
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage commercial orders placed by customers through the online website.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadOrders}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Refresh Orders
        </Button>
      </Box>

      {/* Filter Bar */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'center',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by order #, customer name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 260 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Status Filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="ALL">All Statuses</MenuItem>
          {STATUS_OPTIONS.map((st) => (
            <MenuItem key={st.value} value={st.value}>
              {st.label}
            </MenuItem>
          ))}
        </TextField>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadOrders}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Orders Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1.5,
          overflow: 'hidden',
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.50' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date Booked</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer Name &amp; Contact</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Grand Total</TableCell>
              <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>Status Workflow</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="text" width={80} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={140} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell align="center"><Skeleton variant="text" width={40} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={70} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" height={32} sx={{ borderRadius: 1 }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={50} sx={{ ml: 'auto' }} /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    No online orders found matching current criteria.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
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
                    <Typography variant="body2" fontWeight={700}>
                      {order.customer_name} {order.customer_company && `(${order.customer_company})`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {order.customer_phone || order.customer_email}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {order.city || '—'}, {order.state || '—'}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={`${order.items?.length || 0} items`}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.72rem', height: 22 }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                      ₹{parseFloat(order.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      Incl. {order.gst_rate}% GST
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Select
                      size="small"
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.order_id, e.target.value)}
                      sx={{
                        fontSize: '0.8rem',
                        height: 32,
                        width: '100%',
                        fontWeight: 600,
                      }}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.8rem' }}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>

                  <TableCell align="right">
                    <Tooltip title="View Complete Order Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenDetails(order.order_id)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Order Details: {selectedOrder?.order_no || selectedOrder?.order_id?.slice(0, 8)}</span>
          {selectedOrder && (
            <Chip
              label={selectedOrder.status.toUpperCase()}
              color={STATUS_OPTIONS.find((s) => s.value === selectedOrder.status)?.color || 'default'}
              size="small"
              sx={{ fontWeight: 800 }}
            />
          )}
        </DialogTitle>

        <DialogContent dividers>
          {detailsLoading || !selectedOrder ? (
            <Skeleton variant="rectangular" height={280} />
          ) : (
            <Stack spacing={3}>
              {/* Customer & Billing Info */}
              <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1 }}>
                  CUSTOMER &amp; DELIVERY ADDRESS
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  {selectedOrder.customer_name} {selectedOrder.customer_company && `(${selectedOrder.customer_company})`}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {selectedOrder.customer_phone} &bull; Email: {selectedOrder.customer_email}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Address: {selectedOrder.billing_address}, {selectedOrder.city}, {selectedOrder.state} – {selectedOrder.pincode}
                </Typography>
                {selectedOrder.customer_gstin && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, fontFamily: 'monospace' }}>
                    GSTIN: {selectedOrder.customer_gstin}
                  </Typography>
                )}
                {selectedOrder.notes && (
                  <Box sx={{ mt: 1.5, p: 1, bgcolor: '#ffffff', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" fontWeight={700}>Customer Notes:</Typography>
                    <Typography variant="body2">{selectedOrder.notes}</Typography>
                  </Box>
                )}
              </Paper>

              {/* Items Snapshot */}
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="text.secondary" sx={{ mb: 1 }}>
                  PURCHASED SPECIFICATIONS
                </Typography>
                <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Unit Rate</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOrder.items?.map((item) => (
                      <TableRow key={item.order_item_id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>{item.product_name}</Typography>
                          {item.selected_options && typeof item.selected_options === 'object' && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, my: 0.5 }}>
                              {Object.entries(item.selected_options).map(([k, v]) => (
                                <Chip key={k} label={`${k}: ${v}`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.68rem' }} />
                              ))}
                            </Box>
                          )}
                          <Chip
                            label={item.design_provision === 'design_by_gpr' ? 'Design by GPR' : 'Self-Supplied Artwork'}
                            size="small"
                            sx={{ height: 18, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell align="center">{item.quantity.toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace' }}>₹{parseFloat(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 700 }}>₹{parseFloat(item.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              {/* Financial Totals */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{ width: 280 }}>
                  <Stack spacing={0.8}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Item Subtotal:</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(selectedOrder.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">GST ({selectedOrder.gst_rate}%):</Typography>
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(selectedOrder.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <Typography variant="subtitle2" fontWeight={800}>Grand Total:</Typography>
                      <Typography variant="h6" fontWeight={900} color="primary.main" sx={{ fontFamily: 'monospace' }}>
                        ₹{parseFloat(selectedOrder.grand_total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDetailsOpen(false)} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

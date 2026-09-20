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
  Button,
  Chip,
  Skeleton,
  Alert,
  Avatar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

import { getOnlineCustomers } from './api';

export const OnlineCustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOnlineCustomers({ searchQuery });
      setCustomers(data || []);
    } catch (err) {
      setError(err.message || 'Failed to load online customers.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'text.primary', letterSpacing: '-0.02em' }}>
            Storefront Customers
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Online shoppers and registered business accounts from the e-commerce storefront.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<RefreshIcon />}
          onClick={loadCustomers}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Refresh Customers
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
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          size="small"
          placeholder="Search by customer name, email, phone, company, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: { xs: '100%', sm: 400 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} action={<Button color="inherit" size="small" onClick={loadCustomers}>Retry</Button>}>
          {error}
        </Alert>
      )}

      {/* Customers Table */}
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
              <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Company &amp; GSTIN</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="center">Orders</TableCell>
              <TableCell sx={{ fontWeight: 700 }} align="right">Total Spent</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Registered On</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell><Skeleton variant="text" width={140} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell><Skeleton variant="text" width={120} /></TableCell>
                  <TableCell><Skeleton variant="text" width={100} /></TableCell>
                  <TableCell align="center"><Skeleton variant="text" width={40} sx={{ mx: 'auto' }} /></TableCell>
                  <TableCell align="right"><Skeleton variant="text" width={70} sx={{ ml: 'auto' }} /></TableCell>
                  <TableCell><Skeleton variant="text" width={90} /></TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ py: 6, textAlign: 'center' }}>
                  <Typography variant="body1" fontWeight={600} color="text.secondary">
                    No online customers found matching current search.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((cust) => (
                <TableRow key={cust.online_customer_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, fontSize: '0.8rem', bgcolor: 'primary.main', fontWeight: 700 }}>
                        {cust.name ? cust.name[0].toUpperCase() : 'C'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700}>
                        {cust.name}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{cust.email}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">{cust.phone || '—'}</Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {cust.company_name || 'Individual Customer'}
                    </Typography>
                    {cust.gstin && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', display: 'block' }}>
                        {cust.gstin}
                      </Typography>
                    )}
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {cust.city ? `${cust.city}, ${cust.state || ''}` : '—'}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    <Chip
                      label={`${cust.orders_count} orders`}
                      size="small"
                      color={cust.orders_count > 0 ? 'primary' : 'default'}
                      variant={cust.orders_count > 0 ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.72rem', height: 22, fontWeight: 600 }}
                    />
                  </TableCell>

                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={800} sx={{ fontFamily: 'monospace' }}>
                      ₹{cust.total_spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(cust.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

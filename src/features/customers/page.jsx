import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Avatar,
  Tooltip,
  Stack,
  Chip,
  TablePagination,
  TableSortLabel
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { getCustomers, deleteCustomer } from './api';
import CustomerDialog from './components/CustomerDialog';
import PageToolbar from '../../components/layout/PageToolbar';
import { CustomerImportWizard } from './components/CustomerImportWizard';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';
import { SearchInput } from '../../components/ui/SearchInput';
import { HighlightText } from '../../components/ui/HighlightText';
import { formatDate } from '../../lib/formatDate';

const headCells = [
  { id: 'name', label: 'Customer Name', align: 'left' },
  { id: 'phone', label: 'Phone Number', align: 'left' },
  { id: 'gstin', label: 'GSTIN', align: 'left', disableSort: true },
  { id: 'identification_name', label: 'Identification Name', align: 'left' },
  { id: 'outstanding_balance', label: 'Outstanding Balance', align: 'right' },
  { id: 'actions', label: 'Actions', align: 'center', disableSort: true }
];

// Formatting helpers (hoisted to avoid recreating on every render)
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const CustomersPage = () => {
  const navigate = useNavigate();
  const [allCustomers, setAllCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  
  // Sorting state
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

  // Dialogs state
  const [importWizardOpen, setImportWizardOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  // 1. Initial Fetch
  const fetchCustomers = useCallback(async (force = true) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all customers with fresh balances
      const data = await getCustomers('', force);
      setAllCustomers(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers(true);
  }, [fetchCustomers]);

  // 3. Client-side Processing (Filter & Sort)
  const processedCustomers = useMemo(() => {
    let result = [...allCustomers];
    
    // Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        (c.name || '').toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q) ||
        (c.gstin || '').toLowerCase().includes(q) ||
        (c.identification_name || '').toLowerCase().includes(q)
      );
    }

    // Sort
    if (orderBy) {
      result.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];
        
        valA = valA == null ? '' : valA;
        valB = valB == null ? '' : valB;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [allCustomers, searchQuery, orderBy, order]);

  // Reset pagination when search changes
  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  // 4. Client-side Pagination
  const paginatedCustomers = useMemo(() => {
    const start = page * rowsPerPage;
    return processedCustomers.slice(start, start + rowsPerPage);
  }, [processedCustomers, page, rowsPerPage]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handlers
  const handleAddClick = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEditClick = (customer) => {
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDeleteClick = async (customer) => {
    try {
      const res = await checkReferences('customers', customer.customer_id);
      if (res.hasReferences) {
        setCustomerToDelete(customer);
        setDependencyDetails(res.details);
        setCannotDeleteOpen(true);
      } else {
        setCustomerToDelete(customer);
        setDeleteError(null);
        setDeleteOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to check database references for this customer.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteCustomer(customerToDelete.customer_id);
      setDeleteOpen(false);
      setCustomerToDelete(null);
      fetchCustomers(); // Refresh list only on modification
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete customer. Ensure they have no linked jobs/invoices.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDataChanged = () => {
    fetchCustomers();
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      <PageToolbar
        title="Customer Directory"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search customers..."
        actions={
          <React.Fragment>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setImportWizardOpen(true)}
            >
              Import Customers
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddClick}
            >
              Add Customer
            </Button>
          </React.Fragment>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      {/* 2 & 3. DATA TABLE WITH SORTING & PAGINATION */}
      <Paper sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer sx={{ flexGrow: 1, maxHeight: 'calc(100vh - 180px)' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align}
                    sx={{ fontWeight: 700, bgcolor: 'background.default' }}
                    sortDirection={orderBy === headCell.id ? order : false}
                  >
                    {headCell.disableSort ? (
                      headCell.label
                    ) : (
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : 'asc'}
                        onClick={() => handleRequestSort(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && allCustomers.length === 0 ? (
                // 5. LOADING EXPERIENCE: Skeletons only on initial fetch
                Array.from(new Array(10)).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton width="60%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="40%" /></TableCell>
                    <TableCell><Skeleton width="80%" /></TableCell>
                    <TableCell align="right"><Skeleton width="30%" sx={{ ml: 'auto' }} /></TableCell>
                    <TableCell align="center"><Skeleton width="40%" sx={{ mx: 'auto' }} /></TableCell>
                  </TableRow>
                ))
              ) : paginatedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <PeopleIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
                      <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                        No Customers Found
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCustomers.map((customer) => (
                  <TableRow key={customer.customer_id} hover>
                    <TableCell sx={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'secondary.main', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                          {customer.name ? customer.name.charAt(0).toUpperCase() : 'C'}
                        </Avatar>
                        <Tooltip title={customer.name || ''} arrow placement="top" disableHoverListener={!customer.name || customer.name.length < 25}>
                          <Typography variant="subtitle2" component="span" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                            <HighlightText text={customer.name} highlight={searchQuery} />
                          </Typography>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}><HighlightText text={customer.phone || '—'} highlight={searchQuery} /></TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {customer.gstin ? (
                        <Chip label={<HighlightText text={customer.gstin} highlight={searchQuery} />} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', height: 20 }} />
                      ) : (
                        <Typography variant="caption" color="text.secondary">Unregistered</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Tooltip title={customer.identification_name || ''} arrow placement="top" disableHoverListener={!customer.identification_name || customer.identification_name.length < 20}>
                        <Typography variant="body2" component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          <HighlightText text={customer.identification_name || '—'} highlight={searchQuery} />
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: customer.outstanding_balance === 0 
                            ? 'success.main' 
                            : customer.outstanding_balance > 0 
                              ? 'warning.main' 
                              : 'info.main'
                        }}
                      >
                        {formatCurrency(customer.outstanding_balance)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Ledger">
                        <IconButton color="info" onClick={() => navigate(`/dashboard/customers/${customer.customer_id}`)} size="small" sx={{ mr: 0.5 }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => handleEditClick(customer)} size="small" sx={{ mr: 0.5 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteClick(customer)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={processedCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <CustomerDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        customer={selectedCustomer}
        onSaveSuccess={handleDataChanged}
      />

      {/* Import Wizard */}
      <CustomerImportWizard
        open={importWizardOpen}
        onClose={() => setImportWizardOpen(false)}
        onSuccess={handleDataChanged}
      />

      {/* Cannot Delete Dialog */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={customerToDelete?.name}
        recordType="customer"
        details={dependencyDetails}
      />

      {/* Delete Confirm */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <DialogContentText>
            Are you sure you want to delete customer <strong>{customerToDelete?.name}</strong>? This action is permanent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;

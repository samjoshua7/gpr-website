import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
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
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StorageIcon from '@mui/icons-material/Storage';

import { getItems, deleteItem } from './api';
import ItemDialog from './components/ItemDialog';
import StockAdjustmentDialog from './components/StockAdjustmentDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [itemToAdjust, setItemToAdjust] = useState(null);

  // Delete states
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Safeguard state
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  const fetchItems = useCallback(async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await getItems(query);
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inventory catalog list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(searchQuery);
  }, [searchQuery, fetchItems]);

  const handleAddClick = () => {
    setSelectedItem(null);
    setDialogOpen(true);
  };

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleAdjustClick = (item) => {
    setItemToAdjust(item);
    setAdjustOpen(true);
  };

  const handleDeleteClick = async (item) => {
    setLoading(true);
    try {
      const res = await checkReferences('items', item.item_id);
      if (res.hasReferences) {
        setItemToDelete(item);
        setDependencyDetails(res.details);
        setCannotDeleteOpen(true);
      } else {
        setItemToDelete(item);
        setDeleteError(null);
        setDeleteOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to run database dependency checks.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteItem(itemToDelete.item_id);
      setDeleteOpen(false);
      setItemToDelete(null);
      fetchItems(searchQuery);
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchItems(searchQuery);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  return (
    <Box sx={{ p: 4 }}>
      {/* Header block */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Inventory Catalog & Ledger
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor printing stocks (papers, plates, inks) and manage reorder warnings in real-time.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick} size="large">
          Add Catalog Product
        </Button>
      </Box>

      {/* Filters and search */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Search by product name or HSN code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Catalog Table */}
      {loading && items.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="text.secondary">No inventory products found.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'action.hover' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Unit</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>HSN/SAC</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>GST rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Default Rate</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Alert Level</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="right">Current Stock</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const stock = parseFloat(item.current_stock || 0);
                const limit = parseFloat(item.reorder_level || 0);
                const isLow = stock <= limit;

                return (
                  <TableRow key={item.item_id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{item.name}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.hsn_code || '—'}</TableCell>
                    <TableCell>
                      {item.tax_rates ? `${item.tax_rates.tax_name} (${item.tax_rates.percentage}%)` : 'Exempt (0%)'}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell align="right" color="text.secondary">
                      {item.reorder_level}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: isLow ? 'error.main' : 'text.primary' }}>
                      {stock.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={isLow ? 'LOW STOCK' : 'IN STOCK'}
                        color={isLow ? 'error' : 'success'}
                        size="small"
                        sx={{ fontWeight: 800, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        <Tooltip title="Post Stock Adjustment">
                          <IconButton
                            color="primary"
                            onClick={() => handleAdjustClick(item)}
                            size="small"
                          >
                            <StorageIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Product">
                          <IconButton
                            onClick={() => handleEditClick(item)}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Product">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteClick(item)}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Catalog Dialog */}
      <ItemDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={selectedItem}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Stock adjustment dialog */}
      <StockAdjustmentDialog
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        item={itemToAdjust}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Dependency checks safeguard */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={itemToDelete?.name}
        recordType="catalog product"
        details={dependencyDetails}
      />

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete product <strong>{itemToDelete?.name}</strong> from the catalog? This action is permanent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={16} color="inherit" /> : null}
          >
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InventoryPage;

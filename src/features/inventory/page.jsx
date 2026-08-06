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
import StorageIcon from '@mui/icons-material/Storage';
import EditIcon from '@mui/icons-material/Edit';
import { TablePagination, TableSortLabel, Stack } from '@mui/material';
import { SearchInput } from '../../components/ui/SearchInput';
import { HighlightText } from '../../components/ui/HighlightText';

import { getItems, deleteItem } from './api';
import ItemDialog from './components/ItemDialog';
import StockAdjustmentDialog from './components/StockAdjustmentDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';

const headCells = [
  { id: 'name', label: 'Product Name', align: 'left' },
  { id: 'unit', label: 'Unit', align: 'left' },
  { id: 'hsn_code', label: 'HSN/SAC', align: 'left' },
  { id: 'tax_rate', label: 'GST rate', align: 'left' },
  { id: 'unit_price', label: 'Default Rate', align: 'right' },
  { id: 'reorder_level', label: 'Alert Level', align: 'right' },
  { id: 'current_stock', label: 'Current Stock', align: 'right' },
  { id: 'status', label: 'Status', align: 'center', disableSort: true },
  { id: 'actions', label: 'Actions', align: 'center', disableSort: true }
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const InventoryPage = () => {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

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

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getItems();
      setItems(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch inventory catalog list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const processedItems = React.useMemo(() => {
    let result = [...items];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.hsn_code || '').toLowerCase().includes(q)
      );
    }

    if (orderBy) {
      result.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];
        
        if (orderBy === 'tax_rate') {
          valA = a.tax_rates?.percentage || 0;
          valB = b.tax_rates?.percentage || 0;
        }

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
  }, [items, searchQuery, orderBy, order]);

  const paginatedItems = React.useMemo(() => {
    const start = page * rowsPerPage;
    return processedItems.slice(start, start + rowsPerPage);
  }, [processedItems, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

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
      fetchItems();
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchItems();
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
        <SearchInput
          placeholder="Search by product name or HSN code..."
          value={searchQuery}
          onChange={setSearchQuery}
          sx={{ bgcolor: 'background.paper', borderRadius: 2, width: '100%' }}
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
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align}
                    sx={{ fontWeight: 700 }}
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
              {paginatedItems.map((item) => {
                const stock = parseFloat(item.current_stock || 0);
                const limit = parseFloat(item.reorder_level || 0);
                const isLow = stock <= limit;

                return (
                  <TableRow key={item.item_id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <HighlightText text={item.name} highlight={searchQuery} />
                    </TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <HighlightText text={item.hsn_code || '—'} highlight={searchQuery} />
                    </TableCell>
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

      {items.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={processedItems.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          component={Paper}
          sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0 }}
        />
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

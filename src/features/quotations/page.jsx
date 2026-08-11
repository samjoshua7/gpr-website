import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
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
  TablePagination,
  TableSortLabel,
  Tooltip,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

import PageToolbar from '../../components/layout/PageToolbar';
import { HighlightText } from '../../components/ui/HighlightText';
import { getQuotations, deleteQuotation } from './api';
import InvoiceDialog from '../salesInvoices/components/InvoiceDialog';
import QuotationDetailsDialog from './components/QuotationDetailsDialog';

import { formatDate } from '../../lib/formatDate';

const STATUS_MAP = {
  draft: { label: 'Draft', color: 'warning' },
  sent: { label: 'Sent', color: 'info' },
  converted: { label: 'Converted', color: 'success' },
  expired: { label: 'Expired', color: 'default' },
};

const headCells = [
  { id: 'quotation_no', label: 'Quotation No', align: 'left' },
  { id: 'quotation_date', label: 'Date', align: 'left' },
  { id: 'customer_name', label: 'Customer Name', align: 'left' },
  { id: 'invoice_type', label: 'Type', align: 'left' },
  { id: 'status', label: 'Status', align: 'center' },
  { id: 'total_amount', label: 'Estimated Amount', align: 'right' },
  { id: 'actions', label: 'Actions', align: 'center', disableSort: true },
];

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
});

const formatCurrency = (amount) => currencyFormatter.format(amount || 0);

export const QuotationsPage = () => {
  const [quotations, setQuotations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('quotation_date');
  const [order, setOrder] = useState('desc');

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedQuotationId, setSelectedQuotationId] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuotation, setEditQuotation] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [quotationToDelete, setQuotationToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchQuotationsData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuotations(searchQuery, statusFilter, true);
      setQuotations(data);
    } catch (err) {
      console.error('Failed to fetch quotations:', err);
      setError(err.message || 'Failed to load quotations');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchQuotationsData();
  }, [fetchQuotationsData]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleView = (quotation) => {
    setSelectedQuotationId(quotation.quotation_id);
    setDetailsOpen(true);
  };

  const handleCreate = () => {
    setEditQuotation(null);
    setDialogOpen(true);
  };

  const handleEdit = (quotation) => {
    setEditQuotation(quotation);
    setDialogOpen(true);
    setDetailsOpen(false);
  };

  const handleClone = (quotation) => {
    const cloned = {
      ...quotation,
      quotation_id: null,
      quotation_no: '',
      status: 'draft',
    };
    setEditQuotation(cloned);
    setDialogOpen(true);
    setDetailsOpen(false);
  };

  const handleDeleteClick = (quotation) => {
    setQuotationToDelete(quotation);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!quotationToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteQuotation(quotationToDelete.quotation_id);
      setDeleteOpen(false);
      setQuotationToDelete(null);
      fetchQuotationsData();
    } catch (err) {
      console.error('Failed to delete quotation:', err);
      setDeleteError(err.message || 'Failed to delete quotation');
    } finally {
      setDeleteLoading(false);
    }
  };

  const sortedQuotations = React.useMemo(() => {
    return [...quotations].sort((a, b) => {
      let aVal = a[orderBy];
      let bVal = b[orderBy];

      if (orderBy === 'customer_name') {
        aVal = a.customer_name || a.customers?.name || '';
        bVal = b.customer_name || b.customers?.name || '';
      }

      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  }, [quotations, orderBy, order]);

  const paginatedQuotations = React.useMemo(() => {
    return sortedQuotations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [sortedQuotations, page, rowsPerPage]);

  return (
    <Box>
      <PageToolbar
        title="Quotations"
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(0);
        }}
        searchPlaceholder="Search quotation #, customer..."
        actions={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            New Quotation
          </Button>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper variant="outlined">
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'action.hover' }}>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.align}
                      sx={{ fontWeight: 700 }}
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
                {paginatedQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <Typography color="text.secondary">No quotations found.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuotations.map((row) => {
                    const statusInfo = STATUS_MAP[row.status] || { label: row.status, color: 'default' };
                    const isConverted = row.status === 'converted';

                    return (
                      <TableRow key={row.quotation_id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            <HighlightText text={row.quotation_no} highlight={searchQuery} />
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(row.quotation_date)}</TableCell>
                        <TableCell>
                          <HighlightText
                            text={row.customer_name || row.customers?.name || 'N/A'}
                            highlight={searchQuery}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={row.invoice_type || 'NON_GST'}
                            size="small"
                            variant="outlined"
                            color={row.invoice_type === 'GST' ? 'primary' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={statusInfo.label}
                            size="small"
                            color={statusInfo.color}
                            sx={{ fontWeight: 700 }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700}>
                            {formatCurrency(row.total_amount)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => handleView(row)}>
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {!isConverted && (
                            <Tooltip title="Edit Quotation">
                              <IconButton size="small" color="primary" onClick={() => handleEdit(row)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Clone Quotation">
                            <IconButton size="small" color="info" onClick={() => handleClone(row)}>
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Quotation">
                            <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={quotations.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      )}

      {/* Dialogs */}
      <InvoiceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSaveSuccess={fetchQuotationsData}
        editQuotation={editQuotation}
        isQuotation={true}
      />

      <QuotationDetailsDialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        quotationId={selectedQuotationId}
        onEdit={handleEdit}
        onClone={handleClone}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Delete Quotation</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete quotation <strong>{quotationToDelete?.quotation_no}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={16} color="inherit" />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuotationsPage;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Paper,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import DeleteIcon from '@mui/icons-material/Delete';
import { getReceiptById, deleteReceipt } from '../api';
import { getCompanySettings } from '../../settings/api';
import { formatDate } from '../../../lib/formatDate';

const MODE_MAP = {
  cash: { label: 'Cash', color: 'success' },
  upi: { label: 'UPI / Digital', color: 'primary' },
  bank: { label: 'Bank Transfer', color: 'info' },
  cheque: { label: 'Cheque', color: 'secondary' },
};

export const ReceiptDetailsDialog = ({ open, onClose, receiptId, onEdit, onClone, onDeleteSuccess }) => {
  const [receipt, setReceipt] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceiptDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, settingsData] = await Promise.all([
          getReceiptById(receiptId),
          getCompanySettings(),
        ]);
        setReceipt(data);
        setCompanySettings(settingsData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load receipt details.');
      } finally {
        setLoading(false);
      }
    };

    if (open && receiptId) {
      fetchReceiptDetails();
    } else {
      setReceipt(null);
    }
  }, [open, receiptId]);

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amt) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amt || 0);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Payment Receipt Details</span>
        {receipt && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={MODE_MAP[receipt.mode]?.label || receipt.mode}
              color={MODE_MAP[receipt.mode]?.color || 'default'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
            {onClone && (
              <Tooltip title="Clone Receipt">
                <IconButton size="small" onClick={() => onClone(receipt)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onEdit && (
              <Tooltip title="Edit Receipt">
                <IconButton size="small" onClick={() => onEdit(receipt)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )}
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : receipt ? (
          <Paper id="printable-receipt-container" variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
              {companySettings?.company_name || 'G.P.R Offset Printers'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {companySettings?.address || ''}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">RECEIPT DATE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(receipt.receipt_date)}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">PAYMENT MODE</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{(receipt.mode || '').toUpperCase()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">RECEIVED FROM</Typography>
                <Typography variant="body1" sx={{ fontWeight: 700 }}>{receipt.customers?.name || 'Walk-in Customer'}</Typography>
              </Grid>
              {receipt.sales_invoices?.invoice_no && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">LINKED INVOICE</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Invoice #{receipt.sales_invoices.invoice_no}
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">AMOUNT RECEIVED</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: 'success.main' }}>
                    {formatCurrency(receipt.amount)}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Close</Button>
        {receipt && (
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print Receipt
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ReceiptDetailsDialog;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Grid,
  Divider,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import { getInvoiceById } from '../api';
import { getCompanySettings } from '../../settings/api';

const STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: 'error' },
  partial: { label: 'Partially Paid', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  void: { label: 'Voided', color: 'default' },
};

export const InvoiceDetailsDialog = ({ open, onClose, invoiceId, onEdit, onClone }) => {
  const [invoice, setInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    alert('WhatsApp integration coming soon.');
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, settingsData] = await Promise.all([
          getInvoiceById(invoiceId),
          getCompanySettings()
        ]);
        setInvoice(data);
        setCompanySettings(settingsData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    };

    if (open && invoiceId) {
      fetchInvoiceDetails();
    } else {
      setInvoice(null);
    }
  }, [open, invoiceId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const balanceDue = invoice ? (invoice.total_amount - invoice.amount_paid) : 0;

  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #printable-invoice-container, #printable-invoice-container * {
        visibility: visible;
      }
      #printable-invoice-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .MuiDialog-paper {
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        max-width: 100% !important;
      }
    }
  `;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ id: 'printable-invoice-container' }}>
      <style>{printStyles}</style>
      <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Invoice Details</span>
        {invoice && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={STATUS_MAP[invoice.status]?.label || invoice.status}
              color={STATUS_MAP[invoice.status]?.color || 'default'}
              size="small"
              sx={{ fontWeight: 600, mr: 1 }}
            />
            {onClone && (
              <Tooltip title="Clone Invoice">
                <IconButton size="small" onClick={() => onClone(invoice)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Edit Invoice">
              <IconButton size="small" onClick={() => onEdit && onEdit(invoice)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Print Invoice">
              <IconButton size="small" color="primary" onClick={handlePrint}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download PDF">
              <IconButton size="small" color="error" onClick={handlePrint}>
                <PictureAsPdfIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Send via WhatsApp">
              <IconButton size="small" color="success" onClick={handleWhatsApp}>
                <WhatsAppIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !invoice ? (
          <Typography>No invoice loaded.</Typography>
        ) : (
          <Box sx={{ p: { xs: 1, md: 3 } }}>
            {/* Professional Company Header */}
            {companySettings && (
              <Box sx={{ textAlign: 'center', mb: 4, borderBottom: '2px solid rgba(0,0,0,0.1)', pb: 2 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase' }}>
                  {companySettings.company_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {companySettings.address}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 0.5, flexWrap: 'wrap' }}>
                  {companySettings.phone && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Phone:</strong> {companySettings.phone}
                    </Typography>
                  )}
                  {companySettings.email && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Email:</strong> {companySettings.email}
                    </Typography>
                  )}
                  {companySettings.gstin && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>GSTIN:</strong> {companySettings.gstin}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Header info */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">
                  BILLED TO
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {invoice.customers?.name}
                </Typography>
                {invoice.customers?.identification_name && (
                   <Typography variant="body2" color="text.secondary">
                     {invoice.customers.identification_name}
                   </Typography>
                )}
                {invoice.customers?.gstin && (
                   <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                     GSTIN: <strong>{invoice.customers.gstin}</strong>
                   </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  Phone: {invoice.customers?.phone || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  Address: {invoice.customers?.address || '—'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  INVOICE DETAILS
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5, color: 'primary.main' }}>
                  {invoice.invoice_no}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Date: <strong>{formatDate(invoice.invoice_date)}</strong>
                </Typography>
                {invoice.job_cards && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Job Ref: <em>{invoice.job_cards.description.substring(0, 30)}...</em>
                  </Typography>
                )}
                {invoice.invoice_type === 'GST' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Customer Type: <strong>{invoice.customer_type}</strong>
                  </Typography>
                )}
              </Grid>
            </Grid>

            {/* Line Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                    {invoice.invoice_type === 'GST' && <TableCell sx={{ fontWeight: 700 }}>HSN/SAC</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right">Qty</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Unit Price</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Discount</TableCell>
                    {invoice.invoice_type === 'GST' && <TableCell sx={{ fontWeight: 700 }} align="right">GST %</TableCell>}
                    {invoice.invoice_type === 'GST' && <TableCell sx={{ fontWeight: 700 }} align="right">GST Amt</TableCell>}
                    <TableCell sx={{ fontWeight: 700 }} align="right">Line Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items?.map((item) => (
                    <TableRow key={item.invoice_item_id}>
                      <TableCell sx={{ py: 1.25 }}>{item.description}</TableCell>
                      {invoice.invoice_type === 'GST' && <TableCell>{item.hsn_code || '—'}</TableCell>}
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.discount_amount)}</TableCell>
                      {invoice.invoice_type === 'GST' && <TableCell align="right">{item.gst_rate}%</TableCell>}
                      {invoice.invoice_type === 'GST' && <TableCell align="right">{formatCurrency(item.tax_amount)}</TableCell>}
                      <TableCell align="right" sx={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

             {/* Totals & Notes */}
             <Grid container spacing={3} sx={{ mt: 1 }}>
               <Grid item xs={12} md={6}>
                 {invoice.delivery_details && (
                   <Box sx={{ mb: 2 }}>
                     <Typography variant="caption" color="text.secondary" display="block">
                       DELIVERY DETAILS
                     </Typography>
                     <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1, whiteSpace: 'pre-wrap', border: '1px dashed rgba(0,0,0,0.1)' }}>
                       {invoice.delivery_details}
                     </Typography>
                   </Box>
                 )}
                 {invoice.notes && (
                   <Box>
                     <Typography variant="caption" color="text.secondary" display="block">
                       NOTES & TERMS
                     </Typography>
                     <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1.5, borderRadius: 1, whiteSpace: 'pre-wrap', border: '1px dashed rgba(0,0,0,0.1)' }}>
                       {invoice.notes}
                     </Typography>
                   </Box>
                 )}
               </Grid>
               <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Subtotal (Gross):</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 600 }}>
                     {formatCurrency(invoice.items?.reduce((sum, item) => sum + (parseFloat(item.quantity) * parseFloat(item.unit_price) || 0), 0))}
                   </Typography>
                 </Box>
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Total Discount:</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                     - {formatCurrency(invoice.items?.reduce((sum, item) => sum + (parseFloat(item.discount_amount) || 0), 0))}
                   </Typography>
                 </Box>
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Taxable Value:</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 700 }}>
                     {formatCurrency(invoice.items?.reduce((sum, item) => sum + (Math.max(0, (parseFloat(item.quantity) * parseFloat(item.unit_price)) - parseFloat(item.discount_amount)) || 0), 0))}
                   </Typography>
                 </Box>

                 {invoice.invoice_type === 'GST' && (
                   <React.Fragment>
                     <Box sx={{ display: 'flex', width: 280 }}>
                       <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>CGST (Central Tax):</Typography>
                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                         {formatCurrency(
                           invoice.customers?.gstin && companySettings?.gstin &&
                           invoice.customers.gstin.substring(0, 2) !== companySettings.gstin.substring(0, 2)
                             ? 0
                             : (parseFloat(invoice.gst_amount) / 2 || 0)
                         )}
                       </Typography>
                     </Box>
                     <Box sx={{ display: 'flex', width: 280 }}>
                       <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>SGST (State Tax):</Typography>
                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                         {formatCurrency(
                           invoice.customers?.gstin && companySettings?.gstin &&
                           invoice.customers.gstin.substring(0, 2) !== companySettings.gstin.substring(0, 2)
                             ? 0
                             : (parseFloat(invoice.gst_amount) / 2 || 0)
                         )}
                       </Typography>
                     </Box>
                     <Box sx={{ display: 'flex', width: 280 }}>
                       <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>IGST (Integrated Tax):</Typography>
                       <Typography variant="body2" sx={{ fontWeight: 600 }}>
                         {formatCurrency(
                           invoice.customers?.gstin && companySettings?.gstin &&
                           invoice.customers.gstin.substring(0, 2) !== companySettings.gstin.substring(0, 2)
                             ? (parseFloat(invoice.gst_amount) || 0)
                             : 0
                         )}
                       </Typography>
                     </Box>
                   </React.Fragment>
                 )}

                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Round Off:</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                     {formatCurrency(
                       parseFloat(invoice.total_amount) - 
                       ((invoice.items?.reduce((sum, item) => sum + (Math.max(0, (parseFloat(item.quantity) * parseFloat(item.unit_price)) - parseFloat(item.discount_amount)) || 0), 0) || 0) + (parseFloat(invoice.gst_amount) || 0))
                     )}
                   </Typography>
                 </Box>

                 <Divider sx={{ width: 280, my: 0.5 }} />
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1, fontWeight: 700 }}>Invoice Total:</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 700 }}>{formatCurrency(invoice.total_amount)}</Typography>
                 </Box>
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>Amount Paid:</Typography>
                   <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                     {formatCurrency(invoice.amount_paid)}
                   </Typography>
                 </Box>
                 <Divider sx={{ width: 280, my: 0.5 }} />
                 <Box sx={{ display: 'flex', width: 280 }}>
                   <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800 }}>Balance Due:</Typography>
                   <Typography variant="h6" sx={{ fontWeight: 800, color: balanceDue > 0 ? 'error.main' : 'text.primary' }}>
                     {formatCurrency(balanceDue)}
                   </Typography>
                 </Box>
               </Grid>
             </Grid>
           </Box>
        )}
      </DialogContent>
      <DialogActions className="no-print" sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InvoiceDetailsDialog;

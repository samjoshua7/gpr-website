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
  Select,
  MenuItem,
  Paper,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import { getInvoiceById } from '../api';
import { getCompanySettings } from '../../settings/api';
import { InvoiceDocument } from './InvoiceDocument';
import { InvoiceNotesPanel } from './InvoiceNotesPanel';
import { getSavedDirectoryHandle } from '../../../lib/savedLocation';
import { generateInvoicePdf } from '../../../lib/pdfGenerator';

const STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: 'error' },
  partial: { label: 'Partially Paid', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  void: { label: 'Voided', color: 'default' },
};

export const InvoiceDetailsDialog = ({ open, onClose, invoiceId, onEdit, onClone }) => {
  const [invoice, setInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    try {
      setDownloadingPdf(true);

      // Generate vector PDF using selected paper size
      const pdfBlob = await generateInvoicePdf(invoice, companySettings, paperSize);
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF document.');
      }

      const cleanCustomerName = (invoice.customer_name || invoice.customers?.name || 'Customer').replace(/[/\\?%*:|"<>]/g, '');
      const cleanInvoiceNo = (invoice.invoice_no || 'INVOICE').replace(/[/\\?%*:|"<>]/g, '-');
      const fileName = `${cleanInvoiceNo} ${cleanCustomerName}.pdf`;

      // Try File System Access API if supported (Chrome/Edge)
      if ('showSaveFilePicker' in window) {
        try {
          let startIn = undefined;
          try {
            const savedHandle = await getSavedDirectoryHandle();
            if (savedHandle && (await savedHandle.queryPermission({ mode: 'readwrite' })) === 'granted') {
              startIn = savedHandle;
            }
          } catch (err) {
            console.warn('Saved directory handle permission not available', err);
          }

          const filePickerOptions = {
            suggestedName: fileName,
            types: [
              {
                description: 'PDF Document',
                accept: { 'application/pdf': ['.pdf'] },
              },
            ],
          };
          if (startIn) {
            filePickerOptions.startIn = startIn;
          }

          const fileHandle = await window.showSaveFilePicker(filePickerOptions);
          const writable = await fileHandle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
          return;
        } catch (err) {
          if (err.name === 'AbortError') return; // User canceled save dialog
          console.warn('Native save dialog failed or dismissed, falling back to download link', err);
        }
      }

      // Standard browser download fallback (Firefox/Safari)
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const custPhone = invoice.customers?.phone || '';
    const message = `Hello ${invoice.customer_name || invoice.customers?.name || ''}, here is your Invoice ${invoice.invoice_no} for amount INR ${invoice.total_amount}.`;
    const encoded = encodeURIComponent(message);
    const url = custPhone ? `https://wa.me/${custPhone.replace(/[^0-9]/g, '')}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, settingsData] = await Promise.all([
          getInvoiceById(invoiceId),
          getCompanySettings(),
        ]);
        setInvoice(data);
        setCompanySettings(settingsData);
        if (settingsData?.default_invoice_paper_size) {
          setPaperSize(settingsData.default_invoice_paper_size);
        }
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <style>{printStyles}</style>
      <DialogTitle className="no-print" sx={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Invoice Details</span>
        {invoice && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Select
              size="small"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              sx={{ height: 32, fontSize: '0.85rem', bgcolor: 'background.paper', mr: 1 }}
            >
              <MenuItem value="A4">A4 Paper</MenuItem>
              <MenuItem value="A5">A5 Paper</MenuItem>
            </Select>

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
              <IconButton size="small" color="error" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon fontSize="small" />}
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
      <DialogContent dividers sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f4f6f8' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : !invoice ? (
          <Typography>No invoice loaded.</Typography>
        ) : (
          <Grid container spacing={3}>
            {/* Left Column (md=8): Printable Invoice Document styled as a page */}
            <Grid item xs={12} md={8}>
              <Paper elevation={2} sx={{ p: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <InvoiceDocument
                  invoice={invoice}
                  companySettings={companySettings}
                  paperSize={paperSize}
                />
              </Paper>
            </Grid>

            {/* Right Column (md=4): Screen-only internal notes panel styled as sticky note */}
            <Grid item xs={12} md={4} className="no-print">
              <InvoiceNotesPanel
                invoice={invoice}
                onNotesUpdated={(updated) => setInvoice(updated)}
              />
            </Grid>
          </Grid>
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

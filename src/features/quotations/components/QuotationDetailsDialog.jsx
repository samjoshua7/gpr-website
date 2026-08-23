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
  Snackbar,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import TransformIcon from '@mui/icons-material/Transform';

import { useNavigate } from 'react-router-dom';
import { getQuotationById, convertQuotationToInvoice, updateQuotationNotes } from '../api';
import { getCompanySettings } from '../../settings/api';
import { QuotationDocument } from './QuotationDocument';
import { InvoiceNotesPanel } from '../../salesInvoices/components/InvoiceNotesPanel';
import { saveExportFile, formatExportFileName } from '../../../lib/savedLocation';
import { generateInvoicePdf } from '../../../lib/pdfGenerator';
import { generateInvoiceJpg } from '../../../lib/imageGenerator';
import { useAuth } from '../../../hooks/useAuth';

const STATUS_MAP = {
  draft: { label: 'Draft', color: 'warning' },
  sent: { label: 'Sent', color: 'info' },
  converted: { label: 'Converted', color: 'success' },
  expired: { label: 'Expired', color: 'default' },
};

export const QuotationDetailsDialog = ({ open, onClose, quotationId, onEdit, onClone }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isStakeholder = profile?.role === 'STAKEHOLDER';
  const [quotation, setQuotation] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');
  const [customerView, setCustomerView] = useState(true);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportingJpg, setExportingJpg] = useState(false);
  const [converting, setConverting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState(null);
  const [lastExportedBlob, setLastExportedBlob] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;

    try {
      setDownloadingPdf(true);
      const containerEl = document.getElementById('printable-quotation-container');
      const pdfBlob = await generateInvoicePdf(containerEl || quotation, companySettings, paperSize);
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF document.');
      }

      setLastExportedBlob(pdfBlob);
      const fileName = formatExportFileName(
        {
          invoice_no: quotation.quotation_no,
          invoice_date: quotation.quotation_date,
          customer_name: quotation.customer_name || quotation.customers?.name,
        },
        'pdf'
      );

      const result = await saveExportFile({
        fileBlob: pdfBlob,
        fileName,
        subfolder: 'pdf',
      });

      if (result.success) {
        setToastMessage(`Saved PDF to ${result.path}`);
        setToastOpen(true);
      }
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!quotation) return;

    try {
      setExportingJpg(true);
      const containerEl = document.getElementById('printable-quotation-container');
      if (!containerEl) {
        throw new Error('Printable quotation container element not found.');
      }

      const jpgBlob = await generateInvoiceJpg(containerEl, 2.5, 0.95);
      setLastExportedBlob(jpgBlob);
      const fileName = formatExportFileName(
        {
          invoice_no: quotation.quotation_no,
          invoice_date: quotation.quotation_date,
          customer_name: quotation.customer_name || quotation.customers?.name,
        },
        'jpg'
      );

      const result = await saveExportFile({
        fileBlob: jpgBlob,
        fileName,
        subfolder: 'jpg',
      });

      if (result.success) {
        setToastMessage(`Saved JPG to ${result.path}`);
        setToastOpen(true);
      }
    } catch (err) {
      console.error('JPG export error:', err);
      alert('Failed to generate JPG: ' + err.message);
    } finally {
      setExportingJpg(false);
    }
  };

  const handleWhatsApp = () => {
    if (!quotation) return;
    const custPhone = quotation.customers?.phone || '';
    const cleanPhone = custPhone.replace(/[^0-9]/g, '');
    const phoneParam = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const custName = quotation.customer_name || quotation.customers?.name || 'Customer';
    const msg = `Hello ${custName},\nHere are the details of your Quotation *${quotation.quotation_no}* for ₹${Number(quotation.total_amount || 0).toFixed(2)}.\nThank you! - ${companySettings?.company_name || 'G.P.R Offset Printers'}`;
    const url = phoneParam ? `https://wa.me/${phoneParam}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const handleConvertToInvoice = async () => {
    if (!quotation) return;
    const confirmConvert = window.confirm(
      `Are you sure you want to convert Quotation ${quotation.quotation_no} into an official Sales Invoice?`
    );
    if (!confirmConvert) return;

    try {
      setConverting(true);
      const newInvoice = await convertQuotationToInvoice(quotation.quotation_id);
      onClose();
      navigate('/invoices', { state: { highlightInvoiceId: newInvoice.invoice_id } });
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setConverting(false);
    }
  };

  const loadDetails = async () => {
    if (!quotationId || !open) return;
    setLoading(true);
    setError(null);
    try {
      const [qData, settings] = await Promise.all([
        getQuotationById(quotationId),
        getCompanySettings(),
      ]);
      setQuotation(qData);
      setCompanySettings(settings);
      if (settings?.default_invoice_paper_size) {
        setPaperSize(settings.default_invoice_paper_size);
      }
    } catch (err) {
      console.error('Failed to load quotation details:', err);
      setError('Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && quotationId) {
      loadDetails();
    } else {
      setQuotation(null);
    }
  }, [quotationId, open]);

  const printStyles = `
    @page {
      size: ${paperSize === 'A5' ? 'A5 portrait' : 'A4 portrait'};
      margin: ${paperSize === 'A5' ? '6mm' : '8mm'};
    }
    @media print {
      html, body {
        width: 100% !important;
        height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden;
      }
      #printable-quotation-container, #printable-quotation-container * {
        visibility: visible;
      }
      #printable-quotation-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-sizing: border-box !important;
        border: none !important;
        box-shadow: none !important;
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

  const isConverted = quotation?.status === 'converted';

  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <style>{printStyles}</style>

      <DialogTitle
        className="no-print"
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          <Typography variant="h6" fontWeight={800}>
            {quotation?.quotation_no ? `Quotation ${quotation.quotation_no}` : 'Quotation Details'}
          </Typography>
          {quotation?.status && (
            <Chip
              label={STATUS_MAP[quotation.status]?.label || quotation.status}
              color={STATUS_MAP[quotation.status]?.color || 'default'}
              size="small"
              sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}
            />
          )}
          {quotation?.invoice_type && (
            <Chip
              label={quotation.invoice_type}
              variant="outlined"
              size="small"
              color={quotation.invoice_type === 'GST' ? 'primary' : 'default'}
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {quotation && (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {!isConverted && (
              <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Convert to Invoice'}>
                <span>
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <TransformIcon />}
                    onClick={handleConvertToInvoice}
                    disabled={isStakeholder || converting}
                    sx={{ textTransform: 'none', fontWeight: 700, height: 32, ...(isStakeholder ? { color: 'text.disabled', bgcolor: 'action.disabledBackground' } : {}) }}
                  >
                    Convert to Invoice
                  </Button>
                </span>
              </Tooltip>
            )}

            {onClone && (
              <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Clone Quotation'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={isStakeholder}
                    onClick={() => onClone(quotation)}
                    sx={isStakeholder ? { color: 'text.disabled' } : {}}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {!isConverted && onEdit && (
              <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Edit Quotation'}>
                <span>
                  <IconButton
                    size="small"
                    disabled={isStakeholder}
                    onClick={() => onEdit(quotation)}
                    sx={isStakeholder ? { color: 'text.disabled' } : {}}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={customerView}
                  onChange={(e) => setCustomerView(e.target.checked)}
                  color="primary"
                  sx={{ p: 0.5 }}
                />
              }
              label={
                <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: 'nowrap', userSelect: 'none' }}>
                  Customer View
                </Typography>
              }
              sx={{ ml: 0.5, mr: 0.5 }}
            />

            <Select
              size="small"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              sx={{ height: 32, fontSize: '0.75rem', fontWeight: 600, ml: 0.5 }}
            >
              <MenuItem value="A4">A4 Sheet</MenuItem>
              <MenuItem value="A5">A5 Sheet</MenuItem>
            </Select>

            <Tooltip title="Print Quotation">
              <IconButton size="small" color="primary" onClick={handlePrint}>
                <PrintIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Download PDF">
              <IconButton size="small" color="primary" onClick={handleDownloadPdf} disabled={downloadingPdf}>
                {downloadingPdf ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon fontSize="small" />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Download JPG">
              <IconButton size="small" color="primary" onClick={handleDownloadJpg} disabled={exportingJpg}>
                {exportingJpg ? <CircularProgress size={18} color="inherit" /> : <ImageIcon fontSize="small" />}
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
        ) : !quotation ? (
          <Typography>No quotation loaded.</Typography>
        ) : (
          <Box>
            {isConverted && (
              <Alert severity="info" sx={{ mb: 3 }}>
                This quotation has been converted into an official Sales Invoice. It is now read-only.
              </Alert>
            )}

            <Grid container spacing={3}>
              {/* Left Column (md=8): Printable Quotation Document */}
              <Grid item xs={12} md={8}>
                <Paper id="printable-quotation-container" elevation={2} sx={{ p: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <QuotationDocument
                    quotation={quotation}
                    companySettings={companySettings}
                    paperSize={paperSize}
                    isCustomerView={customerView}
                  />
                </Paper>
              </Grid>

              {/* Right Column (md=4): Screen-only internal notes panel */}
              <Grid item xs={12} md={4} className="no-print">
                <InvoiceNotesPanel
                  invoice={quotation}
                  onNotesUpdated={async (updated) => {
                    if (isStakeholder) return;
                    try {
                      await updateQuotationNotes(quotation.quotation_id, updated.notes);
                      setQuotation((prev) => ({ ...prev, notes: updated.notes }));
                      setToastMessage('Quotation notes updated.');
                      setToastOpen(true);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                />
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

      <Snackbar
        open={toastOpen}
        autoHideDuration={6000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        action={
          lastExportedBlob ? (
            <Button
              color="secondary"
              size="small"
              variant="contained"
              onClick={() => {
                const url = URL.createObjectURL(lastExportedBlob);
                window.open(url, '_blank');
              }}
              sx={{ fontWeight: 700, textTransform: 'none', ml: 1 }}
            >
              Open File
            </Button>
          ) : null
        }
      />
    </Dialog>
  );
};

export default QuotationDetailsDialog;

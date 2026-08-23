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
  Autocomplete,
  TextField,
  DialogContentText,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageIcon from '@mui/icons-material/Image';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import BlockIcon from '@mui/icons-material/Block';
import DeleteIcon from '@mui/icons-material/Delete';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import Snackbar from '@mui/material/Snackbar';
import { getInvoiceById, getInvoiceTaskProgress, linkInvoiceToJobCard, unlinkInvoiceFromJobCard } from '../api';
import { getJobCards, getJobCardsByCustomer } from '../../jobCards/api';
import { getCompanySettings } from '../../settings/api';
import { InvoiceDocument } from './InvoiceDocument';
import { InvoiceNotesPanel } from './InvoiceNotesPanel';
import { formatExportFileName, saveExportFile } from '../../../lib/savedLocation';
import { generateInvoicePdf } from '../../../lib/pdfGenerator';
import { generateInvoiceJpg } from '../../../lib/imageGenerator';
import { InvoiceProgressBar } from '../../../components/ui/InvoiceProgressBar';
import { useAuth } from '../../../hooks/useAuth';

const STATUS_MAP = {
  unpaid: { label: 'Unpaid', color: 'error' },
  partial: { label: 'Partially Paid', color: 'warning' },
  paid: { label: 'Paid', color: 'success' },
  void: { label: 'Voided', color: 'default' },
};

export const InvoiceDetailsDialog = ({
  open,
  onClose,
  invoiceId,
  onEdit,
  onClone,
  onVoid,
  onDelete,
}) => {
  const { profile } = useAuth();
  const isStakeholder = profile?.role === 'STAKEHOLDER';

  const [invoice, setInvoice] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');
  const [customerView, setCustomerView] = useState(true);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [exportingJpg, setExportingJpg] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState(null);

  const [linkJobDialogOpen, setLinkJobDialogOpen] = useState(false);
  const [jobCardsList, setJobCardsList] = useState([]);
  const [jobCardsLoading, setJobCardsLoading] = useState(false);
  const [selectedJobToLink, setSelectedJobToLink] = useState(null);
  const [linkJobLoading, setLinkJobLoading] = useState(false);
  const [linkJobError, setLinkJobError] = useState(null);

  const [unlinkJobDialogOpen, setUnlinkJobDialogOpen] = useState(false);
  const [unlinkJobLoading, setUnlinkJobLoading] = useState(false);
  const [unlinkJobError, setUnlinkJobError] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!invoice) return;

    try {
      setDownloadingPdf(true);
      const pdfBlob = await generateInvoicePdf(invoice, companySettings, paperSize);
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF document.');
      }

      const fileName = formatExportFileName(invoice, 'pdf');
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
      alert('Failed to export PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadJpg = async () => {
    if (!invoice) return;

    try {
      setExportingJpg(true);
      const containerEl = document.getElementById('printable-invoice-container');
      if (!containerEl) {
        throw new Error('Printable invoice container element not found.');
      }

      const jpgBlob = await generateInvoiceJpg(containerEl, 2.5, 0.95);
      const fileName = formatExportFileName(invoice, 'jpg');
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
      console.error('JPG generation error:', err);
      alert('Failed to export JPG: ' + err.message);
    } finally {
      setExportingJpg(false);
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

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;
    setLoading(true);
    setError(null);
    try {
      const [data, settingsData, progressData] = await Promise.all([
        getInvoiceById(invoiceId),
        getCompanySettings(),
        getInvoiceTaskProgress([invoiceId]),
      ]);
      setInvoice(data);
      setCompanySettings(settingsData);
      setTaskStatuses(progressData[invoiceId] || []);
      if (settingsData?.production_workflow) {
        setWorkflow(settingsData.production_workflow);
      }
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

  useEffect(() => {
    if (open && invoiceId) {
      fetchInvoiceDetails();
    } else {
      setInvoice(null);
      setTaskStatuses([]);
    }
  }, [open, invoiceId]);

  useEffect(() => {
    if (linkJobDialogOpen) {
      const fetchJobCards = async () => {
        setJobCardsLoading(true);
        setLinkJobError(null);
        try {
          let data = [];
          if (invoice?.customer_id) {
            data = await getJobCardsByCustomer(invoice.customer_id);
          } else {
            data = await getJobCards();
          }

          // Filter strictly: unbilled or currently linked to this invoice
          const availableJobs = (data || []).filter(
            (job) => !job.is_billed || job.job_id === invoice.job_id
          );
          setJobCardsList(availableJobs);
        } catch (err) {
          console.error(err);
          setLinkJobError('Failed to load Job Cards.');
        } finally {
          setJobCardsLoading(false);
        }
      };
      fetchJobCards();
    }
  }, [linkJobDialogOpen, invoice?.customer_id, invoice?.job_id]);

  const handleConfirmLinkJob = async () => {
    if (!selectedJobToLink || !invoice) return;
    setLinkJobLoading(true);
    setLinkJobError(null);
    try {
      await linkInvoiceToJobCard(invoice.invoice_id, selectedJobToLink.job_id);
      await fetchInvoiceDetails();
      setLinkJobDialogOpen(false);
      setSelectedJobToLink(null);
      setToastMessage(`Linked Job Card JC-${String(selectedJobToLink.job_number || 0).padStart(4, '0')} to invoice.`);
      setToastOpen(true);
    } catch (err) {
      console.error(err);
      setLinkJobError(err.message || 'Failed to link Job Card.');
    } finally {
      setLinkJobLoading(false);
    }
  };

  const handleConfirmUnlinkJob = async () => {
    if (!invoice) return;
    setUnlinkJobLoading(true);
    setUnlinkJobError(null);
    try {
      await unlinkInvoiceFromJobCard(invoice.invoice_id);
      await fetchInvoiceDetails();
      setUnlinkJobDialogOpen(false);
      setToastMessage('Unlinked Job Card from invoice.');
      setToastOpen(true);
    } catch (err) {
      console.error(err);
      setUnlinkJobError(err.message || 'Failed to unlink Job Card.');
    } finally {
      setUnlinkJobLoading(false);
    }
  };

  const printStyles = `
    @page {
      size: ${paperSize === 'A5' ? 'A5' : 'A4'};
      margin: 10mm;
    }
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
        width: ${paperSize === 'A5' ? '148mm' : '210mm'};
        max-width: 100%;
        margin: 0 auto;
        padding: 0;
        box-sizing: border-box;
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
            {invoice?.invoice_no ? `Invoice ${invoice.invoice_no}` : 'Invoice Details'}
          </Typography>
          {invoice?.status && (
            <Chip
              label={STATUS_MAP[invoice.status]?.label || invoice.status}
              color={STATUS_MAP[invoice.status]?.color || 'default'}
              size="small"
              sx={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem' }}
            />
          )}
          {invoice?.invoice_type && (
            <Chip
              label={invoice.invoice_type}
              variant="outlined"
              size="small"
              color={invoice.invoice_type === 'GST' ? 'primary' : 'default'}
              sx={{ fontWeight: 700, fontSize: '0.7rem' }}
            />
          )}
        </Box>

        {invoice && (
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            {!isStakeholder && onClone && (
              <Tooltip title="Clone Invoice">
                <IconButton size="small" onClick={() => onClone(invoice)}>
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!isStakeholder && onEdit && (
              <Tooltip title="Edit Invoice">
                <IconButton size="small" onClick={() => onEdit && onEdit(invoice)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {!isStakeholder && onVoid && (
              <Tooltip title={invoice.status === 'void' ? 'Already Void' : 'Void Invoice'}>
                <span>
                  <IconButton
                    size="small"
                    color="warning"
                    disabled={invoice.status === 'void'}
                    onClick={() => {
                      onClose();
                      onVoid(invoice);
                    }}
                  >
                    <BlockIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            )}
            {!isStakeholder && onDelete && (
              <Tooltip title="Delete Invoice">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    onClose();
                    onDelete(invoice);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
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

            <Tooltip title="Print Invoice">
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
        ) : !invoice ? (
          <Typography>No invoice loaded.</Typography>
        ) : (
          <Box>
            {/* Job Card Linked Progress Banner */}
            {invoice?.job_cards ? (
              <Paper className="no-print" elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      Production Progress: JC-{String(invoice.job_cards.job_number || 0).padStart(4, '0')}
                    </Typography>
                    <Chip
                      label={invoice.job_cards.status || 'New Orders'}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  </Box>
                  {!isStakeholder && (
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      startIcon={<LinkOffIcon />}
                      onClick={() => setUnlinkJobDialogOpen(true)}
                      sx={{ textTransform: 'none', fontWeight: 600, height: 26, fontSize: '0.75rem' }}
                    >
                      Unlink Job Card
                    </Button>
                  )}
                </Box>
                <InvoiceProgressBar
                  taskStatuses={[{ status: invoice.job_cards.status || 'New Orders', product_name: invoice.job_cards.description }]}
                  workflow={workflow}
                  height={12}
                  showLabel
                />
              </Paper>
            ) : (
              <Paper className="no-print" elevation={0} sx={{ p: 1.5, mb: 3, bgcolor: '#ffffff', borderRadius: 2, border: '1px dashed', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No Job Card currently linked to this invoice.
                </Typography>
                {!isStakeholder && (
                  <Button
                    size="small"
                    variant="outlined"
                    color="primary"
                    startIcon={<LinkIcon />}
                    onClick={() => setLinkJobDialogOpen(true)}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    Link to Job Card
                  </Button>
                )}
              </Paper>
            )}

            <Grid container spacing={3}>
              {/* Left Column (md=8): Printable Invoice Document styled as a page */}
              <Grid item xs={12} md={8}>
                <Paper id="printable-invoice-container" elevation={2} sx={{ p: 1, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  <InvoiceDocument
                    invoice={invoice}
                    companySettings={companySettings}
                    paperSize={paperSize}
                    isCustomerView={customerView}
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
          </Box>
        )}
      </DialogContent>
      <DialogActions className="no-print" sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Close
        </Button>
      </DialogActions>

      {/* Manual Link Job Card Dialog */}
      <Dialog open={linkJobDialogOpen} onClose={() => !linkJobLoading && setLinkJobDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="primary" /> Link Job Card
        </DialogTitle>
        <DialogContent>
          {linkJobError && <Alert severity="error" sx={{ mb: 2 }}>{linkJobError}</Alert>}
          <DialogContentText sx={{ mb: 2 }}>
            Select an unlinked Job Card for <strong>{invoice?.customers?.name || 'this customer'}</strong> to link with Invoice <strong>{invoice?.invoice_no}</strong> (newest first):
          </DialogContentText>
          <Autocomplete
            options={jobCardsList}
            loading={jobCardsLoading}
            getOptionLabel={(option) => {
              if (!option) return '';
              const jcNo = `JC-${String(option.job_number || 0).padStart(4, '0')}`;
              const cust = option.customers?.name || 'Customer';
              const stage = option.status || 'New Orders';
              return `${jcNo} • ${cust} • [${stage}]`;
            }}
            value={selectedJobToLink}
            onChange={(_, val) => setSelectedJobToLink(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Job Card"
                placeholder="Search job number or customer..."
                margin="dense"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {jobCardsLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLinkJobDialogOpen(false)} disabled={linkJobLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLinkJob}
            variant="contained"
            disabled={linkJobLoading || !selectedJobToLink}
          >
            {linkJobLoading ? 'Linking...' : 'Link Job Card'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Job Card Confirmation Dialog */}
      <Dialog open={unlinkJobDialogOpen} onClose={() => !unlinkJobLoading && setUnlinkJobDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Unlink Job Card</DialogTitle>
        <DialogContent>
          {unlinkJobError && <Alert severity="error" sx={{ mb: 2 }}>{unlinkJobError}</Alert>}
          <DialogContentText>
            Are you sure you want to unlink Job Card <strong>JC-{String(invoice?.job_cards?.job_number || 0).padStart(4, '0')}</strong> from Invoice <strong>{invoice?.invoice_no}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUnlinkJobDialogOpen(false)} disabled={unlinkJobLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmUnlinkJob} color="warning" variant="contained" disabled={unlinkJobLoading}>
            {unlinkJobLoading ? 'Unlinking...' : 'Confirm Unlink'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        message={toastMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Dialog>
  );
};

export default InvoiceDetailsDialog;

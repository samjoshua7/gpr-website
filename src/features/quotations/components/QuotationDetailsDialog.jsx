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
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PrintIcon from '@mui/icons-material/Print';
import TransformIcon from '@mui/icons-material/Transform';

import { useNavigate } from 'react-router-dom';
import { getQuotationById, convertQuotationToInvoice } from '../api';
import { getCompanySettings } from '../../settings/api';
import { QuotationDocument } from './QuotationDocument';
import { saveExportFile, formatExportFileName } from '../../../lib/savedLocation';
import { generateInvoicePdf } from '../../../lib/pdfGenerator';

const STATUS_MAP = {
  draft: { label: 'Draft', color: 'warning' },
  sent: { label: 'Sent', color: 'info' },
  converted: { label: 'Converted', color: 'success' },
  expired: { label: 'Expired', color: 'default' },
};

export const QuotationDetailsDialog = ({ open, onClose, quotationId, onEdit, onClone }) => {
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [paperSize, setPaperSize] = useState('A4');
  const [loading, setLoading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!quotation) return;

    try {
      setDownloadingPdf(true);
      const pdfBlob = await generateInvoicePdf(quotation, companySettings, paperSize);
      if (!pdfBlob) {
        throw new Error('Failed to generate PDF document.');
      }

      const fileName = formatExportFileName({
        invoice_no: quotation.quotation_no,
        invoice_date: quotation.quotation_date,
        customer_name: quotation.customer_name || quotation.customers?.name,
      }, 'pdf');

      await saveExportFile({
        fileBlob: pdfBlob,
        fileName,
        subfolder: 'pdf',
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
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
      navigate('/dashboard/invoices', { state: { highlightInvoiceId: newInvoice.invoice_id } });
    } catch (err) {
      console.error('Failed to convert quotation:', err);
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setConverting(false);
    }
  };

  useEffect(() => {
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

    loadDetails();
  }, [quotationId, open]);

  const printStyles = `
    @media print {
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
        width: 100%;
        margin: 0;
        padding: 0;
      }
      @page {
        size: ${paperSize};
        margin: 10mm;
      }
    }
  `;

  const isConverted = quotation?.status === 'converted';

  return (
    <React.Fragment>
      <style>{printStyles}</style>

      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1.5}>
              <Typography variant="h6" fontWeight={800}>
                {quotation?.quotation_no || 'Quotation Details'}
              </Typography>
              {quotation && (
                <Chip
                  label={STATUS_MAP[quotation.status]?.label || quotation.status}
                  color={STATUS_MAP[quotation.status]?.color || 'default'}
                  size="small"
                  sx={{ fontWeight: 700 }}
                />
              )}
            </Box>

            <Box display="flex" gap={1} className="no-print">
              <Tooltip title="Print Quotation">
                <IconButton onClick={handlePrint} color="primary">
                  <PrintIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Save as PDF">
                <IconButton onClick={handleDownloadPdf} color="primary" disabled={downloadingPdf}>
                  {downloadingPdf ? <CircularProgress size={24} /> : <PictureAsPdfIcon />}
                </IconButton>
              </Tooltip>

              <Tooltip title="Clone Quotation">
                <IconButton onClick={() => onClone && onClone(quotation)} color="primary">
                  <ContentCopyIcon />
                </IconButton>
              </Tooltip>

              {!isConverted && (
                <Tooltip title="Edit Quotation">
                  <IconButton onClick={() => onEdit && onEdit(quotation)} color="primary">
                    <EditIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : quotation ? (
            <Box>
              {isConverted && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  This quotation has been converted into an official Sales Invoice. It is now read-only.
                </Alert>
              )}
              <QuotationDocument quotation={quotation} companySettings={companySettings} paperSize={paperSize} />
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions>
          {!isConverted && (
            <Button
              variant="contained"
              color="success"
              startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <TransformIcon />}
              onClick={handleConvertToInvoice}
              disabled={converting || !quotation}
            >
              Convert to Invoice
            </Button>
          )}
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default QuotationDetailsDialog;

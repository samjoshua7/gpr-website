import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Divider,
} from '@mui/material';
import { amountInWords } from '../../../lib/amountInWords';
import { formatDate } from '../../../lib/formatDate';

const PAPER_CONFIG = {
  A4: { widthMm: 210, heightMm: 297, baseFontPx: 13, tableFontPx: 12.5, padding: 4, maxWidth: '850px' },
  A5: { widthMm: 148, heightMm: 210, baseFontPx: 11, tableFontPx: 10.5, padding: 2.5, maxWidth: '600px' },
};

export const QuotationDocument = ({ quotation, companySettings, paperSize = 'A4' }) => {
  if (!quotation) return null;

  const config = PAPER_CONFIG[paperSize] || PAPER_CONFIG.A4;
  const isGst = quotation.invoice_type === 'GST';
  const items = quotation.items || [];
  const customer = quotation.customers || {};

  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.unit_price) || 0;
    return sum + q * r;
  }, 0);

  const discountAmount = parseFloat(quotation.discount_amount) || 0;
  const taxableValue = Math.max(0, subtotal - discountAmount);

  const isInterstate = !!quotation.is_interstate;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isGst) {
    items.forEach((item) => {
      const q = parseFloat(item.quantity) || 0;
      const r = parseFloat(item.unit_price) || 0;
      const itemSubtotal = q * r;
      const itemTaxable = subtotal > 0 ? (itemSubtotal / subtotal) * taxableValue : 0;
      const gstRate = parseFloat(item.gst_rate) || 0;
      const itemTax = (itemTaxable * gstRate) / 100;

      if (isInterstate) {
        igst += itemTax;
      } else {
        cgst += itemTax / 2;
        sgst += itemTax / 2;
      }
    });
  }

  const totalTax = cgst + sgst + igst;
  const grandTotal = parseFloat(quotation.total_amount) || (taxableValue + totalTax);
  const roundOff = grandTotal - (taxableValue + totalTax);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt || 0);
  };

  return (
    <Box
      id="printable-quotation-container"
      sx={{
        bgcolor: '#ffffff',
        color: '#000000',
        p: config.padding,
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        fontSize: `${config.baseFontPx}px`,
        maxWidth: config.maxWidth,
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Header: Company Info (Left) & Logo (Right) */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: `${config.baseFontPx + 8}px` }}>
            {companySettings?.company_name || 'G.P.R Offset Printers'}
          </Typography>
          
          <Box display="flex" gap={2} mt={0.5} mb={0.5}>
            {companySettings?.phone && (
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.baseFontPx}px` }}>
                Phone: {companySettings.phone}
              </Typography>
            )}
            {companySettings?.email && (
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.baseFontPx}px` }}>
                Email: {companySettings.email}
              </Typography>
            )}
          </Box>

          {companySettings?.address && (
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'pre-line', fontSize: `${config.baseFontPx - 2}px`, display: 'block' }}>
              {companySettings.address}
            </Typography>
          )}

          {companySettings?.gstin && (
            <Typography variant="body2" fontWeight={700} color="primary" mt={0.5} sx={{ fontSize: `${config.baseFontPx}px` }}>
              GSTIN: {companySettings.gstin}
            </Typography>
          )}
        </Box>

        {companySettings?.logo_url && (
          <Box
            component="img"
            src={companySettings.logo_url}
            alt="Company Logo"
            sx={{ maxHeight: paperSize === 'A5' ? 55 : 75, maxWidth: paperSize === 'A5' ? 150 : 200, objectFit: 'contain' }}
          />
        )}
      </Box>

      <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main', my: 1.5 }} />

      {/* Title */}
      <Box textAlign="center" mb={2}>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: `${config.baseFontPx + 4}px` }}>
          {isGst ? 'GST QUOTATION' : 'QUOTATION'}
        </Typography>
      </Box>

      {/* Meta Box & Customer Info */}
      <Grid container spacing={2} mb={2}>
        {/* Customer Info */}
        <Grid item xs={7}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: '100%' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: `${config.baseFontPx - 3}px` }}>
              QUOTATION FOR:
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: `${config.baseFontPx}px` }}>
              {quotation.customer_name || customer.name || 'N/A'}
            </Typography>
            {(quotation.billing_address || customer.address) && (
              <Typography variant="body2" sx={{ fontSize: `${config.baseFontPx - 2}px`, whiteSpace: 'pre-line' }}>
                {quotation.billing_address || customer.address}
              </Typography>
            )}
            {customer.phone && (
              <Typography variant="caption" display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                Phone: {customer.phone}
              </Typography>
            )}
            {(quotation.customer_gstin || customer.gstin) && (
              <Typography variant="caption" fontWeight={700} display="block" color="primary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                GSTIN: {quotation.customer_gstin || customer.gstin}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quotation Meta */}
        <Grid item xs={5}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Quotation No:</Typography>
              <Typography variant="body2" fontWeight={800} sx={{ fontSize: `${config.baseFontPx}px` }}>{quotation.quotation_no}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Date:</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>
                {formatDate(quotation.quotation_date)}
              </Typography>
            </Box>
            {isGst && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Place of Supply:</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                  {isInterstate ? 'Inter-State' : 'Intra-State (Tamil Nadu - 33)'}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Status:</Typography>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{
                  textTransform: 'uppercase',
                  color: quotation.status === 'converted' ? 'success.main' : quotation.status === 'sent' ? 'info.main' : 'warning.main',
                  fontSize: `${config.baseFontPx - 2}px`,
                }}
              >
                {quotation.status || 'DRAFT'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Line Items Table */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, mb: 2 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell width="5%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>#</TableCell>
              <TableCell width={isGst ? '40%' : '55%'} sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>
                Item / Description
              </TableCell>
              {isGst && <TableCell width="12%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>HSN/SAC</TableCell>}
              <TableCell align="right" width="10%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>Qty</TableCell>
              <TableCell align="right" width="12%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>Rate</TableCell>
              {isGst && <TableCell align="right" width="10%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>GST %</TableCell>}
              <TableCell align="right" width="15%" sx={{ fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.unit_price) || 0;
              const itemTotal = qty * rate;
              const prodName = item.product_name || item.description;
              const desc = item.description && item.description !== prodName ? item.description : null;

              return (
                <TableRow key={index}>
                  <TableCell sx={{ fontSize: `${config.tableFontPx}px` }}>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: `${config.tableFontPx}px` }}>
                      {prodName}
                    </Typography>
                    {desc && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: `${config.tableFontPx - 1.5}px` }}>
                        {desc}
                      </Typography>
                    )}
                  </TableCell>
                  {isGst && <TableCell sx={{ fontSize: `${config.tableFontPx}px` }}>{item.hsn_code || '-'}</TableCell>}
                  <TableCell align="right" sx={{ fontSize: `${config.tableFontPx}px` }}>{qty}</TableCell>
                  <TableCell align="right" sx={{ fontSize: `${config.tableFontPx}px` }}>{rate.toFixed(2)}</TableCell>
                  {isGst && <TableCell align="right" sx={{ fontSize: `${config.tableFontPx}px` }}>{item.gst_rate || 0}%</TableCell>}
                  <TableCell align="right" fontWeight={600} sx={{ fontSize: `${config.tableFontPx}px` }}>
                    {itemTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Breakdown */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} />
        <Grid item xs={6}>
          <Box border="1px solid" borderColor="divider" borderRadius={1} p={1.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Subtotal:</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{formatCurrency(subtotal)}</Typography>
            </Box>

            {discountAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="error" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Discount:</Typography>
                <Typography variant="body2" color="error" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>- {formatCurrency(discountAmount)}</Typography>
              </Box>
            )}

            {isGst && (
              <React.Fragment>
                {isInterstate ? (
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>IGST:</Typography>
                    <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{formatCurrency(igst)}</Typography>
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>CGST:</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{formatCurrency(cgst)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>SGST:</Typography>
                      <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{formatCurrency(sgst)}</Typography>
                    </Box>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}

            {roundOff !== 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Round Off:</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>
                  {roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Bottom Row */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mt={3} pt={1} borderTop="1px solid #e0e0e0">
        <Box maxWidth="60%">
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
              ESTIMATED TOTAL:
            </Typography>
            <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ fontSize: `${config.baseFontPx + 8}px` }}>
              {formatCurrency(grandTotal)}
            </Typography>
          </Box>

          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: `${config.baseFontPx - 3}px` }}>
            AMOUNT IN WORDS:
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ fontStyle: 'italic', fontSize: `${config.baseFontPx - 1}px` }}>
            {amountInWords(grandTotal)}
          </Typography>
        </Box>

        <Box textAlign="center" minWidth="180px">
          {companySettings?.signatory_image_url ? (
            <Box
              component="img"
              src={companySettings.signatory_image_url}
              alt="Signature"
              sx={{ maxHeight: paperSize === 'A5' ? 35 : 45, maxWidth: 160, objectFit: 'contain', mb: 0.5 }}
            />
          ) : (
            <Box height={paperSize === 'A5' ? 35 : 45} />
          )}
          <Divider sx={{ mb: 0.5 }} />
          <Typography variant="caption" fontWeight={700} display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
            {companySettings?.signatory_name || 'Authorized Signatory'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 3}px` }}>
            For {companySettings?.company_name || 'G.P.R Offset Printers'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default QuotationDocument;

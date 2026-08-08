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

export const InvoiceDocument = ({ invoice, companySettings }) => {
  if (!invoice) return null;

  const isGst = invoice.invoice_type === 'GST';
  const items = invoice.items || [];
  const customer = invoice.customers || {};

  // Financial calculations matching Section 7 formula
  const subtotal = items.reduce((sum, item) => {
    const q = parseFloat(item.quantity) || 0;
    const r = parseFloat(item.unit_price) || 0;
    return sum + q * r;
  }, 0);

  const discountAmount = parseFloat(invoice.discount_amount) || 0;
  const taxableValue = Math.max(0, subtotal - discountAmount);

  const isInterstate = !!invoice.is_interstate;
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
  const grandTotal = parseFloat(invoice.total_amount) || (taxableValue + totalTax);
  const roundOff = grandTotal - (taxableValue + totalTax);

  const formatCurrency = (amt) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amt || 0);
  };

  return (
    <Box
      id="printable-invoice-container"
      sx={{
        bgcolor: '#ffffff',
        color: '#000000',
        p: { xs: 2, sm: 4 },
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        maxWidth: '850px',
        margin: '0 auto',
        boxSizing: 'border-box',
      }}
    >
      {/* Header: Company Info (Left) & Logo (Right) */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {companySettings?.company_name || 'G.P.R Offset Printers'}
          </Typography>
          {companySettings?.address && (
            <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line', fontSize: '0.85rem' }}>
              {companySettings.address}
            </Typography>
          )}
          <Box display="flex" gap={2} mt={0.5}>
            {companySettings?.phone && (
              <Typography variant="caption" color="text.secondary">
                Phone: {companySettings.phone}
              </Typography>
            )}
            {companySettings?.email && (
              <Typography variant="caption" color="text.secondary">
                Email: {companySettings.email}
              </Typography>
            )}
          </Box>
          {companySettings?.gstin && (
            <Typography variant="body2" fontWeight={700} color="primary" mt={0.5} sx={{ fontSize: '0.85rem' }}>
              GSTIN: {companySettings.gstin}
            </Typography>
          )}
        </Box>

        {companySettings?.logo_url && (
          <Box
            component="img"
            src={companySettings.logo_url}
            alt="Company Logo"
            sx={{ maxHeight: 75, maxWidth: 200, objectFit: 'contain' }}
          />
        )}
      </Box>

      <Divider sx={{ borderBottomWidth: 2, borderColor: 'primary.main', my: 1.5 }} />

      {/* Invoice Title */}
      <Box textAlign="center" mb={2}>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 1, textTransform: 'uppercase' }}>
          {isGst ? 'TAX INVOICE' : 'RETAIL BILL / INVOICE'}
        </Typography>
      </Box>

      {/* Meta Box & Customer Info */}
      <Grid container spacing={2} mb={2}>
        {/* Bill-To */}
        <Grid item xs={7}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: '100%' }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
              BILLED TO:
            </Typography>
            <Typography variant="subtitle2" fontWeight={800}>
              {invoice.customer_name || customer.name || 'N/A'}
            </Typography>
            {(invoice.billing_address || customer.address) && (
              <Typography variant="body2" sx={{ fontSize: '0.82rem', whiteSpace: 'pre-line' }}>
                {invoice.billing_address || customer.address}
              </Typography>
            )}
            {customer.phone && (
              <Typography variant="caption" display="block">
                Phone: {customer.phone}
              </Typography>
            )}
            {(invoice.customer_gstin || customer.gstin) && (
              <Typography variant="caption" fontWeight={700} display="block" color="primary">
                GSTIN: {invoice.customer_gstin || customer.gstin}
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Invoice Meta */}
        <Grid item xs={5}>
          <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Invoice No:</Typography>
              <Typography variant="body2" fontWeight={800}>{invoice.invoice_no}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Date:</Typography>
              <Typography variant="body2" fontWeight={700}>
                {invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('en-IN') : 'N/A'}
              </Typography>
            </Box>
            {isGst && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">Place of Supply:</Typography>
                <Typography variant="caption" fontWeight={600}>
                  {isInterstate ? 'Inter-State' : 'Intra-State (Tamil Nadu - 33)'}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary">Payment Status:</Typography>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ textTransform: 'uppercase', color: invoice.status === 'paid' ? 'success.main' : 'error.main' }}
              >
                {invoice.status || 'UNPAID'}
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
              <TableCell width="5%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>#</TableCell>
              <TableCell width={isGst ? '40%' : '55%'} sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                Item / Description
              </TableCell>
              {isGst && <TableCell width="12%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>HSN/SAC</TableCell>}
              <TableCell align="right" width="10%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Qty</TableCell>
              <TableCell align="right" width="12%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Rate</TableCell>
              {isGst && <TableCell align="right" width="10%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>GST %</TableCell>}
              <TableCell align="right" width="15%" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Amount</TableCell>
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
                  <TableCell sx={{ fontSize: '0.8rem' }}>{index + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontSize: '0.83rem' }}>
                      {prodName}
                    </Typography>
                    {desc && (
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.75rem' }}>
                        {desc}
                      </Typography>
                    )}
                  </TableCell>
                  {isGst && <TableCell sx={{ fontSize: '0.8rem' }}>{item.hsn_code || '-'}</TableCell>}
                  <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{qty}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{rate.toFixed(2)}</TableCell>
                  {isGst && <TableCell align="right" sx={{ fontSize: '0.8rem' }}>{item.gst_rate || 0}%</TableCell>}
                  <TableCell align="right" fontWeight={600} sx={{ fontSize: '0.8rem' }}>
                    {itemTotal.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Summary Breakdown Table / Grid */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={6} />
        <Grid item xs={6}>
          <Box border="1px solid" borderColor="divider" borderRadius={1} p={1.5}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Subtotal:</Typography>
              <Typography variant="body2" fontWeight={600}>{formatCurrency(subtotal)}</Typography>
            </Box>

            {discountAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="error">Discount:</Typography>
                <Typography variant="body2" color="error" fontWeight={600}>- {formatCurrency(discountAmount)}</Typography>
              </Box>
            )}

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">Taxable Amount:</Typography>
              <Typography variant="body2" fontWeight={600}>{formatCurrency(taxableValue)}</Typography>
            </Box>

            {isGst && (
              <React.Fragment>
                {isInterstate ? (
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">IGST:</Typography>
                    <Typography variant="caption" fontWeight={600}>{formatCurrency(igst)}</Typography>
                  </Box>
                ) : (
                  <React.Fragment>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">CGST:</Typography>
                      <Typography variant="caption" fontWeight={600}>{formatCurrency(cgst)}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">SGST:</Typography>
                      <Typography variant="caption" fontWeight={600}>{formatCurrency(sgst)}</Typography>
                    </Box>
                  </React.Fragment>
                )}
              </React.Fragment>
            )}

            {roundOff !== 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary">Round Off:</Typography>
                <Typography variant="caption" fontWeight={600}>
                  {roundOff > 0 ? `+${roundOff.toFixed(2)}` : roundOff.toFixed(2)}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 1 }} />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={800}>Grand Total:</Typography>
              <Typography variant="subtitle1" fontWeight={900} color="primary">
                {formatCurrency(grandTotal)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Bottom Row: Amount in Words (Left) & Authorized Signatory (Right) */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mt={3} pt={1} borderTop="1px solid #e0e0e0">
        {/* Amount in Words */}
        <Box maxWidth="60%">
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">
            AMOUNT IN WORDS:
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ fontStyle: 'italic' }}>
            {amountInWords(grandTotal)}
          </Typography>
        </Box>

        {/* Authorized Signatory */}
        <Box textAlign="center" minWidth="200px">
          {companySettings?.signatory_image_url ? (
            <Box
              component="img"
              src={companySettings.signatory_image_url}
              alt="Signature"
              sx={{ maxHeight: 45, maxWidth: 160, objectFit: 'contain', mb: 0.5 }}
            />
          ) : (
            <Box height={45} />
          )}
          <Divider sx={{ mb: 0.5 }} />
          <Typography variant="caption" fontWeight={700} display="block">
            {companySettings?.signatory_name || 'Authorized Signatory'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            For {companySettings?.company_name || 'G.P.R Offset Printers'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default InvoiceDocument;

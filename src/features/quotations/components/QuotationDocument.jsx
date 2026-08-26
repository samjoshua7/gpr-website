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
  A4: {
    widthMm: 210,
    heightMm: 297,
    baseFontPx: 12.5,
    tableFontPx: 11.5,
    titleFontPx: 18,
    companyFontPx: 20,
    cellPaddingY: '5px',
    cellPaddingX: '8px',
    padding: 3,
    maxWidth: '820px',
    qrSize: 85,
    logoMaxHeight: 52,
    signHeight: 40,
    metaPadding: 1.5,
    gap: 2,
  },
  A5: {
    widthMm: 148,
    heightMm: 210,
    baseFontPx: 9.5,
    tableFontPx: 8.5,
    titleFontPx: 13,
    companyFontPx: 14,
    cellPaddingY: '2.5px',
    cellPaddingX: '4px',
    padding: 1.5,
    maxWidth: '560px',
    qrSize: 62,
    logoMaxHeight: 34,
    signHeight: 28,
    metaPadding: 1,
    gap: 1,
  },
};

export const QuotationDocument = ({ quotation, companySettings, paperSize = 'A4', isCustomerView = true }) => {
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
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={config.gap}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: `${config.companyFontPx}px` }}>
            {companySettings?.company_name || 'G.P.R Offset Printers'}
          </Typography>
          
          <Box display="flex" gap={2} mt={0.5} mb={0.5}>
            {companySettings?.phone && (
              <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.baseFontPx}px` }}>
                Ph: {companySettings.phone}
              </Typography>
            )}
            {companySettings?.email && (
              <Typography variant="body2" sx={{ fontSize: `${config.baseFontPx}px` }}>
                Email: {companySettings.email}
              </Typography>
            )}
          </Box>

          {companySettings?.address && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
              {companySettings.address}
            </Typography>
          )}
          {isGst && companySettings?.gstin && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
              GSTIN: {companySettings.gstin}
            </Typography>
          )}
        </Box>

        {companySettings?.logo_url && (
          <Box
            component="img"
            src={companySettings.logo_url}
            alt="Company Logo"
            sx={{ maxHeight: config.logoMaxHeight, maxWidth: 160, objectFit: 'contain' }}
          />
        )}
      </Box>

      <Box textAlign="center" my={config.gap === 1 ? 0.75 : 1.25} pb={0.5} borderBottom="2px solid #000">
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 1, fontSize: `${config.titleFontPx}px` }}>
          QUOTATION / ESTIMATE
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2.5}px` }}>
          Official Commercial Quotation
        </Typography>
      </Box>

      <Grid container spacing={config.gap} mb={config.gap}>
        <Grid item xs={7}>
          <Paper variant="outlined" sx={{ p: config.metaPadding, height: '100%', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={0.25} sx={{ fontSize: `${config.baseFontPx - 2.5}px` }}>
              QUOTATION FOR:
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: `${config.baseFontPx}px` }}>
              {quotation.customer_name || customer.name || 'Walk-in Customer'}
            </Typography>
            {customer.company_name && (
              <Typography variant="body2" sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{customer.company_name}</Typography>
            )}
            {customer.phone && (
              <Typography variant="caption" display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Phone: {customer.phone}</Typography>
            )}
            {customer.billing_address && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                {customer.billing_address}
              </Typography>
            )}
            {customer.gstin && (
              <Typography variant="caption" fontWeight={600} display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                GSTIN: {customer.gstin}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={5}>
          <Paper variant="outlined" sx={{ p: config.metaPadding, height: '100%', borderRadius: 1 }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Quote No:</Typography>
              <Typography variant="body2" fontWeight={800} color="primary" sx={{ fontSize: `${config.baseFontPx}px` }}>
                {quotation.quotation_no}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Date:</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>
                {formatDate(quotation.quotation_date)}
              </Typography>
            </Box>
            {quotation.valid_until && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Valid Until:</Typography>
                <Typography variant="caption" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
                  {formatDate(quotation.valid_until)}
                </Typography>
              </Box>
            )}
            <Box display="flex" justifyContent="space-between">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Status:</Typography>
              <Typography
                variant="caption"
                fontWeight={800}
                sx={{ textTransform: 'uppercase', color: quotation.status === 'converted' ? 'success.main' : 'primary.main', fontSize: `${config.baseFontPx - 2}px` }}
              >
                {quotation.status || 'DRAFT'}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1, mb: config.gap }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell width="5%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>#</TableCell>
              <TableCell width={isCustomerView ? '55%' : (isGst ? '40%' : '55%')} sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>
                {isCustomerView ? 'Description' : 'Item / Description'}
              </TableCell>
              {!isCustomerView && isGst && <TableCell width="12%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>HSN/SAC</TableCell>}
              <TableCell align="right" width="10%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>Qty</TableCell>
              <TableCell align="right" width="13%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>Rate</TableCell>
              {!isCustomerView && isGst && <TableCell align="right" width="10%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>GST %</TableCell>}
              <TableCell align="right" width="15%" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontWeight: 700, fontSize: `${config.tableFontPx}px` }}>
                {isCustomerView ? 'Total' : 'Amount'}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const qty = parseFloat(item.quantity) || 0;
              const rate = parseFloat(item.unit_price) || 0;
              const itemPreTax = qty * rate;
              const itemGstRate = isGst ? (parseFloat(item.gst_rate) || 0) : 0;
              const itemTax = (itemPreTax * itemGstRate) / 100;
              const itemGrossTotal = itemPreTax + itemTax;
              const itemGrossRate = qty > 0 ? (itemGrossTotal / qty) : itemGrossTotal;

              const prodName = item.product_name || item.description;
              const desc = item.description && item.description !== prodName ? item.description : null;
              const customerDescription = item.description || item.product_name;

              return (
                <TableRow key={index}>
                  <TableCell sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>{index + 1}</TableCell>
                  <TableCell sx={{ py: config.cellPaddingY, px: config.cellPaddingX }}>
                    {isCustomerView ? (
                      <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.tableFontPx}px`, lineHeight: 1.25, whiteSpace: 'pre-line' }}>
                        {customerDescription}
                      </Typography>
                    ) : (
                      <React.Fragment>
                        <Typography variant="body2" fontWeight={700} sx={{ fontSize: `${config.tableFontPx}px`, lineHeight: 1.2 }}>
                          {prodName}
                        </Typography>
                        {desc && (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: `${config.tableFontPx - 1.5}px`, lineHeight: 1.1, whiteSpace: 'pre-line' }}>
                            {desc}
                          </Typography>
                        )}
                      </React.Fragment>
                    )}
                  </TableCell>
                  {!isCustomerView && isGst && <TableCell sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>{item.hsn_code || '-'}</TableCell>}
                  <TableCell align="right" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>{qty}</TableCell>
                  <TableCell align="right" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>
                    {isCustomerView ? itemGrossRate.toFixed(2) : rate.toFixed(2)}
                  </TableCell>
                  {!isCustomerView && isGst && <TableCell align="right" sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>{item.gst_rate || 0}%</TableCell>}
                  <TableCell align="right" fontWeight={600} sx={{ py: config.cellPaddingY, px: config.cellPaddingX, fontSize: `${config.tableFontPx}px` }}>
                    {isCustomerView ? itemGrossTotal.toFixed(2) : itemPreTax.toFixed(2)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Grid container spacing={config.gap} mb={config.gap}>
        <Grid item xs={6} />
        <Grid item xs={6}>
          <Box border="1px solid" borderColor="divider" borderRadius={1} p={config.metaPadding}>
            {!isCustomerView && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Subtotal:</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>{formatCurrency(subtotal)}</Typography>
              </Box>
            )}

            {discountAmount > 0 && (
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography variant="caption" color="error" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>Discount:</Typography>
                <Typography variant="body2" color="error" fontWeight={600} sx={{ fontSize: `${config.baseFontPx - 1}px` }}>- {formatCurrency(discountAmount)}</Typography>
              </Box>
            )}

            {!isCustomerView && isGst && (
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

            <Divider sx={{ my: 0.75 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2" fontWeight={800} sx={{ fontSize: `${config.baseFontPx}px` }}>Total:</Typography>
              <Typography variant="subtitle2" fontWeight={800} color="primary.main" sx={{ fontSize: `${config.baseFontPx + 1}px` }}>
                {formatCurrency(grandTotal)}
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="space-between" alignItems="flex-end" mt={config.gap} pt={1} borderTop="1px solid #e0e0e0">
        <Box maxWidth="60%">
          <Box mb={0.5}>
            <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ fontSize: `${config.baseFontPx - 2}px` }}>
              ESTIMATED TOTAL:
            </Typography>
            <Typography variant="h5" fontWeight={900} color="primary.main" sx={{ fontSize: `${config.baseFontPx + 6}px`, lineHeight: 1.1 }}>
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

        <Box textAlign="center" minWidth={paperSize === 'A5' ? '120px' : '150px'}>
          {companySettings?.signatory_image_url ? (
            <Box
              component="img"
              src={companySettings.signatory_image_url}
              alt="Signature"
              sx={{ maxHeight: config.signHeight, maxWidth: 140, objectFit: 'contain', mb: 0.5 }}
            />
          ) : (
            <Box height={config.signHeight} />
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

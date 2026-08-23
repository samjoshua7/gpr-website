import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Paper,
  Grid,
  Tooltip,
  Autocomplete,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FastForwardIcon from '@mui/icons-material/FastForward';

import { formatDate } from '../../../lib/formatDate';
import { formatCurrency } from '../../../lib/formatCurrency';
import { getInvoicesByCustomer, getSalesInvoices, linkInvoiceToJobCard, unlinkInvoiceFromJobCard } from '../../salesInvoices/api';
import { updateJobStatus } from '../api';

export const JobCardDetailsModal = ({
  open,
  onClose,
  jobCard,
  onEdit,
  onDelete,
  onCreateInvoice,
  onViewInvoice,
  onRefresh,
  userRole,
  workflow = [],
}) => {
  const isStaff = userRole === 'STAFF';
  const isStakeholder = userRole === 'STAKEHOLDER';

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState(null);

  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [unlinkError, setUnlinkError] = useState(null);

  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [advanceLoading, setAdvanceLoading] = useState(false);
  const [advanceError, setAdvanceError] = useState(null);
  const [advanceWarning, setAdvanceWarning] = useState(null);

  useEffect(() => {
    if (linkDialogOpen) {
      const fetchInvoices = async () => {
        setInvoicesLoading(true);
        setLinkError(null);
        try {
          let data = [];
          if (jobCard?.customer_id) {
            data = await getInvoicesByCustomer(jobCard.customer_id);
          } else {
            data = await getSalesInvoices('', 'all', true);
          }

          // Filter strictly: active (non-void) and unlinked (or currently linked to this job card)
          const availableInvoices = (data || []).filter(
            (inv) => inv.status !== 'void' && (!inv.job_id || inv.job_id === jobCard.job_id)
          );
          setInvoices(availableInvoices);
        } catch (err) {
          console.error(err);
          setLinkError('Failed to load invoices list.');
        } finally {
          setInvoicesLoading(false);
        }
      };
      fetchInvoices();
    }
  }, [linkDialogOpen, jobCard?.customer_id, jobCard?.job_id]);

  if (!jobCard) return null;

  const jcNumber = `JC-${String(jobCard.job_number || 0).padStart(4, '0')}`;
  const isBilled = !!jobCard.is_billed;
  const linkedInvoice = jobCard.linked_invoice;

  const currentStage = jobCard.status || workflow[0] || 'New Orders';
  const currentIdx = workflow.indexOf(currentStage);
  const isLastStep = currentIdx >= 0 && currentIdx === workflow.length - 1;
  const isPenultimateStep = currentIdx >= 0 && currentIdx === workflow.length - 2;
  const nextStage = currentIdx >= 0 && currentIdx < workflow.length - 1 ? workflow[currentIdx + 1] : null;

  const handleOpenAdvance = () => {
    if (isPenultimateStep && !isBilled) {
      setAdvanceWarning(
        `Job Card ${jcNumber} is [NOT BILLED]. In accordance with shop policy, an invoice must be created before moving to ${workflow[workflow.length - 1]}.`
      );
    } else {
      setAdvanceWarning(null);
    }
    setAdvanceError(null);
    setAdvanceDialogOpen(true);
  };

  const handleConfirmAdvance = async () => {
    if (!nextStage) return;
    setAdvanceLoading(true);
    setAdvanceError(null);
    try {
      await updateJobStatus(jobCard.job_id, nextStage);
      setAdvanceDialogOpen(false);
      onRefresh && onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setAdvanceError(err.message || 'Failed to advance job stage.');
    } finally {
      setAdvanceLoading(false);
    }
  };

  const handleConfirmLink = async () => {
    if (!selectedInvoice) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      await linkInvoiceToJobCard(selectedInvoice.invoice_id, jobCard.job_id);
      setLinkDialogOpen(false);
      setSelectedInvoice(null);
      onRefresh && onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setLinkError(err.message || 'Failed to link invoice.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleConfirmUnlink = async () => {
    if (!linkedInvoice) return;
    setUnlinkLoading(true);
    setUnlinkError(null);
    try {
      await unlinkInvoiceFromJobCard(linkedInvoice.invoice_id);
      setUnlinkDialogOpen(false);
      onRefresh && onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      setLinkError(err.message || 'Failed to unlink invoice.');
    } finally {
      setUnlinkLoading(false);
    }
  };

  return (
    <React.Fragment>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: 800,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1.5,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              {jcNumber}
            </Typography>
            <Chip
              label={jobCard.status || 'New Orders'}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          </Box>

          {/* Status block: Red NOT BILLED vs Green BILLED (hidden for staff) */}
          {!isStaff && (
            <Chip
              label={isBilled ? 'BILLED' : 'NOT BILLED'}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: '0.75rem',
                bgcolor: isBilled ? '#2e7d32' : '#d32f2f',
                color: '#ffffff',
                px: 0.5,
              }}
            />
          )}
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          {/* Core Specs */}
          <Box sx={{ mb: 2.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
              Job Description / Specifications
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {jobCard.description || 'No description provided'}
            </Typography>
          </Box>

          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Customer
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {jobCard.customers?.name || '—'}
              </Typography>
              {jobCard.customers?.phone && (
                <Typography variant="caption" color="text.secondary">
                  {jobCard.customers.phone}
                </Typography>
              )}
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Quantity
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700, mt: 0.5 }}>
                {parseFloat(jobCard.quantity || 1).toLocaleString()} units
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Due Date
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                {jobCard.due_date ? formatDate(jobCard.due_date) : 'No deadline'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                Created At
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 500, mt: 0.5 }}>
                {formatDate(jobCard.created_at)}
              </Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Invoice / Billing Status Section (hidden for staff) */}
          {!isStaff && (
            isBilled && linkedInvoice ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(46, 125, 50, 0.04)',
                  borderColor: 'rgba(46, 125, 50, 0.3)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ReceiptIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                      Linked Sales Invoice: {linkedInvoice.invoice_no}
                    </Typography>
                  </Box>
                  <Chip
                    label={(linkedInvoice.status || 'unpaid').toUpperCase()}
                    size="small"
                    color={
                      linkedInvoice.status === 'paid'
                        ? 'success'
                        : linkedInvoice.status === 'partial'
                        ? 'warning'
                        : 'default'
                    }
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Amount: <strong>{formatCurrency(linkedInvoice.total_amount || 0)}</strong>
                    {linkedInvoice.amount_paid > 0 && ` (Paid: ${formatCurrency(linkedInvoice.amount_paid)})`}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!isStakeholder && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="warning"
                        startIcon={<LinkOffIcon />}
                        onClick={() => setUnlinkDialogOpen(true)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Unlink
                      </Button>
                    )}
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      startIcon={<VisibilityIcon />}
                      onClick={() => {
                        onClose();
                        onViewInvoice && onViewInvoice(linkedInvoice.invoice_id);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      View Invoice
                    </Button>
                  </Box>
                </Box>
              </Paper>
            ) : (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: 'rgba(211, 47, 47, 0.04)',
                  borderColor: 'rgba(211, 47, 47, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                    Not Invoiced Yet
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Card can move across stages up to final stage without billing.
                  </Typography>
                </Box>
                {!isStakeholder && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<LinkIcon />}
                      onClick={() => setLinkDialogOpen(true)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Link to Invoice
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      startIcon={<AddShoppingCartIcon />}
                      onClick={() => {
                        onClose();
                        onCreateInvoice && onCreateInvoice(jobCard);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Create Invoice
                    </Button>
                  </Box>
                )}
              </Paper>
            )
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            {!isStaff && !isStakeholder && (
              isBilled ? (
                <Tooltip title="This job card is linked to an active invoice. Unlink or delete the invoice first to remove this card.">
                  <span>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled
                      startIcon={<LockIcon />}
                      size="small"
                      sx={{ textTransform: 'none' }}
                    >
                      Delete (Protected)
                    </Button>
                  </span>
                </Tooltip>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  size="small"
                  onClick={() => {
                    onClose();
                    onDelete && onDelete(jobCard);
                  }}
                  sx={{ textTransform: 'none' }}
                >
                  Delete Job Card
                </Button>
              )
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {/* Advance to Next Stage Button (for Staff & Admin) */}
            {!isStakeholder && nextStage && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={handleOpenAdvance}
                size="small"
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Complete in {currentStage} → Move to {nextStage}
              </Button>
            )}

            {!isStaff && !isStakeholder && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                size="small"
                onClick={() => {
                  onClose();
                  onEdit && onEdit(jobCard);
                }}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Edit
              </Button>
            )}

            <Button onClick={onClose} variant="contained" color="inherit" size="small" sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Advance Stage Confirmation Dialog */}
      <Dialog open={advanceDialogOpen} onClose={() => !advanceLoading && setAdvanceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" /> Complete Department Task
        </DialogTitle>
        <DialogContent>
          {advanceWarning && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {advanceWarning}
            </Alert>
          )}
          {advanceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {advanceError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to mark <strong>{jcNumber}</strong> as completed in <strong>{currentStage}</strong> and move it to <strong>{nextStage}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setAdvanceDialogOpen(false)} disabled={advanceLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdvance}
            color="success"
            variant="contained"
            disabled={advanceLoading || !!advanceWarning}
          >
            {advanceLoading ? 'Advancing...' : `Confirm & Move to ${nextStage}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manual Link Invoice Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => !linkLoading && setLinkDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LinkIcon color="primary" /> Link to Existing Invoice
        </DialogTitle>
        <DialogContent>
          {linkError && <Alert severity="error" sx={{ mb: 2 }}>{linkError}</Alert>}
          <DialogContentText sx={{ mb: 2 }}>
            Select an unlinked sales invoice for <strong>{jobCard.customers?.name || 'this customer'}</strong> to link with <strong>{jcNumber}</strong> (newest first):
          </DialogContentText>
          <Autocomplete
            options={invoices}
            loading={invoicesLoading}
            getOptionLabel={(option) => {
              if (!option) return '';
              const custName = option.customers?.name || option.customer_name || 'Customer';
              const amt = formatCurrency(option.total_amount || 0);
              return `${option.invoice_no} (${custName} - ${amt})`;
            }}
            value={selectedInvoice}
            onChange={(_, val) => setSelectedInvoice(val)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Sales Invoice"
                placeholder="Search invoice number or customer..."
                margin="dense"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {invoicesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setLinkDialogOpen(false)} disabled={linkLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmLink}
            variant="contained"
            disabled={linkLoading || !selectedInvoice}
          >
            {linkLoading ? 'Linking...' : 'Link Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Unlink Invoice Confirmation Dialog */}
      <Dialog open={unlinkDialogOpen} onClose={() => !unlinkLoading && setUnlinkDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Unlink Invoice</DialogTitle>
        <DialogContent>
          {unlinkError && <Alert severity="error" sx={{ mb: 2 }}>{unlinkError}</Alert>}
          <DialogContentText>
            Are you sure you want to unlink Invoice <strong>{linkedInvoice?.invoice_no}</strong> from this Job Card? The Job Card will revert to <strong>[NOT BILLED]</strong> status.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setUnlinkDialogOpen(false)} disabled={unlinkLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmUnlink} color="warning" variant="contained" disabled={unlinkLoading}>
            {unlinkLoading ? 'Unlinking...' : 'Confirm Unlink'}
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

export default JobCardDetailsModal;


import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { updateSalesInvoice } from '../api';

export const InvoiceNotesPanel = ({ invoice, onNotesUpdated }) => {
  const [editing, setEditing] = useState(false);
  const [notesValue, setNotesValue] = useState(invoice?.notes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setNotesValue(invoice?.notes || '');
  }, [invoice?.notes]);

  if (!invoice) return null;

  const handleSaveNotes = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const updatedInvoice = await updateSalesInvoice(
        invoice.invoice_id,
        {
          ...invoice,
          customer_id: invoice.customer_id,
          notes: notesValue.trim() || null,
        },
        invoice.items || []
      );

      setEditing(false);
      if (onNotesUpdated) {
        onNotesUpdated(updatedInvoice);
      }
    } catch (err) {
      console.error('Failed to update notes:', err);
      setError(err.message || 'Failed to update notes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card variant="outlined" className="no-print" sx={{ mb: 3, borderRadius: 2, bgcolor: '#fffbe6', borderColor: '#ffe58f' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
            Internal Notes (Screen Only - Not Printed)
          </Typography>
          {!editing ? (
            <Button
              size="small"
              startIcon={<EditIcon fontSize="small" />}
              onClick={() => setEditing(true)}
              sx={{ fontWeight: 700 }}
            >
              Edit Notes
            </Button>
          ) : (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon fontSize="small" />}
              onClick={handleSaveNotes}
              disabled={saving}
              sx={{ fontWeight: 700 }}
            >
              Save
            </Button>
          )}
        </Box>

        {error && <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert>}

        {editing ? (
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            value={notesValue}
            onChange={(e) => setNotesValue(e.target.value)}
            placeholder="Add internal operational or payment notes here..."
            sx={{ bgcolor: '#ffffff', borderRadius: 1 }}
          />
        ) : (
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontStyle: notesValue ? 'normal' : 'italic', color: notesValue ? 'text.primary' : 'text.secondary' }}>
            {notesValue || 'No internal notes added.'}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default InvoiceNotesPanel;

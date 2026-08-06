import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { getCompanySettings, updateCompanySettings } from './api';

export const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [newDepartment, setNewDepartment] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompanySettings();
      if (data) {
        setSettings(data);
      } else {
        // Init default settings if table is empty
        setSettings({
          company_name: 'G.P.R Offset Printers',
          address: '',
          phone: '',
          email: '',
          gstin: '',
          invoice_prefix: 'INV',
          financial_year_start: new Date().toISOString().split('T')[0],
          production_workflow: ['New Orders', 'Designing', 'Proof', 'Printing', 'Additional works', 'Cutting', 'Packing', 'Out for Delivery', 'Delivered']
        });
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleAddDepartment = () => {
    if (!newDepartment.trim()) return;
    setSettings(prev => ({
      ...prev,
      production_workflow: [...(prev.production_workflow || []), newDepartment.trim()]
    }));
    setNewDepartment('');
  };

  const handleRemoveDepartment = (index) => {
    setSettings(prev => {
      const newWf = [...prev.production_workflow];
      newWf.splice(index, 1);
      return { ...prev, production_workflow: newWf };
    });
  };

  const handleMoveDepartment = (index, direction) => {
    setSettings(prev => {
      const newWf = [...prev.production_workflow];
      const temp = newWf[index];
      if (direction === 'up' && index > 0) {
        newWf[index] = newWf[index - 1];
        newWf[index - 1] = temp;
      } else if (direction === 'down' && index < newWf.length - 1) {
        newWf[index] = newWf[index + 1];
        newWf[index + 1] = temp;
      }
      return { ...prev, production_workflow: newWf };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      await updateCompanySettings(settings.setting_id, {
        company_name: settings.company_name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        gstin: settings.gstin,
        invoice_prefix: settings.invoice_prefix,
        financial_year_start: settings.financial_year_start,
        production_workflow: settings.production_workflow,
      });
      setSuccess('Settings saved successfully.');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Standard Toolbar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
        <Box sx={{ flex: '6 1 0', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Company Settings
          </Typography>
        </Box>
        <Button
          sx={{ flex: '2 1 0', minWidth: 0 }}
          variant="contained"
          color="primary"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          Save Settings
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 1.5, flexShrink: 0 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1.5, flexShrink: 0 }}>{success}</Alert>}

      <Grid container spacing={2} sx={{ flexGrow: 1, minHeight: 0 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2.5, borderRadius: 1, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={2}>General Info</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company Name"
                  name="company_name"
                  value={settings?.company_name || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Registered Address"
                  name="address"
                  value={settings?.address || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="GSTIN"
                  name="gstin"
                  value={settings?.gstin || ''}
                  onChange={handleChange}
                  inputProps={{ style: { textTransform: 'uppercase' } }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={settings?.phone || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={settings?.email || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Invoice Prefix"
                  name="invoice_prefix"
                  value={settings?.invoice_prefix || ''}
                  onChange={handleChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Financial Year Start"
                  name="financial_year_start"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={settings?.financial_year_start || ''}
                  onChange={handleChange}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2.5, borderRadius: 1, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight={700} mb={1}>Production Workflow</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Configure the steps a Job Card passes through. Order defines Kanban column sequence.
            </Typography>

            <Box display="flex" gap={1} mb={2}>
              <TextField
                size="small"
                fullWidth
                placeholder="New Department/Step"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddDepartment() }}
              />
              <Button variant="contained" onClick={handleAddDepartment} sx={{ minWidth: 40, p: 1 }}>
                <AddIcon />
              </Button>
            </Box>

            <List dense sx={{ bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              {(settings?.production_workflow || []).map((dept, index) => (
                <React.Fragment key={`${dept}-${index}`}>
                  <ListItem>
                    <ListItemText primary={`${index + 1}. ${dept}`} primaryTypographyProps={{ fontWeight: 600 }} />
                    <ListItemSecondaryAction>
                      <IconButton size="small" onClick={() => handleMoveDepartment(index, 'up')} disabled={index === 0}>
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMoveDepartment(index, 'down')} disabled={index === settings.production_workflow.length - 1}>
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleRemoveDepartment(index)} sx={{ ml: 1 }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < settings.production_workflow.length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {(settings?.production_workflow || []).length === 0 && (
                <ListItem>
                  <ListItemText primary="No workflow steps defined." />
                </ListItem>
              )}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage;

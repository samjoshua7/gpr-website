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
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BadgeIcon from '@mui/icons-material/Badge';

import {
  getCompanySettings,
  updateCompanySettings,
  getJobCardsCountByDepartment,
  reassignJobCardsDepartment,
} from './api';
import { invalidateJobCardsCache } from '../jobCards/api';
import { useAuth } from '../../hooks/useAuth';
import { BrandingUpload } from './components/BrandingUpload';
import { generateQrDataUrl, buildUpiPaymentUri } from '../../lib/qrCode';
import {
  getSavedDirectoryHandle,
  pickAndSaveDirectoryHandle,
  clearSavedDirectoryHandle,
} from '../../lib/savedLocation';

export const SettingsPage = () => {
  const { profile } = useAuth();
  const isSuperAdmin = profile?.role === 'SUPER_ADMIN';
  const isStakeholder = profile?.role === 'STAKEHOLDER';

  const [settings, setSettings] = useState(null);
  const [storageFolderName, setStorageFolderName] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [newDepartment, setNewDepartment] = useState('');

  // Department Edit/Rename State
  const [editDeptOpen, setEditDeptOpen] = useState(false);
  const [deptToEditIndex, setDeptToEditIndex] = useState(null);
  const [deptToEditOldName, setDeptToEditOldName] = useState('');
  const [deptNewName, setDeptNewName] = useState('');
  const [editDeptLoading, setEditDeptLoading] = useState(false);
  const [editDeptError, setEditDeptError] = useState(null);

  // Department Delete Guardrail State
  const [deleteDeptOpen, setDeleteDeptOpen] = useState(false);
  const [deptToDeleteIndex, setDeptToDeleteIndex] = useState(null);
  const [deptToDeleteName, setDeptToDeleteName] = useState('');
  const [deptJobCount, setDeptJobCount] = useState(0);
  const [reassignTargetDept, setReassignTargetDept] = useState('');
  const [deleteDeptLoading, setDeleteDeptLoading] = useState(false);
  const [deleteDeptError, setDeleteDeptError] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check saved directory handle
      try {
        const savedDir = await getSavedDirectoryHandle();
        if (savedDir) {
          setStorageFolderName(savedDir.name);
        }
      } catch (e) {
        console.warn('Could not read saved directory handle', e);
      }

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

  const handleChooseStorageFolder = async () => {
    try {
      const dirHandle = await pickAndSaveDirectoryHandle();
      if (dirHandle) {
        setStorageFolderName(dirHandle.name);
        setSuccess(`Local invoices storage folder configured: "${dirHandle.name}" (subfolders: /pdf and /jpg)`);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Failed to select folder: ' + err.message);
      }
    }
  };

  const handleResetStorageFolder = async () => {
    try {
      await clearSavedDirectoryHandle();
      setStorageFolderName(null);
      setSuccess('Storage folder reset. Future exports will prompt for location.');
    } catch (err) {
      setError('Failed to reset storage folder: ' + err.message);
    }
  };

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

  const handleOpenEditDept = (index) => {
    const currentName = settings.production_workflow[index];
    setDeptToEditIndex(index);
    setDeptToEditOldName(currentName);
    setDeptNewName(currentName);
    setEditDeptError(null);
    setEditDeptOpen(true);
  };

  const handleSaveEditDept = async () => {
    const trimmed = deptNewName.trim();
    if (!trimmed) {
      setEditDeptError('Department name cannot be empty.');
      return;
    }
    if (trimmed === deptToEditOldName) {
      setEditDeptOpen(false);
      return;
    }

    setEditDeptLoading(true);
    setEditDeptError(null);
    try {
      // Reassign any existing job cards with the old department name
      await reassignJobCardsDepartment(deptToEditOldName, trimmed);
      invalidateJobCardsCache();

      setSettings((prev) => {
        const newWf = [...prev.production_workflow];
        newWf[deptToEditIndex] = trimmed;
        return { ...prev, production_workflow: newWf };
      });
      setEditDeptOpen(false);
      setSuccess(`Renamed department "${deptToEditOldName}" to "${trimmed}". Click "Save All Settings" to persist workflow order.`);
    } catch (err) {
      console.error(err);
      setEditDeptError(err.message || 'Failed to rename department.');
    } finally {
      setEditDeptLoading(false);
    }
  };

  const handleRequestDeleteDept = async (index) => {
    const deptName = settings.production_workflow[index];
    setDeleteDeptError(null);
    try {
      const count = await getJobCardsCountByDepartment(deptName);
      if (count === 0) {
        // Safe to remove immediately
        setSettings((prev) => {
          const newWf = [...prev.production_workflow];
          newWf.splice(index, 1);
          return { ...prev, production_workflow: newWf };
        });
        setSuccess(`Removed department "${deptName}". Click "Save All Settings" to persist.`);
      } else {
        // In use! Guardrail dialog
        setDeptToDeleteIndex(index);
        setDeptToDeleteName(deptName);
        setDeptJobCount(count);
        const remaining = settings.production_workflow.filter((_, i) => i !== index);
        setReassignTargetDept(remaining[0] || 'New Orders');
        setDeleteDeptOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to check department dependencies.');
    }
  };

  const handleConfirmDeleteDept = async () => {
    if (deptToDeleteIndex === null || !deptToDeleteName) return;

    setDeleteDeptLoading(true);
    setDeleteDeptError(null);
    try {
      if (deptJobCount > 0 && reassignTargetDept) {
        await reassignJobCardsDepartment(deptToDeleteName, reassignTargetDept);
        invalidateJobCardsCache();
      }

      setSettings((prev) => {
        const newWf = [...prev.production_workflow];
        newWf.splice(deptToDeleteIndex, 1);
        return { ...prev, production_workflow: newWf };
      });

      setDeleteDeptOpen(false);
      setSuccess(
        `Department "${deptToDeleteName}" deleted.${
          deptJobCount > 0 ? ` Moved ${deptJobCount} active Job Card(s) to "${reassignTargetDept}".` : ''
        } Click "Save All Settings" to persist.`
      );
    } catch (err) {
      console.error(err);
      setDeleteDeptError(err.message || 'Failed to reassign and delete department.');
    } finally {
      setDeleteDeptLoading(false);
    }
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
        logo_url: settings.logo_url || null,
        signatory_image_url: settings.signatory_image_url || null,
        signatory_name: settings.signatory_name || null,
        default_invoice_paper_size: settings.default_invoice_paper_size || 'A4',
        upi_enabled: settings.upi_enabled !== false,
        upi_mode: settings.upi_mode || 'upi_id',
        upi_id: settings.upi_id || null,
        upi_phone: settings.upi_phone || null,
        bank_name: settings.bank_name || null,
        bank_account_no: settings.bank_account_no || null,
        bank_ifsc: settings.bank_ifsc || null,
        bank_branch: settings.bank_branch || null,
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={800} color="primary">
          Company Settings
        </Typography>
        {!isStakeholder && (
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ fontWeight: 'bold' }}
          >
            Save Settings
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      <BrandingUpload
        settings={settings}
        onChange={handleChange}
        isSuperAdmin={isSuperAdmin}
      />

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>General Info</Typography>
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
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Default Invoice Paper Size"
                  name="default_invoice_paper_size"
                  value={settings?.default_invoice_paper_size || 'A4'}
                  onChange={handleChange}
                >
                  <MenuItem value="A4">A4 (Standard Sheet)</MenuItem>
                  <MenuItem value="A5">A5 (Compact Sheet)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={1}>Production Workflow</Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Configure the steps and departments a Job Card passes through. The order defined here will dictate the Kanban board columns and task completion routing.
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
                      <IconButton size="small" onClick={() => handleMoveDepartment(index, 'up')} disabled={index === 0} title="Move Up">
                        <ArrowUpwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleMoveDepartment(index, 'down')} disabled={index === settings.production_workflow.length - 1} title="Move Down">
                        <ArrowDownwardIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="primary" onClick={() => handleOpenEditDept(index)} sx={{ ml: 0.5 }} title="Rename Department">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleRequestDeleteDept(index)} sx={{ ml: 0.5 }} title="Delete Department">
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

        {/* Roles & Permissions Overview */}
        <Grid item xs={12}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <BadgeIcon color="primary" />
              <Typography variant="h6" fontWeight={700}>
                Roles & Permissions Overview
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" mb={2.5}>
              Role-based access matrix governing page visibility, billing privacy, and operational actions across the printing press application.
            </Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'action.hover' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>System Role</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Page Access</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Job Card Workflow</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Billing & Financial Data</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Settings & Employees</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow hover>
                    <TableCell>
                      <Chip label="Super Admin" color="error" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>All Pages (Unrestricted)</TableCell>
                    <TableCell>Full CRUD across all departments</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>Full CRUD & Financial Audits</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>Full Management</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell>
                      <Chip label="Accounts" color="warning" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Invoices, Receipts, Quotations, Customers, Inventory, Statements, Jobs</TableCell>
                    <TableCell>Full CRUD across all departments</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>Full Financial CRUD</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>Blocked</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell>
                      <Chip label="Staff (Operator)" color="primary" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Job Cards Only (Direct Landing)</TableCell>
                    <TableCell>Assigned Departments Only (Advance/Complete Task)</TableCell>
                    <TableCell sx={{ color: 'text.secondary', fontStyle: 'italic' }}>Hidden (Confidential)</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 600 }}>Blocked</TableCell>
                  </TableRow>
                  <TableRow hover>
                    <TableCell>
                      <Chip label="Stakeholder" color="secondary" size="small" sx={{ fontWeight: 700 }} />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>All Pages (Read-Only)</TableCell>
                    <TableCell>View-only across all departments</TableCell>
                    <TableCell sx={{ color: 'info.main', fontWeight: 600 }}>Read-Only View</TableCell>
                    <TableCell sx={{ color: 'info.main', fontWeight: 600 }}>Read-Only View</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Payment & Dynamic UPI QR Settings */}
        <Grid item xs={12}>
          <Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <QrCode2Icon color="primary" />
                <Typography variant="h6" fontWeight={700}>
                  Payment & Dynamic UPI QR Settings
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings?.upi_enabled !== false}
                    onChange={(e) => setSettings(prev => ({ ...prev, upi_enabled: e.target.checked }))}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="subtitle2" fontWeight={600}>
                    Show Dynamic UPI QR on Invoices
                  </Typography>
                }
              />
            </Box>

            <Typography variant="body2" color="text.secondary" mb={3}>
              Configure your business UPI or Bank Account destination. A dynamic QR code with the exact invoice total is automatically rendered on every invoice and vector PDF.
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      select
                      fullWidth
                      label="Payment Destination Mode"
                      name="upi_mode"
                      value={settings?.upi_mode || 'upi_id'}
                      onChange={handleChange}
                      helperText={
                        settings?.upi_mode === 'bank_account'
                          ? 'NPCI Direct Transfer: Routes payments directly to Account Number and IFSC.'
                          : 'VPA / Mobile Number: Routes payments to your registered UPI ID or Phone Number.'
                      }
                    >
                      <MenuItem value="upi_id">UPI ID / VPA / Mobile Number (e.g. Google Pay, PhonePe, Paytm)</MenuItem>
                      <MenuItem value="bank_account">Direct Bank Account & IFSC (NPCI Virtual Route)</MenuItem>
                    </TextField>
                  </Grid>

                  {settings?.upi_mode !== 'bank_account' ? (
                    <React.Fragment>
                      <Grid item xs={12} sm={7}>
                        <TextField
                          fullWidth
                          label="UPI ID / VPA *"
                          name="upi_id"
                          placeholder="e.g. 9876543210@upi or gprprinters@okaxis"
                          value={settings?.upi_id || ''}
                          onChange={handleChange}
                          helperText="Primary virtual payment address (VPA)"
                        />
                      </Grid>
                      <Grid item xs={12} sm={5}>
                        <TextField
                          fullWidth
                          label="UPI Phone Number"
                          name="upi_phone"
                          placeholder="e.g. 9876543210"
                          value={settings?.upi_phone || ''}
                          onChange={handleChange}
                          helperText="Optional phone number fallback"
                        />
                      </Grid>
                    </React.Fragment>
                  ) : (
                    <React.Fragment>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Bank Name *"
                          name="bank_name"
                          placeholder="e.g. State Bank of India"
                          value={settings?.bank_name || ''}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Account Number *"
                          name="bank_account_no"
                          placeholder="e.g. 123456789012"
                          value={settings?.bank_account_no || ''}
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="IFSC Code *"
                          name="bank_ifsc"
                          placeholder="e.g. SBIN0001234"
                          value={settings?.bank_ifsc || ''}
                          onChange={(e) => setSettings(prev => ({ ...prev, bank_ifsc: e.target.value.toUpperCase() }))}
                          inputProps={{ style: { textTransform: 'uppercase' } }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Branch Name"
                          name="bank_branch"
                          placeholder="e.g. Tirunelveli Town"
                          value={settings?.bank_branch || ''}
                          onChange={handleChange}
                        />
                      </Grid>
                    </React.Fragment>
                  )}
                </Grid>
              </Grid>

              {/* QR Preview Column */}
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    minHeight: 180,
                  }}
                >
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ mb: 1, textTransform: 'uppercase' }}>
                    Live Dynamic QR Preview (Sample: ₹500.00)
                  </Typography>

                  {(() => {
                    const sampleUri = buildUpiPaymentUri({
                      companySettings: settings,
                      amount: '500.00',
                      invoiceNo: 'SAMPLE-001',
                    });
                    const qrData = sampleUri ? generateQrDataUrl(sampleUri, 160) : null;

                    if (!qrData || settings?.upi_enabled === false) {
                      return (
                        <Box py={2}>
                          <Typography variant="body2" color="text.secondary">
                            {settings?.upi_enabled === false
                              ? 'UPI QR Code is currently disabled.'
                              : 'Enter your UPI ID or Bank Details to preview the QR code.'}
                          </Typography>
                        </Box>
                      );
                    }

                    return (
                      <React.Fragment>
                        <Box
                          component="img"
                          src={qrData}
                          alt="Sample QR Code"
                          sx={{ width: 140, height: 140, border: '1px solid #cbd5e1', p: 0.5, bgcolor: '#fff', borderRadius: 1, imageRendering: 'pixelated' }}
                        />
                        <Chip
                          label="Scan to Pay INR 500.00"
                          size="small"
                          color="primary"
                          sx={{ mt: 1, fontWeight: 700, fontSize: '0.7rem' }}
                        />
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                          {settings?.upi_mode === 'bank_account'
                            ? `A/C: ${settings?.bank_account_no || '—'} | IFSC: ${settings?.bank_ifsc || '—'}`
                            : `UPI: ${settings?.upi_id || settings?.upi_phone || '—'}`}
                        </Typography>
                      </React.Fragment>
                    );
                  })()}
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Local Invoice Storage Folder Settings Card */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <FolderIcon color="primary" />
              <Typography variant="h6">Local Invoices Storage Folder (Silent Auto-Save)</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure a local folder (such as <code>C:\gpr_invoices</code>). When you click <strong>Download PDF</strong> or <strong>Download JPG</strong>, invoices are written directly into <code>/pdf</code> and <code>/jpg</code> subfolders in the background without opening the Chrome "Save As" popup every time.
            </Typography>

            <Box
              sx={{
                p: 2,
                border: '1px solid',
                borderColor: storageFolderName ? 'success.light' : 'divider',
                borderRadius: 2,
                bgcolor: storageFolderName ? 'success.50' : 'grey.50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box display="flex" alignItems="center" gap={1.5}>
                <FolderOpenIcon color={storageFolderName ? 'success' : 'action'} sx={{ fontSize: 32 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {storageFolderName ? `Active Base Folder: "${storageFolderName}"` : 'No Local Storage Folder Selected'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {storageFolderName
                      ? `Invoices will be saved to: ${storageFolderName}\\pdf\\ and ${storageFolderName}\\jpg\\`
                      : 'Clicks on PDF/JPG download will prompt you to select a folder once or fall back to standard browser downloads.'}
                  </Typography>
                </Box>
              </Box>

              <Box display="flex" gap={1}>
                <Button
                  variant={storageFolderName ? 'outlined' : 'contained'}
                  color="primary"
                  startIcon={<FolderOpenIcon />}
                  onClick={handleChooseStorageFolder}
                  size="small"
                >
                  {storageFolderName ? 'Change Folder' : 'Choose Base Folder (e.g. C:\\gpr_invoices)'}
                </Button>
                {storageFolderName && (
                  <Button
                    variant="text"
                    color="error"
                    onClick={handleResetStorageFolder}
                    size="small"
                  >
                    Reset
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Edit/Rename Department Dialog */}
      <Dialog open={editDeptOpen} onClose={() => !editDeptLoading && setEditDeptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Rename Department</DialogTitle>
        <DialogContent>
          {editDeptError && <Alert severity="error" sx={{ mb: 2 }}>{editDeptError}</Alert>}
          <DialogContentText sx={{ mb: 2 }}>
            Renaming <strong>"{deptToEditOldName}"</strong> will automatically update all existing Job Cards in this department to the new name.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            value={deptNewName}
            onChange={(e) => setDeptNewName(e.target.value)}
            disabled={editDeptLoading}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEditDept(); }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDeptOpen(false)} disabled={editDeptLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveEditDept} variant="contained" disabled={editDeptLoading || !deptNewName.trim()}>
            {editDeptLoading ? 'Saving...' : 'Rename Department'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Department Guardrail Dialog */}
      <Dialog open={deleteDeptOpen} onClose={() => !deleteDeptLoading && setDeleteDeptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" />
          Department in Use: "{deptToDeleteName}"
        </DialogTitle>
        <DialogContent>
          {deleteDeptError && <Alert severity="error" sx={{ mb: 2 }}>{deleteDeptError}</Alert>}
          <Alert severity="warning" sx={{ mb: 2 }}>
            This department currently contains <strong>{deptJobCount}</strong> active Job Card(s).
          </Alert>
          <DialogContentText sx={{ mb: 2 }}>
            To safely remove the <strong>"{deptToDeleteName}"</strong> department without orphaning active jobs, please select a destination department to move them to:
          </DialogContentText>
          <FormControl fullWidth margin="dense">
            <InputLabel id="reassign-dept-label">Move Job Cards To</InputLabel>
            <Select
              labelId="reassign-dept-label"
              value={reassignTargetDept}
              label="Move Job Cards To"
              onChange={(e) => setReassignTargetDept(e.target.value)}
              disabled={deleteDeptLoading}
            >
              {(settings?.production_workflow || [])
                .filter((dept, i) => i !== deptToDeleteIndex)
                .map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteDeptOpen(false)} disabled={deleteDeptLoading} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeleteDept}
            variant="contained"
            color="error"
            disabled={deleteDeptLoading || !reassignTargetDept}
          >
            {deleteDeptLoading ? 'Reassigning & Deleting...' : `Move ${deptJobCount} Cards & Delete`}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage;

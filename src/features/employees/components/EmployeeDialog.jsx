import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  ListItemText,
  OutlinedInput,
  FormControlLabel,
  Switch,
  Box,
} from '@mui/material';

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

export const EmployeeDialog = ({ open, onClose, onSave, initialData, companySettings }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'STAFF',
    departments: [],
    active: true,
  });
  const [error, setError] = useState(null);

  const availableDepartments = companySettings?.production_workflow || [];

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          role: initialData.role || 'STAFF',
          departments: initialData.departments || [],
          active: initialData.active ?? true,
        });
      } else {
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: 'STAFF',
          departments: [],
          active: true,
        });
      }
      setError(null);
    }
  }, [open, initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDepartmentsChange = (event) => {
    const {
      target: { value },
    } = event;
    setFormData((prev) => ({
      ...prev,
      departments: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = formData.name.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();

    if (!trimmedName || !normalizedEmail) {
      setError('Name and Email are required.');
      return;
    }

    try {
      await onSave({
        ...formData,
        name: trimmedName,
        email: normalizedEmail,
        phone: formData.phone ? formData.phone.trim() : '',
      });
    } catch (err) {
      setError(err.message || 'Failed to save employee.');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initialData ? 'Edit Employee' : 'Add New Employee'}
      </DialogTitle>
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                name="name"
                label="Full Name *"
                fullWidth
                value={formData.name}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Email Address *"
                type="email"
                fullWidth
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Phone Number"
                fullWidth
                value={formData.phone}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-select-label">System Role</InputLabel>
                <Select
                  labelId="role-select-label"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="System Role"
                >
                  <MenuItem value="SUPER_ADMIN">Super Admin (Full Access)</MenuItem>
                  <MenuItem value="ACCOUNTS">Accounts (Financial & Billing)</MenuItem>
                  <MenuItem value="STAFF">Staff (Department Operator)</MenuItem>
                  <MenuItem value="STAKEHOLDER">Stakeholder (Read-Only Viewer)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.active}
                    onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                    color="primary"
                  />
                }
                label="Active Employee"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="departments-label">Assigned Departments</InputLabel>
                <Select
                  labelId="departments-label"
                  multiple
                  value={formData.departments}
                  onChange={handleDepartmentsChange}
                  input={<OutlinedInput label="Assigned Departments" />}
                  renderValue={(selected) => selected.join(', ')}
                  MenuProps={MenuProps}
                >
                  {availableDepartments.map((dept) => (
                    <MenuItem key={dept} value={dept}>
                      <Checkbox checked={formData.departments.indexOf(dept) > -1} />
                      <ListItemText primary={dept} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};



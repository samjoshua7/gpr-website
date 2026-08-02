import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus } from './api';
import { getCompanySettings } from '../settings/api';
import { EmployeeDialog } from './components/EmployeeDialog';

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [empData, settingsData] = await Promise.all([
        getEmployees(),
        getCompanySettings()
      ]);
      setEmployees(empData);
      setCompanySettings(settingsData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load employees data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = () => {
    setEditingEmployee(null);
    setDialogOpen(true);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setDialogOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.employee_id, formData);
    } else {
      await createEmployee(formData);
    }
    setDialogOpen(false);
    loadData();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await deleteEmployee(id);
        loadData();
      } catch (err) {
        alert(err.message || 'Failed to delete employee.');
      }
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await toggleEmployeeStatus(id, !currentStatus);
      loadData();
    } catch (err) {
      alert(err.message || 'Failed to update employee status.');
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
          Employees
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          sx={{ fontWeight: 'bold' }}
        >
          Add Employee
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Departments</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No employees found. Click "Add Employee" to create one.
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.employee_id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{emp.name}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{emp.email}</Typography>
                    <Typography variant="caption" color="text.secondary">{emp.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={emp.role} 
                      size="small" 
                      color={emp.role === 'SUPER_ADMIN' ? 'error' : 'primary'}
                      variant={emp.role === 'SUPER_ADMIN' ? 'filled' : 'outlined'}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {emp.departments?.length > 0 ? (
                        emp.departments.map(dept => (
                          <Chip key={dept} label={dept} size="small" variant="outlined" />
                        ))
                      ) : (
                        <Typography variant="caption" color="text.secondary">None</Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Toggle Status">
                      <IconButton onClick={() => handleToggleStatus(emp.employee_id, emp.active)} size="small">
                        {emp.active ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleEdit(emp)} size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(emp.employee_id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <EmployeeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        initialData={editingEmployee}
        companySettings={companySettings}
      />
    </Box>
  );
};

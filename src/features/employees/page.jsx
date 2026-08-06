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
import { TablePagination, TableSortLabel, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus } from './api';
import { getCompanySettings } from '../settings/api';
import { EmployeeDialog } from './components/EmployeeDialog';
import { SearchInput } from '../../components/ui/SearchInput';
import { HighlightText } from '../../components/ui/HighlightText';

const headCells = [
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'contact', label: 'Contact', align: 'left' },
  { id: 'role', label: 'Role', align: 'left' },
  { id: 'departments', label: 'Departments', align: 'left' },
  { id: 'active', label: 'Status', align: 'left' },
  { id: 'actions', label: 'Actions', align: 'right', disableSort: true }
];

export const EmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [orderBy, setOrderBy] = useState('name');
  const [order, setOrder] = useState('asc');

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

  const processedEmployees = React.useMemo(() => {
    let result = [...employees];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(emp => 
        (emp.name || '').toLowerCase().includes(q) ||
        (emp.email || '').toLowerCase().includes(q) ||
        (emp.phone || '').toLowerCase().includes(q) ||
        (emp.role || '').toLowerCase().includes(q)
      );
    }

    if (orderBy) {
      result.sort((a, b) => {
        let valA = a[orderBy];
        let valB = b[orderBy];
        
        if (orderBy === 'contact') {
          valA = a.email;
          valB = b.email;
        }

        valA = valA == null ? '' : valA;
        valB = valB == null ? '' : valB;

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [employees, searchQuery, orderBy, order]);

  const paginatedEmployees = React.useMemo(() => {
    const start = page * rowsPerPage;
    return processedEmployees.slice(start, start + rowsPerPage);
  }, [processedEmployees, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery]);

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  return (
    <Box sx={{ p: { xs: 1, sm: 2 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Standard Toolbar */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 1.5, alignItems: 'center' }}>
        <SearchInput
          sx={{ flex: '6 1 0', minWidth: 0, bgcolor: 'background.paper', borderRadius: 1 }}
          placeholder="Search by name, email, phone, or role..."
          value={searchQuery}
          onChange={setSearchQuery}
        />
        <Button
          sx={{ flex: '2 1 0', minWidth: 0 }}
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Add Employee
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ borderRadius: 1, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              {headCells.map((headCell) => (
                <TableCell
                  key={headCell.id}
                  align={headCell.align}
                  sx={{ fontWeight: 'bold' }}
                  sortDirection={orderBy === headCell.id ? order : false}
                >
                  {headCell.disableSort ? (
                    headCell.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === headCell.id}
                      direction={orderBy === headCell.id ? order : 'asc'}
                      onClick={() => handleRequestSort(headCell.id)}
                    >
                      {headCell.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && employees.length === 0 ? (
              Array.from(new Array(3)).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><CircularProgress size={24} /></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              ))
            ) : paginatedEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  No employees found. Click "Add Employee" to create one.
                </TableCell>
              </TableRow>
            ) : (
              paginatedEmployees.map((emp) => (
                <TableRow key={emp.employee_id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>
                    <HighlightText text={emp.name} highlight={searchQuery} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2"><HighlightText text={emp.email} highlight={searchQuery} /></Typography>
                    <Typography variant="caption" color="text.secondary"><HighlightText text={emp.phone} highlight={searchQuery} /></Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={<HighlightText text={emp.role} highlight={searchQuery} />}  
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

      {employees.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[25, 50, 100]}
          component="div"
          count={processedEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          component={Paper}
          sx={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, borderBottomLeftRadius: 1, borderBottomRightRadius: 1 }}
        />
      )}

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

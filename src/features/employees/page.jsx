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
import { SearchInput } from '../../components/ui/SearchInput';
import PageToolbar from '../../components/layout/PageToolbar';

import { getEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeStatus } from './api';
import { getCompanySettings } from '../settings/api';
import { EmployeeDialog } from './components/EmployeeDialog';
import { HighlightText } from '../../components/ui/HighlightText';
import { useAuth } from '../../hooks/useAuth';

const ROLE_BADGE = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'error', variant: 'filled' },
  ACCOUNTS: { label: 'Accounts', color: 'warning', variant: 'outlined' },
  STAFF: { label: 'Staff', color: 'primary', variant: 'outlined' },
  STAKEHOLDER: { label: 'Stakeholder', color: 'secondary', variant: 'outlined' },
};

const headCells = [
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'contact', label: 'Contact', align: 'left' },
  { id: 'role', label: 'Role', align: 'left' },
  { id: 'departments', label: 'Departments', align: 'left' },
  { id: 'active', label: 'Status', align: 'left' },
  { id: 'actions', label: 'Actions', align: 'right', disableSort: true }
];

export const EmployeesPage = () => {
  const { profile } = useAuth();
  const isStakeholder = profile?.role === 'STAKEHOLDER';

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <PageToolbar
        title="Employees"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by name, email, phone, or role..."
        actions={
          <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : ''}>
            <span>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                disabled={isStakeholder}
                sx={{
                  fontWeight: 'bold',
                  ...(isStakeholder ? { color: 'text.disabled', bgcolor: 'action.disabledBackground' } : {}),
                }}
              >
                Add Employee
              </Button>
            </span>
          </Tooltip>
        }
      />

      {error && (
        <Alert severity="error" sx={{ mb: 1.5, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ width: '100%', overflow: 'hidden', flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <TableContainer sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                {headCells.map((headCell) => (
                  <TableCell
                    key={headCell.id}
                    align={headCell.align}
                    sx={{ fontWeight: 700, bgcolor: 'background.default' }}
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
                    <Typography color="text.secondary">No employees found.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedEmployees.map((emp) => (
                  <TableRow key={emp.employee_id} hover>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600 }}>
                      <Tooltip title={emp.name || ''} arrow placement="top" disableHoverListener={!emp.name || emp.name.length < 25}>
                        <Typography variant="body2" component="span" sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                          <HighlightText text={emp.name} highlight={searchQuery} />
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><HighlightText text={emp.email} highlight={searchQuery} /></Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}><HighlightText text={emp.phone} highlight={searchQuery} /></Typography>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Chip 
                        label={ROLE_BADGE[emp.role]?.label || emp.role}  
                        size="small" 
                        color={ROLE_BADGE[emp.role]?.color || 'primary'}
                        variant={ROLE_BADGE[emp.role]?.variant || 'outlined'}
                        sx={{ fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 240, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {emp.departments?.length > 0 ? (
                          emp.departments.map(dept => (
                            <Chip key={dept} label={dept} size="small" variant="outlined" sx={{ flexShrink: 0 }} />
                          ))
                        ) : (
                          <Typography variant="caption" color="text.secondary">None</Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Toggle Status'}>
                        <span>
                          <IconButton
                            disabled={isStakeholder}
                            onClick={() => handleToggleStatus(emp.employee_id, emp.active)}
                            size="small"
                          >
                            {emp.active ? <CheckCircleIcon color={isStakeholder ? 'disabled' : 'success'} /> : <CancelIcon color={isStakeholder ? 'disabled' : 'error'} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Edit'}>
                        <span>
                          <IconButton
                            color="primary"
                            disabled={isStakeholder}
                            onClick={() => handleEdit(emp)}
                            size="small"
                            sx={isStakeholder ? { color: 'text.disabled' } : {}}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : 'Delete'}>
                        <span>
                          <IconButton
                            color="error"
                            disabled={isStakeholder}
                            onClick={() => handleDelete(emp.employee_id)}
                            size="small"
                            sx={isStakeholder ? { color: 'text.disabled' } : {}}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </span>
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
            sx={{ flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </Paper>


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

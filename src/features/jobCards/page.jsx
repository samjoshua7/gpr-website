import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Grid,
  Chip,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Tooltip,
  Drawer,
  Divider,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VisibilityIcon from '@mui/icons-material/Visibility';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useLocation, useNavigate } from 'react-router-dom';
import {
  getJobCards,
  deleteJobCard,
  updateJobStatus,
  getProductionTasks,
  updateProductionTaskStatus,
} from './api';
import JobCardDialog from './components/JobCardDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';

const COLUMNS = [
  { id: 'pending', title: 'New Orders (Quotes)', type: 'job' },
  { id: 'design', title: 'Design Room', type: 'task' },
  { id: 'printing', title: 'Printing Press', type: 'task' },
  { id: 'finishing', title: 'Finishing Stage', type: 'task' },
  { id: 'packing', title: 'Packing Area', type: 'task' },
  { id: 'ready', title: 'Ready for Collection', type: 'task' },
  { id: 'delivered', title: 'Delivered / Completed', type: 'task' },
];

const COLUMN_COLORS = {
  pending: '#ed6c02',      // orange
  design: '#0288d1',       // blue
  printing: '#9c27b0',     // purple
  finishing: '#ff9800',    // warning orange
  packing: '#00bcd4',      // cyan
  ready: '#2e7d32',        // dark green
  delivered: '#757575',    // gray
};

export const JobCardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dialog Add/Edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Deletion Safeguard
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  // Rollback notice state
  const [rollbackNotice, setRollbackNotice] = useState(null);

  // Side Panel details drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCardDetails, setActiveCardDetails] = useState(null);

  const fetchKanbanBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, tasksData] = await Promise.all([
        getJobCards(),
        getProductionTasks(),
      ]);
      setJobs(jobsData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Kanban board components.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKanbanBoardData();
  }, [fetchKanbanBoardData]);

  // Rollback signal checker
  useEffect(() => {
    if (location.state?.cancelKickoff) {
      setRollbackNotice('Invoice creation was cancelled. The Job Card remains in Quote status.');
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  const handleAddClick = () => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleEditClick = (job) => {
    setSelectedJob(job);
    setDialogOpen(true);
    setDrawerOpen(false);
  };

  const handleDeleteClick = async (job) => {
    setLoading(true);
    try {
      const res = await checkReferences('job_cards', job.job_id);
      if (res.hasReferences) {
        setJobToDelete(job);
        setDependencyDetails(res.details);
        setCannotDeleteOpen(true);
      } else {
        setJobToDelete(job);
        setDeleteError(null);
        setDeleteOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to run database reference checks.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteJobCard(jobToDelete.job_id);
      setDeleteOpen(false);
      setJobToDelete(null);
      setDrawerOpen(false);
      fetchKanbanBoardData();
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete job card.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchKanbanBoardData();
  };

  // Card details viewer
  const handleOpenDetails = (card, type) => {
    setActiveCardDetails({ ...card, cardType: type });
    setDrawerOpen(true);
  };

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e, card, type) => {
    e.dataTransfer.setData('cardId', type === 'job' ? card.job_id : card.task_id);
    e.dataTransfer.setData('cardType', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumnId) => {
    e.preventDefault();
    const cardId = e.dataTransfer.getData('cardId');
    const cardType = e.dataTransfer.getData('cardType');

    if (!cardId || !cardType) return;

    if (cardType === 'job') {
      // Transitioning Quote Job Card
      if (targetColumnId === 'design') {
        // Move to design room triggers invoice creation flow
        const matchedJob = jobs.find((j) => j.job_id === cardId);
        if (matchedJob) {
          navigate('/dashboard/invoices', { state: { kickoffJob: matchedJob } });
        }
      } else if (targetColumnId !== 'pending') {
        setError('New orders must be linked to an invoice first to trigger production.');
      }
    } else {
      // Transitioning Production Task
      if (targetColumnId === 'pending') {
        setError('Cannot move production tasks back to the quote stage.');
        return;
      }
      try {
        await updateProductionTaskStatus(cardId, targetColumnId);
        fetchKanbanBoardData();
      } catch (err) {
        console.error(err);
        setError('Failed to update production stage.');
      }
    }
  };

  const getFilteredCards = (columnId) => {
    const query = searchQuery.toLowerCase().trim();
    if (columnId === 'pending') {
      // Filter Job Cards
      return jobs
        .filter((j) => j.status === 'pending')
        .filter(
          (j) =>
            j.description?.toLowerCase().includes(query) ||
            j.customers?.name?.toLowerCase().includes(query)
        );
    } else {
      // Filter Production Tasks
      return tasks
        .filter((t) => t.status === columnId)
        .filter(
          (t) =>
            t.product_name?.toLowerCase().includes(query) ||
            t.job_cards?.customers?.name?.toLowerCase().includes(query)
        );
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Desk */}
      <Grid container spacing={2} alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Grid item>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            Production Kanban Board
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage print jobs, design approvals, and automated production tasks in real-time.
          </Typography>
        </Grid>
        <Grid item>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddClick}>
            New Order Quote
          </Button>
        </Grid>
      </Grid>

      {/* Filter and alerts */}
      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Filter cards by customer name, product, or descriptions..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      {rollbackNotice && (
        <Alert severity="warning" onClose={() => setRollbackNotice(null)} sx={{ mb: 2 }}>
          {rollbackNotice}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Kanban Columns Grid */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          pb: 2,
          alignItems: 'stretch',
        }}
      >
        {COLUMNS.map((col) => {
          const colCards = getFilteredCards(col.id);

          return (
            <Box
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              sx={{
                minWidth: 280,
                width: 320,
                bgcolor: 'action.hover',
                borderRadius: 3,
                display: 'flex',
                flexDirection: 'column',
                border: '1px solid rgba(0,0,0,0.06)',
              }}
            >
              {/* Column Header */}
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid',
                  borderColor: COLUMN_COLORS[col.id],
                  bgcolor: 'background.paper',
                  borderTopLeftRadius: 12,
                  borderTopRightRadius: 12,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                  {col.title}
                </Typography>
                <Chip
                  label={loading ? '...' : colCards.length}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: COLUMN_COLORS[col.id],
                    color: '#fff',
                    fontSize: '0.75rem',
                  }}
                />
              </Box>

              {/* Cards List container */}
              <Box
                sx={{
                  flexGrow: 1,
                  p: 1.5,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                }}
              >
                {loading ? (
                  Array.from(new Array(3)).map((_, i) => (
                    <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: 2 }}>
                        <Skeleton width="40%" height={20} />
                        <Skeleton width="80%" height={40} sx={{ my: 1 }} />
                        <Skeleton width="60%" height={20} />
                      </CardContent>
                    </Card>
                  ))
                ) : colCards.length === 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 120,
                      border: '2px dashed rgba(0,0,0,0.08)',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      Drop cards here
                    </Typography>
                  </Box>
                ) : (
                  colCards.map((card) => {
                    const isJob = col.id === 'pending';
                    const titleId = isJob
                      ? `JC-${card.job_id.substring(0, 6).toUpperCase()}`
                      : `TASK-${card.task_id.substring(0, 6).toUpperCase()}`;

                    const description = isJob ? card.description : card.product_name;
                    const customerName = isJob
                      ? card.customers?.name || 'Walk-in / Inquiry'
                      : card.job_cards?.customers?.name || 'Walk-in / Inquiry';

                    return (
                      <Card
                        key={isJob ? card.job_id : card.task_id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, card, isJob ? 'job' : 'task')}
                        onClick={() => handleOpenDetails(card, isJob ? 'job' : 'task')}
                        sx={{
                          borderRadius: 2,
                          cursor: 'grab',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                          borderLeft: '4px solid',
                          borderLeftColor: COLUMN_COLORS[col.id],
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                            transition: 'all 0.2s ease-in-out',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: COLUMN_COLORS[col.id] }}>
                              {titleId}
                            </Typography>
                            <DragIndicatorIcon sx={{ color: 'text.secondary', fontSize: '1rem', cursor: 'grab' }} />
                          </Box>

                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {description}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                            Client: <strong>{customerName}</strong>
                          </Typography>

                          <Divider sx={{ my: 1 }} />

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              Qty: <strong>{card.quantity}</strong>
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(card.created_at)}
                            </Typography>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Drawer Details Side Panel */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 360, p: 3 }}>
          {activeCardDetails && (
            <React.Fragment>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                {activeCardDetails.cardType === 'job' ? 'Job Card Quote' : 'Production Task Info'}
              </Typography>
              <Chip
                label={activeCardDetails.status.toUpperCase()}
                color={activeCardDetails.status === 'pending' ? 'warning' : 'primary'}
                sx={{ fontWeight: 700, mb: 3 }}
              />

              <List sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">DESCRIPTION / PRODUCT</Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
                  {activeCardDetails.cardType === 'job' ? activeCardDetails.description : activeCardDetails.product_name}
                </Typography>

                <Typography variant="caption" color="text.secondary">QUANTITY</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 2 }}>
                  {activeCardDetails.quantity}
                </Typography>

                <Typography variant="caption" color="text.secondary">CUSTOMER</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {activeCardDetails.cardType === 'job'
                    ? activeCardDetails.customers?.name || 'Walk-in / Quote'
                    : activeCardDetails.job_cards?.customers?.name || 'Walk-in / Quote'}
                </Typography>

                <Typography variant="caption" color="text.secondary">CREATED ON</Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {formatDate(activeCardDetails.created_at)}
                </Typography>

                {activeCardDetails.cardType === 'task' && (
                  <React.Fragment>
                    {activeCardDetails.delivery_details && (
                      <React.Fragment>
                        <Typography variant="caption" color="text.secondary">DELIVERY INSTRUCTIONS</Typography>
                        <Typography variant="body2" sx={{ mb: 2, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                          {activeCardDetails.delivery_details}
                        </Typography>
                      </React.Fragment>
                    )}
                    {activeCardDetails.notes && (
                      <React.Fragment>
                        <Typography variant="caption" color="text.secondary">SPECIAL NOTES</Typography>
                        <Typography variant="body2" sx={{ mb: 2, bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                          {activeCardDetails.notes}
                        </Typography>
                      </React.Fragment>
                    )}
                  </React.Fragment>
                )}
              </List>

              <Divider sx={{ my: 2 }} />

              {activeCardDetails.cardType === 'job' && (
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(activeCardDetails)}
                    fullWidth
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(activeCardDetails)}
                    fullWidth
                  >
                    Delete
                  </Button>
                </Box>
              )}
            </React.Fragment>
          )}
        </Box>
      </Drawer>

      {/* Job Card Form Dialog */}
      <JobCardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        job={selectedJob}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Deletion checks */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={jobToDelete ? `JC-${jobToDelete.job_id.substring(0, 6).toUpperCase()}` : ''}
        recordType="job card"
        details={dependencyDetails}
      />

      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <DialogContentText>
            Are you sure you want to delete this job card? This action is permanent.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobCardsPage;

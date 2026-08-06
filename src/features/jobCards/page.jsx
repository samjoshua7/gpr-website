import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Chip,
  Card,
  CardContent,
  Tooltip,
  Drawer,
  Divider,
  List,
  MenuItem,
  FormControl,
  Select,
  InputLabel,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SortIcon from '@mui/icons-material/Sort';

import { useLocation, useNavigate } from 'react-router-dom';

import {
  getJobCards,
  deleteJobCard,
  getProductionTasks,
  updateProductionTaskStatus,
} from './api';
import { getCompanySettings } from '../settings/api';
import JobCardDialog from './components/JobCardDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';
import { SearchInput } from '../../components/ui/SearchInput';

const PREDEFINED_COLORS = [
  '#ed6c02',
  '#0288d1',
  '#9c27b0',
  '#ff9800',
  '#00bcd4',
  '#2e7d32',
  '#757575',
  '#e91e63',
  '#3f51b5',
];

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Date (Newest)' },
  { value: 'date_asc', label: 'Date (Oldest)' },
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'priority', label: 'Priority' },
];

export const JobCardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  const [rollbackNotice, setRollbackNotice] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeCardDetails, setActiveCardDetails] = useState(null);

  const boardScrollRef = useRef(null);

  const fetchKanbanBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, tasksData, settingsData] = await Promise.all([
        getJobCards(),
        getProductionTasks(),
        getCompanySettings(),
      ]);
      setJobs(jobsData);
      setTasks(tasksData);
      const wf = settingsData?.production_workflow || ['New Orders'];
      setWorkflow(wf);
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

  const handleOpenDetails = (card, type) => {
    setActiveCardDetails({ ...card, cardType: type });
    setDrawerOpen(true);
  };

  const handleMoveToNext = async (card, type, currentStepIndex) => {
    if (type === 'job') {
      if (currentStepIndex === 0 && workflow.length > 1) {
        const matchedJob = jobs.find((j) => j.job_id === card.job_id);
        if (matchedJob) {
          navigate('/dashboard/invoices', { state: { kickoffJob: matchedJob } });
        }
      }
    } else {
      const nextStep = workflow[currentStepIndex + 1];
      if (nextStep) {
        try {
          await updateProductionTaskStatus(card.task_id, nextStep);
          fetchKanbanBoardData();
        } catch (err) {
          console.error(err);
          setError('Failed to update production stage.');
        }
      }
    }
  };

  const sortCards = (cards, isFirstStep) => {
    const result = [...cards];
    switch (sortBy) {
      case 'date_asc':
        result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        break;
      case 'date_desc':
      default:
        result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'name_asc':
        result.sort((a, b) => {
          const na = (isFirstStep ? a.description : a.product_name) || '';
          const nb = (isFirstStep ? b.description : b.product_name) || '';
          return na.toLowerCase().localeCompare(nb.toLowerCase());
        });
        break;
      case 'name_desc':
        result.sort((a, b) => {
          const na = (isFirstStep ? a.description : a.product_name) || '';
          const nb = (isFirstStep ? b.description : b.product_name) || '';
          return nb.toLowerCase().localeCompare(na.toLowerCase());
        });
        break;
      case 'priority':
        break;
    }
    return result;
  };

  const getFilteredCards = useMemo(() => {
    return (stepName, isFirstStep) => {
      const query = searchQuery.toLowerCase().trim();
      let filtered;
      if (isFirstStep) {
        filtered = jobs
          .filter((j) => j.status === 'pending')
          .filter(
            (j) =>
              j.description?.toLowerCase().includes(query) ||
              j.customers?.name?.toLowerCase().includes(query)
          );
      } else {
        filtered = tasks
          .filter((t) => t.status === stepName)
          .filter(
            (t) =>
              t.product_name?.toLowerCase().includes(query) ||
              t.job_cards?.customers?.name?.toLowerCase().includes(query)
          );
      }
      return sortCards(filtered, isFirstStep);
    };
  }, [jobs, tasks, searchQuery, sortBy]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    });
  };

  const handleWheel = (e) => {
    const container = boardScrollRef.current;
    if (!container) return;
    if (e.shiftKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
      return;
    }
    e.preventDefault();
    container.scrollLeft += e.deltaY;
  };

  useEffect(() => {
    const container = boardScrollRef.current;
    if (!container) return undefined;
    const handler = (e) => handleWheel(e);
    container.addEventListener('wheel', handler, { passive: false });
    return () => container.removeEventListener('wheel', handler);
  }, []);

  const columnWidth = 320;

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 1.5, md: 2 },
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Fixed Toolbar */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          mb: 1.5,
          flexShrink: 0,
          flexWrap: 'wrap',
        }}
      >
        <SearchInput
          sx={{ flex: '6 1 0', minWidth: 200, bgcolor: 'background.paper', borderRadius: 1 }}
          placeholder="Search Job Orders..."
          value={searchQuery}
          onChange={setSearchQuery}
        />

        <FormControl size="small" sx={{ flex: '1 1 160px', minWidth: 160, bgcolor: 'background.paper', borderRadius: 1 }}>
          <InputLabel id="sort-select-label">Sort</InputLabel>
          <Select
            labelId="sort-select-label"
            value={sortBy}
            label="Sort"
            onChange={(e) => setSortBy(e.target.value)}
            IconComponent={SortIcon}
            sx={{ borderRadius: 1 }}
          >
            {SORT_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          sx={{ flexShrink: 0, borderRadius: 1 }}
        >
          Create Quote
        </Button>
      </Box>

      {rollbackNotice && (
        <Alert severity="warning" onClose={() => setRollbackNotice(null)} sx={{ mb: 1, flexShrink: 0 }}>
          {rollbackNotice}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Kanban Board - fixed viewport area with horizontal scroll */}
      <Box
        ref={boardScrollRef}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'hidden',
          display: 'flex',
          gap: 1.5,
          pb: 1,
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          '&::-webkit-scrollbar': {
            height: 10,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'action.hover',
            borderRadius: 5,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'text.disabled',
            borderRadius: 5,
            '&:hover': {
              backgroundColor: 'text.secondary',
            },
          },
        }}
      >
        {workflow.map((stepName, index) => {
          const isFirstStep = index === 0;
          const isLastStep = index === workflow.length - 1;
          const colCards = getFilteredCards(stepName, isFirstStep);
          const colColor = PREDEFINED_COLORS[index % PREDEFINED_COLORS.length];

          return (
            <Box
              key={stepName}
              sx={{
                flexShrink: 0,
                width: columnWidth,
                minWidth: columnWidth,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'action.hover',
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              {/* Sticky Column Header */}
              <Box
                sx={{
                  flexShrink: 0,
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '2px solid',
                  borderColor: colColor,
                  bgcolor: 'background.paper',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '-0.01em' }}>
                  {stepName}
                </Typography>
                <Chip
                  label={loading ? '...' : colCards.length}
                  size="small"
                  sx={{
                    fontWeight: 700,
                    bgcolor: colColor,
                    color: '#fff',
                    fontSize: '0.7rem',
                    height: 20,
                  }}
                />
              </Box>

              {/* Scrollable Cards Area */}
              <Box
                sx={{
                  flexGrow: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  p: 1.5,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1.5,
                  '&::-webkit-scrollbar': {
                    width: 6,
                  },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: 'divider',
                    borderRadius: 3,
                    '&:hover': {
                      backgroundColor: 'text.disabled',
                    },
                  },
                }}
              >
                {loading ? (
                  Array.from(new Array(3)).map((_, i) => (
                    <Card key={i} variant="outlined" sx={{ borderRadius: 1.5, flexShrink: 0 }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Skeleton width="40%" height={16} />
                        <Skeleton width="90%" height={32} sx={{ my: 0.5 }} />
                        <Skeleton width="55%" height={16} />
                      </CardContent>
                    </Card>
                  ))
                ) : colCards.length === 0 ? (
                  <Box
                    sx={{
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 80,
                      border: '1.5px dashed rgba(0,0,0,0.08)',
                      borderRadius: 1.5,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      No tasks
                    </Typography>
                  </Box>
                ) : (
                  colCards.map((card) => {
                    const titleId = isFirstStep
                      ? `JC-${String(card.job_number || 0).padStart(4, '0')}`
                      : `TASK-${String(card.task_number || 0).padStart(4, '0')}`;

                    const description = isFirstStep ? card.description : card.product_name;
                    const customerName = isFirstStep
                      ? card.customers?.name || 'Walk-in / Inquiry'
                      : card.job_cards?.customers?.name || 'Walk-in / Inquiry';

                    return (
                      <Card
                        key={isFirstStep ? card.job_id : card.task_id}
                        sx={{
                          flexShrink: 0,
                          borderRadius: 1.5,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          borderLeft: '3px solid',
                          borderLeftColor: colColor,
                          bgcolor: 'background.paper',
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                            transition: 'box-shadow 0.15s ease',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box
                            sx={{ cursor: 'pointer' }}
                            onClick={() => handleOpenDetails(card, isFirstStep ? 'job' : 'task')}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.75,
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 800, color: colColor }}>
                                {titleId}
                              </Typography>
                            </Box>

                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                mb: 0.75,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: 1.35,
                              }}
                            >
                              {description}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mb: 0.75 }}
                            >
                              Client: <strong>{customerName}</strong>
                            </Typography>

                            <Divider sx={{ my: 0.75 }} />

                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1,
                              }}
                            >
                              <Typography variant="caption" color="text.secondary">
                                Qty: <strong>{card.quantity}</strong>
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(card.created_at)}
                              </Typography>
                            </Box>
                          </Box>

                          {!isLastStep && (
                            <Button
                              variant="contained"
                              fullWidth
                              size="small"
                              startIcon={<CheckCircleIcon fontSize="small" />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToNext(card, isFirstStep ? 'job' : 'task', index);
                              }}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 700,
                                bgcolor: colColor,
                                borderRadius: 1,
                                py: 0.5,
                                fontSize: '0.8rem',
                                '&:hover': {
                                  bgcolor: colColor,
                                  filter: 'brightness(0.92)',
                                },
                              }}
                            >
                              {isFirstStep ? 'Generate Invoice' : 'Mark Finished'}
                            </Button>
                          )}
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
        <Box sx={{ width: { xs: 300, sm: 360 }, p: 2.5 }}>
          {activeCardDetails && (
            <React.Fragment>
              <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5 }}>
                {activeCardDetails.cardType === 'job' ? 'Job Quote Details' : 'Task Details'}
              </Typography>
              <Chip
                label={activeCardDetails.status.toUpperCase()}
                color={activeCardDetails.status === 'pending' ? 'warning' : 'primary'}
                size="small"
                sx={{ fontWeight: 700, mb: 2 }}
              />

              <List sx={{ mb: 2 }} disablePadding>
                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    DESCRIPTION / PRODUCT
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {activeCardDetails.cardType === 'job' ? activeCardDetails.description : activeCardDetails.product_name}
                  </Typography>
                </Box>

                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    QUANTITY
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {activeCardDetails.quantity}
                  </Typography>
                </Box>

                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    CUSTOMER
                  </Typography>
                  <Typography variant="body2">
                    {activeCardDetails.cardType === 'job'
                      ? activeCardDetails.customers?.name || 'Walk-in / Quote'
                      : activeCardDetails.job_cards?.customers?.name || 'Walk-in / Quote'}
                  </Typography>
                </Box>

                <Box mb={1.5}>
                  <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                    CREATED ON
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(activeCardDetails.created_at)}
                  </Typography>
                </Box>

                {activeCardDetails.cardType === 'task' && (
                  <React.Fragment>
                    {activeCardDetails.delivery_details && (
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                          DELIVERY INSTRUCTIONS
                        </Typography>
                        <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                          {activeCardDetails.delivery_details}
                        </Typography>
                      </Box>
                    )}
                    {activeCardDetails.notes && (
                      <Box mb={1.5}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.25}>
                          SPECIAL NOTES
                        </Typography>
                        <Typography variant="body2" sx={{ bgcolor: 'action.hover', p: 1, borderRadius: 1 }}>
                          {activeCardDetails.notes}
                        </Typography>
                      </Box>
                    )}
                  </React.Fragment>
                )}
              </List>

              <Divider sx={{ my: 1.5 }} />

              {activeCardDetails.cardType === 'job' && (
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <Button
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(activeCardDetails)}
                    fullWidth
                    size="small"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteClick(activeCardDetails)}
                    fullWidth
                    size="small"
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
        recordName={jobToDelete ? `JC-${String(jobToDelete.job_number || 0).padStart(4, '0')}` : ''}
        recordType="job card"
        details={dependencyDetails}
      />

      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete this quote? This action is permanent.
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

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
  Chip,
  Card,
  CardContent,
  Tooltip,
  Drawer,
  Divider,
  List,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

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

const PREDEFINED_COLORS = [
  '#ed6c02', // orange
  '#0288d1', // blue
  '#9c27b0', // purple
  '#ff9800', // warning orange
  '#00bcd4', // cyan
  '#2e7d32', // dark green
  '#757575', // gray
  '#e91e63', // pink
  '#3f51b5', // indigo
];

export const JobCardsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [jobs, setJobs] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [workflow, setWorkflow] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
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

  // Move task to next workflow step
  const handleMoveToNext = async (card, type, currentStepIndex) => {
    if (type === 'job') {
      // First step (New Orders) must convert to invoice first to proceed
      if (currentStepIndex === 0 && workflow.length > 1) {
        const matchedJob = jobs.find((j) => j.job_id === card.job_id);
        if (matchedJob) {
          navigate('/dashboard/invoices', { state: { kickoffJob: matchedJob } });
        }
      }
    } else {
      // Tasks just update their status to the next string in the workflow array
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

  const getFilteredCards = (stepName, isFirstStep) => {
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

    return filtered.sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
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
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          size="medium"
          placeholder="Search Job Orders..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, bgcolor: 'background.paper', borderRadius: 2 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddClick}
          size="large"
          sx={{ whiteSpace: 'nowrap' }}
        >
          Create Quote
        </Button>
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

      {/* Kanban Columns Grid using Swiper */}
      <Box
        sx={{
          flexGrow: 1,
          pb: 4,
          '.swiper': { height: '100%', pb: 3 },
          '.swiper-slide': { width: { xs: '100%', sm: 350, md: 350 } }, // Responsive widths
        }}
      >
        <Swiper
          modules={[Navigation, Pagination]}
          spaceBetween={16}
          slidesPerView={'auto'}
          navigation
          pagination={{ clickable: true, dynamicBullets: true }}
          grabCursor={true}
        >
          {workflow.map((stepName, index) => {
            const isFirstStep = index === 0;
            const isLastStep = index === workflow.length - 1;
            const colCards = getFilteredCards(stepName, isFirstStep);
            const colColor = PREDEFINED_COLORS[index % PREDEFINED_COLORS.length];

            return (
              <SwiperSlide key={stepName}>
                <Box
                  sx={{
                    bgcolor: 'action.hover',
                    borderRadius: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid rgba(0,0,0,0.06)',
                    height: '100%',
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
                      borderColor: colColor,
                      bgcolor: 'background.paper',
                      borderTopLeftRadius: 12,
                      borderTopRightRadius: 12,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase' }}>
                      {stepName}
                    </Typography>
                    <Chip
                      label={loading ? '...' : colCards.length}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: colColor,
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
                              borderRadius: 2,
                              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                              borderLeft: '4px solid',
                              borderLeftColor: colColor,
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.12)',
                                transition: 'all 0.2s ease-in-out',
                              },
                            }}
                          >
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                              <Box 
                                sx={{ cursor: 'pointer' }}
                                onClick={() => handleOpenDetails(card, isFirstStep ? 'job' : 'task')}
                              >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: colColor }}>
                                    {titleId}
                                  </Typography>
                                </Box>

                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  {description}
                                </Typography>

                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                  Client: <strong>{customerName}</strong>
                                </Typography>

                                <Divider sx={{ my: 1 }} />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    Qty: <strong>{card.quantity}</strong>
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatDate(card.created_at)}
                                  </Typography>
                                </Box>
                              </Box>

                              {/* Action Buttons for Employees */}
                              {!isLastStep && (
                                <Button 
                                  variant="contained" 
                                  fullWidth 
                                  size="small"
                                  startIcon={<CheckCircleIcon />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToNext(card, isFirstStep ? 'job' : 'task', index);
                                  }}
                                  sx={{ 
                                    textTransform: 'none', 
                                    fontWeight: 700,
                                    bgcolor: colColor,
                                    '&:hover': { bgcolor: colColor, filter: 'brightness(0.9)' }
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
              </SwiperSlide>
            );
          })}
        </Swiper>
      </Box>

      {/* Drawer Details Side Panel */}
      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: { xs: 300, sm: 360 }, p: 3 }}>
          {activeCardDetails && (
            <React.Fragment>
              <Typography variant="h6" sx={{ fontWeight: 900, mb: 2 }}>
                {activeCardDetails.cardType === 'job' ? 'Job Quote Details' : 'Task Details'}
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
        recordName={jobToDelete ? `JC-${String(jobToDelete.job_number || 0).padStart(4, '0')}` : ''}
        recordType="job card"
        details={dependencyDetails}
      />

      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
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

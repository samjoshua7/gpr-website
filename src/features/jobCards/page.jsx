import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  TextField,
  InputAdornment,
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
  Divider,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import ReceiptIcon from '@mui/icons-material/Receipt';

import { useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

import { formatDate } from '../../lib/formatDate';
import { HighlightText } from '../../components/ui/HighlightText';
import { getJobCards, deleteJobCard, updateJobStatus } from './api';
import { getCompanySettings } from '../settings/api';
import JobCardDialog from './components/JobCardDialog';
import JobCardDetailsModal from './components/JobCardDetailsModal';
import InvoiceDialog from '../salesInvoices/components/InvoiceDialog';
import InvoiceDetailsDialog from '../salesInvoices/components/InvoiceDetailsDialog';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';
import { useAuth } from '../../hooks/useAuth';
import {
  DndContext,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';

const DEFAULT_WORKFLOW = [
  'New Orders',
  'Designing',
  'Proof',
  'Printing',
  'Additional works',
  'Cutting',
  'Packing',
  'Out for Delivery',
  'Delivered',
];

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

const ColumnCardList = ({ children, colCardsCount }) => {
  const containerRef = useRef(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { scrollTop, clientHeight, scrollHeight } = el;
    setCanScrollUp(scrollTop > 5);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 5);
  }, []);

  useEffect(() => {
    checkScroll();
  }, [children, colCardsCount, checkScroll]);

  const handleScrollStep = (direction) => {
    const el = containerRef.current;
    if (!el) return;
    const step = 140;
    el.scrollBy({
      top: direction === 'up' ? -step : step,
      behavior: 'smooth',
    });
  };

  return (
    <Box sx={{ position: 'relative', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Up Indicator */}
      {canScrollUp && (
        <IconButton
          size="small"
          onClick={() => handleScrollStep('up')}
          sx={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            bgcolor: 'background.paper',
            boxShadow: 2,
            width: 28,
            height: 28,
            border: '1px solid rgba(0,0,0,0.12)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <KeyboardArrowUpIcon fontSize="small" />
        </IconButton>
      )}

      {/* Fixed Height Scrollable Container */}
      <Box
        ref={containerRef}
        onScroll={checkScroll}
        sx={{
          height: 'calc(100vh - 240px)',
          minHeight: 460,
          maxHeight: 700,
          p: 1.5,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.2) transparent',
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 3 },
          '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
        }}
      >
        {children}
      </Box>

      {/* Down Indicator */}
      {canScrollDown && (
        <IconButton
          size="small"
          onClick={() => handleScrollStep('down')}
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 4,
            bgcolor: 'background.paper',
            boxShadow: 2,
            width: 28,
            height: 28,
            border: '1px solid rgba(0,0,0,0.12)',
            '&:hover': { bgcolor: 'background.paper' },
          }}
        >
          <KeyboardArrowDownIcon fontSize="small" />
        </IconButton>
      )}
    </Box>
  );
};

const DroppableColumn = ({ stepName, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stepName });
  return (
    <Box
      ref={setNodeRef}
      sx={{
        bgcolor: isOver ? 'action.selected' : 'action.hover',
        borderRadius: 3,
        display: 'flex',
        flexDirection: 'column',
        border: isOver ? '2px solid #0288d1' : '1px solid rgba(0,0,0,0.06)',
        transition: 'all 0.2s ease',
        height: '100%',
      }}
    >
      {children}
    </Box>
  );
};

const DraggableCard = ({ id, card, stepName, children }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `job-${id}`,
    data: { card, stepName },
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

export const JobCardsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isStaff = profile?.role === 'STAFF';
  const isStakeholder = profile?.role === 'STAKEHOLDER';

  const [jobs, setJobs] = useState([]);
  const [workflow, setWorkflow] = useState(DEFAULT_WORKFLOW);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);

  const staffDepts = profile?.departments || [];
  const visibleWorkflow = isStaff && staffDepts.length > 0
    ? workflow.filter((step) => staffDepts.includes(step))
    : workflow;

  // Dialog Add/Edit state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  // Job Details Popup Modal state (replaces side drawer)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [activeJobDetails, setActiveJobDetails] = useState(null);

  // Invoice creation from Job Card
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [kickoffJobForInvoice, setKickoffJobForInvoice] = useState(null);

  // Invoice view popup
  const [invoiceViewId, setInvoiceViewId] = useState(null);
  const [invoiceViewOpen, setInvoiceViewOpen] = useState(false);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Deletion Safeguard
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  const boardRef = useRef(null);

  const fetchKanbanBoardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [jobsData, settingsData] = await Promise.all([
        getJobCards('', 'all', true),
        getCompanySettings(),
      ]);
      setJobs(jobsData || []);
      if (settingsData?.production_workflow && settingsData.production_workflow.length > 0) {
        setWorkflow(settingsData.production_workflow);
      }
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

  // Rollback notice checker
  useEffect(() => {
    if (location.state?.cancelKickoff) {
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
  };

  const handleDeleteClick = async (job) => {
    if (job.is_billed) {
      setJobToDelete(job);
      setDependencyDetails([
        {
          label: 'Sales Invoices',
          count: 1,
          examples: [job.linked_invoice?.invoice_no || 'Linked Invoice'],
        },
      ]);
      setCannotDeleteOpen(true);
      return;
    }

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

  // Card details modal popup
  const handleOpenDetails = (job) => {
    setActiveJobDetails(job);
    setDetailsModalOpen(true);
  };

  // Create invoice from job card
  const handleCreateInvoiceFromJob = (job) => {
    setKickoffJobForInvoice(job);
    setInvoiceDialogOpen(true);
  };

  // View invoice popup
  const handleViewInvoice = (invoiceId) => {
    setInvoiceViewId(invoiceId);
    setInvoiceViewOpen(true);
  };

  // Move task to next workflow step
  const handleMoveToNext = async (card, currentStepIndex) => {
    const lastStepIndex = workflow.length - 1;
    const isPenultimateStep = currentStepIndex === lastStepIndex - 1;

    // Delivery Guardrail: Cannot advance from last_dept - 1 to last_dept if not billed
    if (isPenultimateStep && !card.is_billed) {
      setWarningMessage(
        `Job Card JC-${String(card.job_number || 0).padStart(4, '0')} is [NOT BILLED]. Please create an invoice before moving to ${workflow[lastStepIndex]}.`
      );
      return;
    }

    const nextStep = workflow[currentStepIndex + 1];
    if (nextStep) {
      // Optimistic update
      const prevJobs = [...jobs];
      setJobs((prev) =>
        prev.map((j) => (j.job_id === card.job_id ? { ...j, status: nextStep } : j))
      );

      try {
        await updateJobStatus(card.job_id, nextStep);
      } catch (err) {
        console.error(err);
        setJobs(prevJobs);
        setError('Failed to update stage forward.');
      }
    }
  };

  // Move task to previous workflow step
  const handleMoveToPrevious = async (card, currentStepIndex) => {
    const prevStep = workflow[currentStepIndex - 1];
    if (prevStep && currentStepIndex > 0) {
      const prevJobs = [...jobs];
      setJobs((prev) =>
        prev.map((j) => (j.job_id === card.job_id ? { ...j, status: prevStep } : j))
      );

      try {
        await updateJobStatus(card.job_id, prevStep);
      } catch (err) {
        console.error(err);
        setJobs(prevJobs);
        setError('Failed to move stage backward.');
      }
    }
  };

  const getFilteredCards = (stepName) => {
    const query = searchQuery.toLowerCase().trim();
    return jobs
      .filter((j) => (j.status || workflow[0]) === stepName)
      .filter((j) => {
        if (!query) return true;
        const jcNum = `jc-${String(j.job_number || 0).padStart(4, '0')}`.toLowerCase();
        const rawNum = String(j.job_number || 0);
        const invNo = (j.linked_invoice?.invoice_no || '').toLowerCase();
        return (
          j.description?.toLowerCase().includes(query) ||
          j.customers?.name?.toLowerCase().includes(query) ||
          j.customers?.phone?.includes(query) ||
          jcNum.includes(query) ||
          rawNum.includes(query) ||
          invNo.includes(query)
        );
      });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || !active) return;
    const activeData = active.data.current;
    if (!activeData) return;

    const targetStepName = over.id;
    const { card, stepName } = activeData;

    if (stepName === targetStepName) return;

    const lastStepIndex = workflow.length - 1;
    const isTargetFinalStep = targetStepName === workflow[lastStepIndex];

    // Delivery Guardrail on drag-and-drop
    if (isTargetFinalStep && !card.is_billed) {
      setWarningMessage(
        `Job Card JC-${String(card.job_number || 0).padStart(4, '0')} is [NOT BILLED]. Please create an invoice before moving to ${workflow[lastStepIndex]}.`
      );
      return;
    }

    const previousJobs = [...jobs];
    setJobs((prev) =>
      prev.map((j) => (j.job_id === card.job_id ? { ...j, status: targetStepName } : j))
    );

    try {
      await updateJobStatus(card.job_id, targetStepName);
    } catch (err) {
      console.error(err);
      setJobs(previousJobs);
      setError('Failed to update stage via drag-and-drop.');
    }
  };

  return (
    <Box sx={{ p: 3, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Header Desk */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          variant="outlined"
          size="medium"
          placeholder="Search Job Cards by ID, customer name, description, or invoice..."
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
        {!isStakeholder && !isStaff && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddClick}
            size="large"
            sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}
          >
            Create Job Card
          </Button>
        )}
      </Box>

      {warningMessage && (
        <Alert severity="warning" onClose={() => setWarningMessage(null)} sx={{ mb: 2 }}>
          {warningMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Kanban Columns Grid using DndContext + Swiper */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <Box
          ref={boardRef}
          sx={{
            flexGrow: 1,
            pb: 4,
            '.swiper': { height: '100%', pb: 3 },
            '.swiper-slide': { width: { xs: '100%', sm: 350, md: 350 } },
          }}
        >
          <Swiper
            modules={[Navigation, Pagination, Mousewheel]}
            spaceBetween={16}
            slidesPerView={'auto'}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            mousewheel={{ forceToAxis: true, sensitivity: 1, releaseOnEdges: true }}
            grabCursor={false}
          >
            {visibleWorkflow.map((stepName) => {
              const fullIndex = workflow.indexOf(stepName);
              const isFirstStep = fullIndex === 0;
              const isLastStep = fullIndex === workflow.length - 1;
              const isPenultimateStep = fullIndex === workflow.length - 2;
              const colCards = getFilteredCards(stepName);
              const colColor = PREDEFINED_COLORS[(fullIndex >= 0 ? fullIndex : 0) % PREDEFINED_COLORS.length];

              return (
                <SwiperSlide key={stepName}>
                  <DroppableColumn stepName={stepName}>
                    {/* Column Header */}
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
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

                    {/* Cards List container with fixed height and edge scroll indicators */}
                    <ColumnCardList colCardsCount={colCards.length}>
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
                            No Job Cards
                          </Typography>
                        </Box>
                      ) : (
                        colCards.map((card) => {
                          const titleId = `JC-${String(card.job_number || 0).padStart(4, '0')}`;
                          const description = card.description || 'No description';
                          const customerName = card.customers?.name || 'Walk-in Customer';
                          const isBilled = !!card.is_billed;
                          const disableNext = isPenultimateStep && !isBilled;

                          return (
                            <DraggableCard
                              key={card.job_id}
                              id={card.job_id}
                              card={card}
                              stepName={stepName}
                            >
                              <Card
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
                                    onClick={() => handleOpenDetails(card)}
                                  >
                                    {/* Card Top Header: JC-XXXX and Billing Status Block */}
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 1,
                                      }}
                                    >
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: colColor }}>
                                        <HighlightText text={titleId} highlight={searchQuery} />
                                      </Typography>

                                      {/* Small Red/Green status block (hidden for staff) */}
                                      {!isStaff && (
                                        <Chip
                                          label={isBilled ? 'BILLED' : 'NOT BILLED'}
                                          size="small"
                                          sx={{
                                            height: 20,
                                            fontSize: '0.65rem',
                                            fontWeight: 800,
                                            bgcolor: isBilled ? '#2e7d32' : '#d32f2f',
                                            color: '#ffffff',
                                            borderRadius: 1,
                                          }}
                                        />
                                      )}
                                    </Box>

                                    {/* Job Description */}
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontWeight: 600,
                                        mb: 1,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                      }}
                                    >
                                      <HighlightText text={description} highlight={searchQuery} />
                                    </Typography>

                                    {/* Customer / Client */}
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      Client: <strong><HighlightText text={customerName} highlight={searchQuery} /></strong>
                                    </Typography>

                                    {/* Linked invoice badge if billed (hidden for staff) */}
                                    {!isStaff && isBilled && card.linked_invoice && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                        <ReceiptIcon sx={{ fontSize: '0.85rem', color: 'success.main' }} />
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark' }}>
                                          {card.linked_invoice.invoice_no}
                                        </Typography>
                                      </Box>
                                    )}

                                    <Divider sx={{ my: 1 }} />

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        Qty: <strong>{card.quantity}</strong>
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatDate(card.created_at)}
                                      </Typography>
                                    </Box>
                                  </Box>

                                  {/* Column Navigation Controls */}
                                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                                    {!isFirstStep ? (
                                      <IconButton
                                        size="small"
                                        color="inherit"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleMoveToPrevious(card, fullIndex);
                                        }}
                                        sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 1 }}
                                      >
                                        <ArrowBackIcon fontSize="small" />
                                      </IconButton>
                                    ) : (
                                      <Box />
                                    )}

                                    {!isLastStep && (
                                      <Tooltip
                                        title={
                                          disableNext
                                            ? 'Cannot deliver an unbilled job card. Please create an invoice first.'
                                            : `Move to ${workflow[fullIndex + 1]}`
                                        }
                                      >
                                        <span>
                                          <Button
                                            size="small"
                                            variant="contained"
                                            color={disableNext ? 'inherit' : 'primary'}
                                            disabled={disableNext}
                                            endIcon={disableNext ? <LockIcon fontSize="small" /> : <ArrowForwardIcon fontSize="small" />}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleMoveToNext(card, fullIndex);
                                            }}
                                            sx={{
                                              textTransform: 'none',
                                              fontWeight: 700,
                                              fontSize: '0.75rem',
                                            }}
                                          >
                                            Next Stage
                                          </Button>
                                        </span>
                                      </Tooltip>
                                    )}
                                  </Box>
                                </CardContent>
                              </Card>
                            </DraggableCard>
                          );
                        })
                      )}
                    </ColumnCardList>
                  </DroppableColumn>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </Box>
      </DndContext>

      {/* Job Card Details Popup Modal (Centered, not shelf) */}
      <JobCardDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        jobCard={activeJobDetails}
        onEdit={(job) => handleEditClick(job)}
        onDelete={(job) => handleDeleteClick(job)}
        onCreateInvoice={(job) => handleCreateInvoiceFromJob(job)}
        onViewInvoice={(invoiceId) => handleViewInvoice(invoiceId)}
        onRefresh={fetchKanbanBoardData}
        userRole={profile?.role}
        workflow={workflow}
      />

      {/* Job Card Add/Edit Form Dialog */}
      <JobCardDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        job={selectedJob}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Invoice Creation Dialog opened directly from Job Card */}
      <InvoiceDialog
        open={invoiceDialogOpen}
        onClose={() => {
          setInvoiceDialogOpen(false);
          setKickoffJobForInvoice(null);
        }}
        preselectedJob={kickoffJobForInvoice}
        onSaveSuccess={() => {
          setInvoiceDialogOpen(false);
          setKickoffJobForInvoice(null);
          fetchKanbanBoardData();
        }}
      />

      {/* Invoice Details Popup Modal */}
      <InvoiceDetailsDialog
        open={invoiceViewOpen}
        onClose={() => {
          setInvoiceViewOpen(false);
          setInvoiceViewId(null);
        }}
        invoiceId={invoiceViewId}
      />

      {/* Deletion Check Dialog */}
      <CannotDeleteDialog
        open={cannotDeleteOpen}
        onClose={() => setCannotDeleteOpen(false)}
        recordName={jobToDelete ? `JC-${String(jobToDelete.job_number || 0).padStart(4, '0')}` : ''}
        recordType="job card"
        details={dependencyDetails}
      />

      {/* Deletion Confirmation Dialog */}
      <Dialog open={deleteOpen} onClose={() => !deleteLoading && setDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <DialogContentText>
            Are you sure you want to delete this job card? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleteLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>
            Delete Job Card
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobCardsPage;

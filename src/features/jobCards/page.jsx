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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Badge,
} from '@mui/material';

import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import TuneIcon from '@mui/icons-material/Tune';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LockIcon from '@mui/icons-material/Lock';
import ReceiptIcon from '@mui/icons-material/Receipt';


import { useLocation, useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Mousewheel } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import { formatDate } from '../../lib/formatDate';
import { HighlightText } from '../../components/ui/HighlightText';
import { getJobCards, getCachedJobCards, deleteJobCard, updateJobStatus } from './api';
import { getCompanySettings, getCachedCompanySettings } from '../settings/api';
import { getCustomers, getCachedCustomers } from '../customers/api';
import JobCardDialog from './components/JobCardDialog';
import JobCardDetailsModal from './components/JobCardDetailsModal';
import InvoiceDialog from '../salesInvoices/components/InvoiceDialog';
import InvoiceDetailsDialog from '../salesInvoices/components/InvoiceDetailsDialog';
import { deleteSalesInvoice, voidSalesInvoice } from '../salesInvoices/api';
import { checkReferences } from '../../lib/referenceChecker';
import CannotDeleteDialog from '../../components/feedback/CannotDeleteDialog';
import { useAuth } from '../../hooks/useAuth';


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

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
const OLD_JOBS_COLOR = '#64748b';

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
    <Box sx={{ position: 'relative', flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
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

      {/* Flexible Scrollable Container with responsive height */}
      <Box
        ref={containerRef}
        onScroll={checkScroll}
        sx={{
          // Fill 100% of the flex column — parent SwiperSlide controls total height
          height: '100%',
          p: 1.5,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
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


// Simple column wrapper — no DnD, Swiper owns all pointer/touch events
const ColumnBox = ({ children }) => (
  <Box
    sx={{
      bgcolor: 'action.hover',
      borderRadius: 3,
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(0,0,0,0.06)',
      height: '100%',
      minHeight: 0,
      overflow: 'hidden',
    }}
  >
    {children}
  </Box>
);


export const JobCardsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isStaff = profile?.role === 'STAFF';
  const isStakeholder = profile?.role === 'STAKEHOLDER';

  const [jobs, setJobs] = useState(() => getCachedJobCards() || []);
  const [workflow, setWorkflow] = useState(() => getCachedCompanySettings()?.production_workflow || DEFAULT_WORKFLOW);
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [billingFilter, setBillingFilter] = useState('all');
  const [sortBy, setSortBy] = useState('fcfs');
  const [customersList, setCustomersList] = useState(() => getCachedCustomers() || []);
  const [loading, setLoading] = useState(() => !getCachedJobCards());
  const [error, setError] = useState(null);
  const [warningMessage, setWarningMessage] = useState(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Auto-maintained "OLD Jobs" column state (auto-collapses on reload)
  const [showOldJobs, setShowOldJobs] = useState(false);
  const [oldJobsDismissedDuringSearch, setOldJobsDismissedDuringSearch] = useState(false);

  // Search-time zero-result column collapse state
  const [manuallyExpandedCols, setManuallyExpandedCols] = useState(() => new Set());


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

  // Invoice management actions from Job Card
  const [invoiceToEditFromJob, setInvoiceToEditFromJob] = useState(null);
  const [invoiceEditDialogOpen, setInvoiceEditDialogOpen] = useState(false);
  const [invoiceToDeleteFromJob, setInvoiceToDeleteFromJob] = useState(null);
  const [deleteInvoiceDialogOpen, setDeleteInvoiceDialogOpen] = useState(false);
  const [deleteInvoiceLoading, setDeleteInvoiceLoading] = useState(false);
  const [deleteInvoiceError, setDeleteInvoiceError] = useState(null);
  const [invoiceToVoidFromJob, setInvoiceToVoidFromJob] = useState(null);
  const [voidInvoiceDialogOpen, setVoidInvoiceDialogOpen] = useState(false);
  const [voidInvoiceLoading, setVoidInvoiceLoading] = useState(false);
  const [voidInvoiceError, setVoidInvoiceError] = useState(null);
  const [cannotDeleteInvoiceOpen, setCannotDeleteInvoiceOpen] = useState(false);
  const [invoiceDependencyDetails, setInvoiceDependencyDetails] = useState([]);

  // Delete State
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // Deletion Safeguard
  const [cannotDeleteOpen, setCannotDeleteOpen] = useState(false);
  const [dependencyDetails, setDependencyDetails] = useState([]);

  const boardRef = useRef(null);
  const swiperRef = useRef(null);          // holds Swiper instance
  const scrollbarTrackRef = useRef(null);  // the track element
  const scrollbarDragRef = useRef(null);   // the drag thumb element

  // Update custom scrollbar thumb position/size based on Swiper translation and virtual size
  const syncScrollbar = useCallback((swiper) => {
    if (!scrollbarTrackRef.current || !scrollbarDragRef.current || !swiper) return;
    const trackWidth = scrollbarTrackRef.current.offsetWidth;
    if (!trackWidth) return;

    // Calculate ratio of viewport width to total content width
    const totalWidth = swiper.virtualSize || (swiper.slides?.length ? swiper.slides.length * 356 : 0);
    const viewWidth = swiper.width || trackWidth;
    const ratio = totalWidth > 0 ? Math.min(1, Math.max(0.08, viewWidth / totalWidth)) : 1;

    // Thumb width
    const thumbWidth = Math.max(40, trackWidth * ratio);
    const maxOffset = trackWidth - thumbWidth;

    // Swiper translation range
    let minTranslate = 0;
    let maxTranslate = 0;
    try {
      if (swiper.snapGrid && swiper.snapGrid.length > 0) {
        minTranslate = typeof swiper.minTranslate === 'function' ? swiper.minTranslate() : 0;
        maxTranslate = typeof swiper.maxTranslate === 'function' ? swiper.maxTranslate() : 0;
      }
    } catch {
      minTranslate = 0;
      maxTranslate = 0;
    }
    const totalScrollable = minTranslate - maxTranslate; // positive number

    let progress = 0;
    if (totalScrollable > 0) {
      const currentPos = minTranslate - (swiper.translate || 0);
      progress = Math.min(1, Math.max(0, currentPos / totalScrollable));
    } else if (typeof swiper.progress === 'number') {
      progress = Math.min(1, Math.max(0, swiper.progress));
    }

    const offset = progress * maxOffset;
    scrollbarDragRef.current.style.width = `${thumbWidth}px`;
    scrollbarDragRef.current.style.transform = `translateX(${offset}px)`;
  }, []);


  const fetchKanbanBoardData = useCallback(async (force = false, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [jobsData, settingsData, customersData] = await Promise.all([
        getJobCards('', 'all', force),
        getCompanySettings(force),
        getCustomers('', force),
      ]);
      setJobs(jobsData || []);
      if (settingsData?.production_workflow && settingsData.production_workflow.length > 0) {
        setWorkflow(settingsData.production_workflow);
      }
      setCustomersList(customersData || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch Kanban board components.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);


  useEffect(() => {
    const hasCached = jobs.length > 0;
    fetchKanbanBoardData(false, hasCached);
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
      fetchKanbanBoardData(true, true);
    } catch (err) {
      console.error(err);
      setDeleteError(err.message || 'Failed to delete job card.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    fetchKanbanBoardData(true, true);
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

  // Edit invoice from invoice details popup
  const handleEditInvoiceFromJob = (invoice) => {
    setInvoiceToEditFromJob(invoice);
    setInvoiceEditDialogOpen(true);
  };

  // Delete invoice from invoice details popup
  const handleDeleteInvoiceFromJob = async (invoice) => {
    try {
      const res = await checkReferences('sales_invoices', invoice.invoice_id);
      if (res.hasReferences) {
        setInvoiceToDeleteFromJob(invoice);
        setInvoiceDependencyDetails(res.details);
        setCannotDeleteInvoiceOpen(true);
      } else {
        setInvoiceToDeleteFromJob(invoice);
        setDeleteInvoiceError(null);
        setDeleteInvoiceDialogOpen(true);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to check dependencies for invoice deletion.');
    }
  };

  const handleConfirmDeleteInvoice = async () => {
    if (!invoiceToDeleteFromJob) return;
    setDeleteInvoiceLoading(true);
    setDeleteInvoiceError(null);
    try {
      await deleteSalesInvoice(invoiceToDeleteFromJob.invoice_id);
      setDeleteInvoiceDialogOpen(false);
      setInvoiceToDeleteFromJob(null);
      setInvoiceViewOpen(false);
      setInvoiceViewId(null);
      await fetchKanbanBoardData(true, true);
    } catch (err) {
      console.error(err);
      setDeleteInvoiceError(err.message || 'Failed to delete invoice.');
    } finally {
      setDeleteInvoiceLoading(false);
    }
  };

  // Void invoice from invoice details popup
  const handleVoidInvoiceFromJob = (invoice) => {
    setInvoiceToVoidFromJob(invoice);
    setVoidInvoiceError(null);
    setVoidInvoiceDialogOpen(true);
  };

  const handleConfirmVoidInvoice = async () => {
    if (!invoiceToVoidFromJob) return;
    setVoidInvoiceLoading(true);
    setVoidInvoiceError(null);
    try {
      await voidSalesInvoice(invoiceToVoidFromJob.invoice_id);
      setVoidInvoiceDialogOpen(false);
      setInvoiceToVoidFromJob(null);
      setInvoiceViewOpen(false);
      setInvoiceViewId(null);
      await fetchKanbanBoardData(true, true);
    } catch (err) {
      console.error(err);
      setVoidInvoiceError(err.message || 'Failed to void invoice.');
    } finally {
      setVoidInvoiceLoading(false);
    }
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

  const isOldJob = useCallback((job, wf = workflow) => {
    if (!wf || wf.length === 0) return false;
    const lastStep = wf[wf.length - 1];
    const currentStatus = job.status || wf[0];
    if (currentStatus !== lastStep) return false;
    if (!job.is_billed) return false;
    const deliveredDate = job.updated_at || job.created_at;
    if (!deliveredDate) return false;
    const ageMs = Date.now() - new Date(deliveredDate).getTime();
    return ageMs >= TEN_DAYS_MS;
  }, [workflow]);

  const getFilteredCards = (stepName) => {
    const isLastWorkflowStep = workflow.length > 0 && stepName === workflow[workflow.length - 1];
    const query = searchQuery.toLowerCase().trim();
    
    let cards = jobs.filter((j) => (j.status || workflow[0]) === stepName);

    // Auto-maintained OLD Jobs: exclude old jobs from the active final step column
    if (isLastWorkflowStep) {
      cards = cards.filter((j) => !isOldJob(j, workflow));
    }

    // 1. Customer Filter
    if (customerFilter && customerFilter !== 'all') {
      cards = cards.filter((j) => j.customer_id === customerFilter);
    }

    // 2. Billing Status Filter
    if (billingFilter === 'billed') {
      cards = cards.filter((j) => !!j.is_billed);
    } else if (billingFilter === 'unbilled') {
      cards = cards.filter((j) => !j.is_billed);
    }

    // 3. Search Query Filter
    if (query) {
      cards = cards.filter((j) => {
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
    }

    // 4. Multi-criteria Sorting
    return [...cards].sort((a, b) => {
      if (sortBy === 'fcfs') {
        // First-Come, First-Served: Oldest Created First
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.job_number || 0) - (b.job_number || 0);
      } else if (sortBy === 'newest') {
        // Newest Created First
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.job_number || 0) - (a.job_number || 0);
      } else if (sortBy === 'due_asc') {
        // Due Date Earliest First (jobs with due dates first)
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === 'due_desc') {
        // Due Date Latest First
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      } else if (sortBy === 'customer_asc') {
        // Customer Name A-Z
        const nameA = (a.customers?.name || '').toLowerCase();
        const nameB = (b.customers?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  };

  const getOldJobsCards = () => {
    const query = searchQuery.toLowerCase().trim();

    let cards = jobs.filter((j) => isOldJob(j, workflow));

    // 1. Customer Filter
    if (customerFilter && customerFilter !== 'all') {
      cards = cards.filter((j) => j.customer_id === customerFilter);
    }

    // 2. Billing Status Filter
    if (billingFilter === 'unbilled') {
      cards = [];
    }

    // 3. Search Query Filter
    if (query) {
      cards = cards.filter((j) => {
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
    }

    // 4. Multi-criteria Sorting
    return [...cards].sort((a, b) => {
      if (sortBy === 'fcfs') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return (a.job_number || 0) - (b.job_number || 0);
      } else if (sortBy === 'newest') {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        if (dateA !== dateB) return dateB - dateA;
        return (b.job_number || 0) - (a.job_number || 0);
      } else if (sortBy === 'due_asc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      } else if (sortBy === 'due_desc') {
        if (!a.due_date && !b.due_date) return 0;
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
      } else if (sortBy === 'customer_asc') {
        const nameA = (a.customers?.name || '').toLowerCase();
        const nameB = (b.customers?.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }
      return 0;
    });
  };

  const isSearching = Boolean(searchQuery.trim());

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setManuallyExpandedCols(new Set());
    setOldJobsDismissedDuringSearch(false);
  };

  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
    customerFilter !== 'all' ||
    billingFilter !== 'all' ||
    sortBy !== 'fcfs'
  );

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setCustomerFilter('all');
    setBillingFilter('all');
    setSortBy('fcfs');
    setManuallyExpandedCols(new Set());
    setOldJobsDismissedDuringSearch(false);
  };

  // Sync scrollbar thumb after data loads or slide configuration updates
  useEffect(() => {
    if (!loading && swiperRef.current) {
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          swiperRef.current?.update();
          syncScrollbar(swiperRef.current);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    }
  }, [loading, visibleWorkflow.length, syncScrollbar]);

  // Keep Swiper and custom scrollbar synced when searching, expanding old jobs, or toggling column spines
  useEffect(() => {
    if (swiperRef.current) {
      const raf = requestAnimationFrame(() => {
        swiperRef.current?.update();
        syncScrollbar(swiperRef.current);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [searchQuery, showOldJobs, manuallyExpandedCols, oldJobsDismissedDuringSearch, syncScrollbar]);

  const renderJobCard = (card, { colColor, isFirstStep, isLastStep, disableNext, fullIndex, isOldJobsCol = false }) => {
    const titleId = `JC-${String(card.job_number || 0).padStart(4, '0')}`;
    const description = card.description || 'No description';
    const customerName = card.customers?.name || 'Walk-in Customer';
    const isBilled = !!card.is_billed;

    return (
      <Card
        key={card.job_id}
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
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
            {!isFirstStep ? (
              <Tooltip
                title={
                  isStakeholder
                    ? 'Stakeholder read-only view'
                    : isOldJobsCol
                    ? `Move back to ${workflow[fullIndex - 1]}`
                    : `Move back to ${workflow[fullIndex - 1]}`
                }
              >
                <span>
                  <IconButton
                    size="small"
                    color="inherit"
                    disabled={isStakeholder}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToPrevious(card, fullIndex);
                    }}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 1.5,
                      p: 0.5,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'action.hover', borderColor: 'primary.main' },
                      ...(isStakeholder ? { color: 'text.disabled' } : {}),
                    }}
                  >
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            ) : (
              <Box />
            )}

            {!isLastStep && (
              <Tooltip
                title={
                  isStakeholder
                    ? 'Stakeholder read-only view'
                    : disableNext
                      ? 'Cannot deliver an unbilled job card. Please create an invoice first.'
                      : `Move to Next Stage: ${workflow[fullIndex + 1]}`
                }
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={disableNext || isStakeholder}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveToNext(card, fullIndex);
                    }}
                    sx={{
                      borderRadius: 1.5,
                      p: 0.5,
                      bgcolor: disableNext || isStakeholder ? 'action.disabledBackground' : 'primary.main',
                      color: disableNext || isStakeholder ? 'text.disabled' : '#ffffff',
                      border: '1px solid',
                      borderColor: disableNext || isStakeholder ? 'divider' : 'primary.dark',
                      boxShadow: disableNext || isStakeholder ? 'none' : '0 2px 4px rgba(0,0,0,0.12)',
                      '&:hover': {
                        bgcolor: disableNext || isStakeholder ? 'action.disabledBackground' : 'primary.dark',
                        transform: disableNext || isStakeholder ? 'none' : 'translateX(2px)',
                      },
                      transition: 'all 0.15s ease-in-out',
                    }}
                  >
                    {disableNext ? <LockIcon fontSize="small" /> : <ArrowForwardIcon fontSize="small" />}
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Multi-Filter & Search Toolbar */}
      <Paper
        variant="outlined"
        sx={{
          p: 1.25,
          mb: 1.5,
          borderRadius: 1.5,
          flexShrink: 0,
          bgcolor: 'background.paper',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <TextField
            variant="outlined"
            size="small"
            placeholder="Search JC#, Customer, Description, Invoice#..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleSearchChange('')} edge="end">
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ flexGrow: 1, minWidth: { xs: 160, sm: 220, md: 260 } }}
          />

          {/* Mobile Filter Toggle & Quick Guide Buttons (visible on xs only) */}
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Filter & Sort Options">
              <IconButton
                size="small"
                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                color={mobileFiltersOpen || customerFilter !== 'all' || billingFilter !== 'all' || sortBy !== 'fcfs' ? 'primary' : 'default'}
                sx={{
                  border: '1px solid',
                  borderColor: mobileFiltersOpen || customerFilter !== 'all' || billingFilter !== 'all' || sortBy !== 'fcfs' ? 'primary.main' : 'divider',
                  borderRadius: 1.5,
                  p: 0.7,
                }}
              >
                <Badge
                  badgeContent={
                    (customerFilter !== 'all' ? 1 : 0) +
                    (billingFilter !== 'all' ? 1 : 0) +
                    (sortBy !== 'fcfs' ? 1 : 0)
                  }
                  color="primary"
                >
                  <TuneIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Production Board Guide">
              <IconButton
                size="small"
                onClick={() => setGuideOpen(true)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  p: 0.7,
                }}
              >
                <HelpOutlineIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Filter Selectors (inline on sm+, collapsible dropdown on xs) */}
          <Box
            sx={{
              display: { xs: mobileFiltersOpen ? 'flex' : 'none', sm: 'flex' },
              gap: 1,
              flexWrap: 'wrap',
              alignItems: 'center',
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            {/* Customer Selector */}
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 170, md: 200 }, flexGrow: { xs: 1, sm: 0 } }}>
              <InputLabel id="jc-customer-filter-label">Customer</InputLabel>
              <Select
                labelId="jc-customer-filter-label"
                value={customerFilter}
                label="Customer"
                onChange={(e) => setCustomerFilter(e.target.value)}
              >
                <MenuItem value="all"><em>All Customers</em></MenuItem>
                {customersList.map((c) => (
                  <MenuItem key={c.customer_id} value={c.customer_id}>
                    {c.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Billing Status Filter */}
            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 130, md: 140 }, flexGrow: { xs: 1, sm: 0 } }}>
              <InputLabel id="jc-billing-filter-label">Billing</InputLabel>
              <Select
                labelId="jc-billing-filter-label"
                value={billingFilter}
                label="Billing"
                onChange={(e) => setBillingFilter(e.target.value)}
              >
                <MenuItem value="all">All Billing</MenuItem>
                <MenuItem value="billed">Billed Only</MenuItem>
                <MenuItem value="unbilled">Unbilled Only</MenuItem>
              </Select>
            </FormControl>

            {/* Sort Order Selector */}
            <FormControl size="small" sx={{ minWidth: { xs: '48%', sm: 180, md: 195 }, flexGrow: { xs: 1, sm: 0 } }}>
              <InputLabel id="jc-sort-filter-label">Sort Order</InputLabel>
              <Select
                labelId="jc-sort-filter-label"
                value={sortBy}
                label="Sort Order"
                onChange={(e) => setSortBy(e.target.value)}
              >
                <MenuItem value="fcfs"><strong>FCFS (Oldest First)</strong></MenuItem>
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="due_asc">Due Date (Earliest)</MenuItem>
                <MenuItem value="due_desc">Due Date (Latest)</MenuItem>
                <MenuItem value="customer_asc">Customer (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Desktop Guide Button (hidden on mobile xs) */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <Tooltip title="Production Board Guide & Shortcuts">
              <IconButton
                size="small"
                onClick={() => setGuideOpen(true)}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1.5,
                  p: 0.8,
                }}
              >
                <HelpOutlineIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Create Job Card Action Button */}
          {!isStaff && (
            <Tooltip title={isStakeholder ? 'Stakeholder read-only view' : ''}>
              <span>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleAddClick}
                  disabled={isStakeholder}
                  size="medium"
                  sx={{
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                    ml: { xs: 0, sm: 'auto' },
                    minWidth: { xs: 38, sm: 'auto' },
                    px: { xs: 1.25, sm: 2 },
                    ...(isStakeholder ? { color: 'text.disabled', bgcolor: 'action.disabledBackground' } : {}),
                  }}
                >
                  <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Create Job Card</Box>
                  <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Add</Box>
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* Active Filters Tag Bar */}
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', pt: 0.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
              Active Filters:
            </Typography>
            {searchQuery && (
              <Chip
                label={`Search: "${searchQuery}"`}
                size="small"
                onDelete={() => handleSearchChange('')}
                color="primary"
                variant="outlined"
              />
            )}
            {customerFilter !== 'all' && (
              <Chip
                label={`Customer: ${customersList.find((c) => c.customer_id === customerFilter)?.name || customerFilter}`}
                size="small"
                onDelete={() => setCustomerFilter('all')}
                color="primary"
                variant="outlined"
              />
            )}
            {billingFilter !== 'all' && (
              <Chip
                label={`Billing: ${billingFilter === 'billed' ? 'Billed Only' : 'Unbilled Only'}`}
                size="small"
                onDelete={() => setBillingFilter('all')}
                color={billingFilter === 'billed' ? 'success' : 'error'}
                variant="outlined"
              />
            )}
            {sortBy !== 'fcfs' && (
              <Chip
                label={`Sort: ${
                  sortBy === 'newest'
                    ? 'Newest First'
                    : sortBy === 'due_asc'
                    ? 'Due Date (Earliest)'
                    : sortBy === 'due_desc'
                    ? 'Due Date (Latest)'
                    : 'Customer (A-Z)'
                }`}
                size="small"
                onDelete={() => setSortBy('fcfs')}
                color="secondary"
                variant="outlined"
              />
            )}
            <Button
              size="small"
              color="inherit"
              onClick={handleResetAllFilters}
              sx={{ fontSize: '0.7rem', py: 0, px: 1, minHeight: 22, textTransform: 'none', color: 'text.secondary' }}
            >
              Clear All
            </Button>
          </Box>
        )}
      </Paper>

      {warningMessage && (
        <Alert severity="warning" onClose={() => setWarningMessage(null)} sx={{ mb: 1.5, flexShrink: 0 }}>
          {warningMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 1.5, flexShrink: 0 }}>
          {error}
        </Alert>
      )}

      {/* Kanban Columns — Swiper owns all pointer/touch events (DndKit removed) */}
      <Box
        ref={boardRef}
        sx={{
          flexGrow: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          '.swiper': {
            flex: 1,
            minHeight: 0,
            width: '100%',
            overflow: 'hidden',
          },
          '.swiper-wrapper': { height: '100%' },
          '.swiper-slide': {
            // Must be raw strings — Swiper reads this as CSS, cannot use MUI breakpoints
            width: '340px',
            height: '100%',
          },
          '.swiper-slide.collapsed-col-slide': {
            width: '52px !important',
            minWidth: '52px !important',
            maxWidth: '52px !important',
          },
          '.swiper-slide.old-jobs-trigger-slide': {
            width: '130px !important',
            minWidth: '130px !important',
            maxWidth: '130px !important',
          },
          '@media (max-width: 600px)': {
            '.swiper-slide:not(.collapsed-col-slide):not(.old-jobs-trigger-slide)': {
              width: 'calc(100vw - 32px)',
            },
          },
        }}
      >
        <Swiper
          modules={[Navigation, Mousewheel]}
          spaceBetween={16}
          slidesPerView={'auto'}
          simulateTouch={true}
          touchRatio={1}
          touchAngle={45}
          mousewheel={{ forceToAxis: true, releaseOnEdges: true, sensitivity: 1 }}
          touchReleaseOnEdges={true}
          grabCursor={false}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            requestAnimationFrame(() => {
              swiper.update();
              syncScrollbar(swiper);
            });
          }}
          onSetTranslate={(swiper) => syncScrollbar(swiper)}
          onProgress={(swiper) => syncScrollbar(swiper)}
          onSlideChange={(swiper) => syncScrollbar(swiper)}
          onResize={(swiper) => syncScrollbar(swiper)}
        >

            {visibleWorkflow.map((stepName) => {
              const fullIndex = workflow.indexOf(stepName);
              const isFirstStep = fullIndex === 0;
              const isLastStep = fullIndex === workflow.length - 1;
              const isPenultimateStep = fullIndex === workflow.length - 2;
              const colCards = getFilteredCards(stepName);
              const colColor = PREDEFINED_COLORS[(fullIndex >= 0 ? fullIndex : 0) % PREDEFINED_COLORS.length];

              const isZeroResults = isSearching && colCards.length === 0;
              const isManuallyExpanded = manuallyExpandedCols.has(stepName);
              const isColCollapsed = isZeroResults && !isManuallyExpanded;

              if (isColCollapsed) {
                return (
                  <SwiperSlide
                    key={stepName}
                    className="collapsed-col-slide"
                    style={{ width: '52px' }}
                    sx={{ width: '52px !important', minWidth: '52px !important', maxWidth: '52px !important' }}
                  >
                    <Tooltip title={`Click to expand ${stepName} (0 results)`} placement="top" arrow>
                      <Box
                        onClick={() => {
                          setManuallyExpandedCols((prev) => {
                            const next = new Set(prev);
                            next.add(stepName);
                            return next;
                          });
                        }}
                        sx={{
                          height: '100%',
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          border: '1px solid rgba(0,0,0,0.12)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          cursor: 'pointer',
                          py: 1.5,
                          px: 0.5,
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          '&:hover': {
                            bgcolor: 'grey.100',
                            borderColor: colColor,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            '& .expand-spine-icon': {
                              color: colColor,
                              transform: 'scale(1.15)',
                            },
                          },
                        }}
                      >
                        {/* Top Color Accent Line */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 4,
                            bgcolor: colColor,
                          }}
                        />

                        {/* Zero Count Badge */}
                        <Box
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            bgcolor: 'grey.200',
                            color: 'text.secondary',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mt: 1,
                            mb: 1.5,
                            flexShrink: 0,
                          }}
                        >
                          0
                        </Box>

                        {/* Vertical Department Spine Text */}
                        <Box
                          sx={{
                            flexGrow: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              fontWeight: 700,
                              fontSize: '0.78rem',
                              color: 'text.secondary',
                              letterSpacing: 0.5,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {stepName} — 0 results
                          </Typography>
                        </Box>

                        {/* Bottom Expand Plus Icon */}
                        <Box
                          className="expand-spine-icon"
                          sx={{
                            color: 'text.disabled',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s ease',
                            flexShrink: 0,
                            mt: 1,
                          }}
                        >
                          <AddIcon sx={{ fontSize: '1.1rem' }} />
                        </Box>
                      </Box>
                    </Tooltip>
                  </SwiperSlide>
                );
              }

              return (
                <SwiperSlide key={stepName}>
                  <ColumnBox>
                    {/* Column Header */}
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '2px solid',
                        borderColor: colColor,
                        bgcolor: 'background.paper',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, overflow: 'hidden' }}>
                        <Typography variant="subtitle2" noWrap sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem' }}>
                          {stepName}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Chip
                          label={loading && jobs.length === 0 ? '...' : colCards.length}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: colColor,
                            color: '#fff',
                            fontSize: '0.75rem',
                            height: 22,
                          }}
                        />
                        {isSearching && isZeroResults && isManuallyExpanded && (
                          <Tooltip title={`Collapse ${stepName}`}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setManuallyExpandedCols((prev) => {
                                  const next = new Set(prev);
                                  next.delete(stepName);
                                  return next;
                                });
                              }}
                              sx={{
                                p: 0.25,
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </Box>

                    {/* Cards List container with fixed height and edge scroll indicators */}
                    <ColumnCardList colCardsCount={colCards.length}>
                      {(loading && jobs.length === 0) ? (
                        Array.from({ length: 3 }).map((_, i) => (
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
                        colCards.map((card) =>
                          renderJobCard(card, {
                            colColor,
                            isFirstStep,
                            isLastStep,
                            disableNext: isPenultimateStep && !card.is_billed,
                            fullIndex,
                          })
                        )
                      )}
                    </ColumnCardList>
                  </ColumnBox>
                </SwiperSlide>
              );
            })}

            {/* Auto-Maintained OLD Jobs Column */}
            {(!isStaff || staffDepts.includes(workflow[workflow.length - 1])) && (() => {
              const allOldJobs = jobs.filter((j) => isOldJob(j, workflow));
              const oldJobsCards = getOldJobsCards();
              const shouldAutoExpandOldJobs = isSearching && oldJobsCards.length > 0 && !oldJobsDismissedDuringSearch;
              const isOldJobsExpanded = showOldJobs || shouldAutoExpandOldJobs;

              if (!isOldJobsExpanded) {
                return (
                  <SwiperSlide
                    key="old-jobs-trigger"
                    className="old-jobs-trigger-slide"
                    style={{ width: '130px' }}
                    sx={{ width: '130px !important', minWidth: '130px !important', maxWidth: '130px !important' }}
                  >
                    <Tooltip title="Show older delivered & billed jobs (10+ days)" placement="top" arrow>
                      <Box
                        onClick={() => setShowOldJobs(true)}
                        sx={{
                          height: '100%',
                          bgcolor: 'background.paper',
                          borderRadius: 2,
                          border: '2px dashed',
                          borderColor: 'grey.400',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1.5,
                          cursor: 'pointer',
                          p: 2,
                          userSelect: 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'grey.600',
                            bgcolor: 'grey.100',
                            transform: 'translateY(-2px)',
                            boxShadow: 2,
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            bgcolor: 'grey.200',
                            color: 'text.secondary',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <AddIcon />
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              letterSpacing: 0.8,
                              color: 'text.secondary',
                              display: 'block',
                              textTransform: 'uppercase',
                              fontSize: '0.75rem',
                            }}
                          >
                            OLD Jobs
                          </Typography>
                          <Chip
                            label={isSearching ? oldJobsCards.length : allOldJobs.length}
                            size="small"
                            sx={{
                              mt: 0.75,
                              fontWeight: 700,
                              bgcolor: 'grey.500',
                              color: '#fff',
                              fontSize: '0.72rem',
                              height: 20,
                            }}
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.68rem',
                            color: 'text.disabled',
                            textAlign: 'center',
                            lineHeight: 1.2,
                          }}
                        >
                          + Show older
                        </Typography>
                      </Box>
                    </Tooltip>
                  </SwiperSlide>
                );
              }

              return (
                <SwiperSlide key="old-jobs-expanded">
                  <ColumnBox>
                    {/* Column Header */}
                    <Box
                      sx={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 2,
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '2px solid',
                        borderColor: OLD_JOBS_COLOR,
                        bgcolor: 'background.paper',
                        borderTopLeftRadius: 12,
                        borderTopRightRadius: 12,
                        flexShrink: 0,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '0.85rem', color: OLD_JOBS_COLOR }}>
                          OLD Jobs
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={loading && jobs.length === 0 ? '...' : oldJobsCards.length}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: OLD_JOBS_COLOR,
                            color: '#fff',
                            fontSize: '0.75rem',
                            height: 22,
                          }}
                        />
                        <Tooltip title="Collapse OLD Jobs">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setShowOldJobs(false);
                              if (isSearching) {
                                setOldJobsDismissedDuringSearch(true);
                              }
                            }}
                            sx={{
                              p: 0.25,
                              color: 'text.secondary',
                              '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
                            }}
                          >
                            <RemoveIcon sx={{ fontSize: '1.1rem' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Cards List container */}
                    <ColumnCardList colCardsCount={oldJobsCards.length}>
                      {(loading && jobs.length === 0) ? (
                        Array.from({ length: 3 }).map((_, i) => (
                          <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                            <CardContent sx={{ p: 2 }}>
                              <Skeleton width="40%" height={20} />
                              <Skeleton width="80%" height={40} sx={{ my: 1 }} />
                              <Skeleton width="60%" height={20} />
                            </CardContent>
                          </Card>
                        ))
                      ) : oldJobsCards.length === 0 ? (
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
                            No Old Jobs
                          </Typography>
                        </Box>
                      ) : (
                        oldJobsCards.map((card) =>
                          renderJobCard(card, {
                            colColor: OLD_JOBS_COLOR,
                            isFirstStep: false,
                            isLastStep: true,
                            disableNext: true,
                            fullIndex: workflow.length - 1,
                            isOldJobsCol: true,
                          })
                        )
                      )}
                    </ColumnCardList>
                  </ColumnBox>
                </SwiperSlide>
              );
            })()}
        </Swiper>

          {/* Custom horizontal scrollbar — rendered OUTSIDE Swiper overflow:hidden so it is always visible */}
          <Box
            ref={scrollbarTrackRef}
            onClick={(e) => {
              if (!swiperRef.current || !scrollbarTrackRef.current) return;
              const rect = scrollbarTrackRef.current.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const progress = Math.min(1, Math.max(0, clickX / rect.width));
              const swiper = swiperRef.current;
              const minT = swiper.minTranslate ? swiper.minTranslate() : 0;
              const maxT = swiper.maxTranslate ? swiper.maxTranslate() : 0;
              const targetTranslate = minT - progress * (minT - maxT);
              swiper.setTranslate(targetTranslate);
              swiper.updateProgress(targetTranslate);
              syncScrollbar(swiper);
            }}
            sx={{
              display: { xs: 'none', sm: 'block' }, // desktop only — mobile uses touch swipe
              flexShrink: 0,
              height: '10px',
              mt: '6px',
              mx: '4px',
              borderRadius: '5px',
              backgroundColor: 'rgba(0,0,0,0.08)',
              position: 'relative',
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <Box
              ref={scrollbarDragRef}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const track = scrollbarTrackRef.current;
                const drag = scrollbarDragRef.current;
                const swiper = swiperRef.current;
                if (!track || !drag || !swiper) return;
                const startX = e.clientX;
                const trackWidth = track.offsetWidth;
                const thumbWidth = drag.offsetWidth;
                const maxOffset = trackWidth - thumbWidth;
                if (maxOffset <= 0) return;

                const minT = swiper.minTranslate ? swiper.minTranslate() : 0;
                const maxT = swiper.maxTranslate ? swiper.maxTranslate() : 0;
                const totalScrollable = minT - maxT;

                const currentPos = minT - (swiper.translate || 0);
                const initialProgress = totalScrollable > 0 ? currentPos / totalScrollable : 0;
                const startOffset = initialProgress * maxOffset;

                const onMove = (ev) => {
                  const delta = ev.clientX - startX;
                  const newOffset = Math.min(maxOffset, Math.max(0, startOffset + delta));
                  const progress = newOffset / maxOffset;
                  const targetTranslate = minT - progress * totalScrollable;
                  swiper.setTranslate(targetTranslate);
                  swiper.updateProgress(targetTranslate);
                  syncScrollbar(swiper);
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                backgroundColor: 'primary.main',
                borderRadius: '5px',
                cursor: 'grab',
                transition: 'background-color 0.15s',
                '&:active': { cursor: 'grabbing', backgroundColor: 'primary.dark' },
                '&:hover': { backgroundColor: 'primary.dark' },
              }}
            />
          </Box>
      </Box>

      {/* Production Board Quick User Guide Modal */}
      <Dialog open={guideOpen} onClose={() => setGuideOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: 1 }}>
          <HelpOutlineIcon color="primary" />
          Production Board Guide & Shortcuts
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                1. Horizontal Navigation (Panning Departments)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Desktop Bottom Scrollbar:</strong> Click and drag the horizontal scrollbar bar at the bottom of the board.
                <br />
                • <strong>Mouse Wheel Shortcut:</strong> Hold <code>Shift</code> and roll your mouse wheel to pan smoothly left and right across all stages.
                <br />
                • <strong>Arrow Buttons:</strong> Click the Swiper arrows on the edges to jump across departments.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                2. Moving Job Cards Between Stages
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • <strong>Quick Arrow Buttons:</strong> Click the <code>[→]</code> button on any card to immediately advance it to the next department, or <code>[←]</code> to move it back.
                <br />
                • <strong>Card Details:</strong> Click any card to view full job specifications, linked invoices, and status history.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="primary.main" gutterBottom>
                3. FCFS (First-Come, First-Served) Priority
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Cards in each column automatically default to <strong>FCFS order</strong> (earliest registered jobs at the top) so operators work on older orders first.
                <br />
                • Use the <strong>Sort Order</strong> selector to sort by Newest First, Due Date, or Customer Name.
              </Typography>
            </Paper>

            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="warning.main" gutterBottom>
                4. Delivery & Billing Safeguard
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • An unbilled Job Card cannot be moved into the final <strong>"Delivered"</strong> stage (a lock icon will appear).
                <br />
                • Click the card, select <strong>Create Sales Invoice</strong>, and complete the bill to unlock final delivery.
              </Typography>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setGuideOpen(false)} variant="contained" sx={{ fontWeight: 700 }}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>


      {/* Job Card Details Popup Modal (Centered, not shelf) */}
      <JobCardDetailsModal
        open={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        jobCard={activeJobDetails}
        onEdit={(job) => handleEditClick(job)}
        onDelete={(job) => handleDeleteClick(job)}
        onCreateInvoice={(job) => handleCreateInvoiceFromJob(job)}
        onViewInvoice={(invoiceId) => handleViewInvoice(invoiceId)}
        onRefresh={() => fetchKanbanBoardData(true, true)}
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
          fetchKanbanBoardData(true, true);
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
        onEdit={handleEditInvoiceFromJob}
        onVoid={handleVoidInvoiceFromJob}
        onDelete={handleDeleteInvoiceFromJob}
      />

      {/* In-Place Invoice Editor Dialog when editing from Job Card */}
      <InvoiceDialog
        open={invoiceEditDialogOpen}
        onClose={() => {
          setInvoiceEditDialogOpen(false);
          setInvoiceToEditFromJob(null);
        }}
        editInvoice={invoiceToEditFromJob}
        onSaveSuccess={() => {
          setInvoiceEditDialogOpen(false);
          setInvoiceToEditFromJob(null);
          fetchKanbanBoardData(true, true);
        }}
      />

      {/* Cannot Delete Invoice Safeguard Dialog */}
      <CannotDeleteDialog
        open={cannotDeleteInvoiceOpen}
        onClose={() => setCannotDeleteInvoiceOpen(false)}
        recordName={invoiceToDeleteFromJob?.invoice_no}
        recordType="sales invoice"
        details={invoiceDependencyDetails}
      />

      {/* Delete Invoice Confirmation Dialog */}
      <Dialog open={deleteInvoiceDialogOpen} onClose={() => !deleteInvoiceLoading && setDeleteInvoiceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Invoice Deletion</DialogTitle>
        <DialogContent>
          {deleteInvoiceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteInvoiceError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to delete invoice <strong>{invoiceToDeleteFromJob?.invoice_no}</strong>?
            This will remove the invoice and reset this job card to unbilled. This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteInvoiceDialogOpen(false)} disabled={deleteInvoiceLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteInvoice} color="error" variant="contained" disabled={deleteInvoiceLoading}>
            {deleteInvoiceLoading ? 'Deleting...' : 'Delete Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Void Invoice Confirmation Dialog */}
      <Dialog open={voidInvoiceDialogOpen} onClose={() => !voidInvoiceLoading && setVoidInvoiceDialogOpen(false)}>
        <DialogTitle sx={{ fontWeight: 700 }}>Void Invoice</DialogTitle>
        <DialogContent>
          {voidInvoiceError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {voidInvoiceError}
            </Alert>
          )}
          <DialogContentText>
            Are you sure you want to void invoice <strong>{invoiceToVoidFromJob?.invoice_no}</strong>?
            Its status will be updated to void, and it will remain in records for accounting safety audits.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setVoidInvoiceDialogOpen(false)} disabled={voidInvoiceLoading} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmVoidInvoice} color="warning" variant="contained" disabled={voidInvoiceLoading}>
            {voidInvoiceLoading ? 'Voiding...' : 'Void Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

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

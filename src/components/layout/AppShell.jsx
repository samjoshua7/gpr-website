import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
  Button,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LayersIcon from '@mui/icons-material/Layers';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BadgeIcon from '@mui/icons-material/Badge';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 68;
const HEADER_HEIGHT = 54;

export const AppShell = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('gpr_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('gpr_sidebar_collapsed', String(next));
      } catch (e) {
        console.warn('LocalStorage error', e);
      }
      return next;
    });
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOutClick = async () => {
    await signOut();
  };

  // Categorized Navigation Menu Definitions
  const navigationCategories = [
    {
      category: 'Operations',
      items: [
        { text: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/dashboard', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
        { text: 'Job Cards', icon: <AssignmentIcon fontSize="small" />, path: '/dashboard/jobs', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'] },
      ],
    },
    {
      category: 'Sales & Invoicing',
      items: [
        { text: 'Quotations', icon: <RequestQuoteIcon fontSize="small" />, path: '/dashboard/quotations', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
        { text: 'Sales Invoices', icon: <DescriptionIcon fontSize="small" />, path: '/dashboard/invoices', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
        { text: 'Receipts', icon: <AttachMoneyIcon fontSize="small" />, path: '/dashboard/receipts', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
        { text: 'Customers', icon: <PeopleIcon fontSize="small" />, path: '/dashboard/customers', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
      ],
    },
    {
      category: 'Stock & Catalog',
      items: [
        { text: 'Inventory', icon: <LayersIcon fontSize="small" />, path: '/dashboard/inventory', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
      ],
    },
    {
      category: 'Financials & Reports',
      items: [
        { text: 'Statements', icon: <ReceiptIcon fontSize="small" />, path: '/dashboard/statements', roles: ['SUPER_ADMIN', 'ACCOUNTS', 'STAKEHOLDER'] },
      ],
    },
    {
      category: 'Administration',
      items: [
        { text: 'Employees', icon: <BadgeIcon fontSize="small" />, path: '/dashboard/employees', roles: ['SUPER_ADMIN', 'STAKEHOLDER'] },
        { text: 'Company Settings', icon: <SettingsIcon fontSize="small" />, path: '/dashboard/settings', roles: ['SUPER_ADMIN', 'STAKEHOLDER'] },
      ],
    },
  ];

  const userRole = profile?.role || 'STAFF';

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ACCOUNTS': return 'Accounts Staff';
      case 'STAFF': return 'Staff (Operator)';
      case 'STAKEHOLDER': return 'Stakeholder';
      default: return 'User';
    }
  };

  const isMini = collapsed && !isMobile;
  const currentDrawerWidth = isMobile ? DRAWER_WIDTH : isMini ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const renderDrawerContent = (isMobileDrawer = false) => {
    const showMini = !isMobileDrawer && isMini;

    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#ffffff', overflow: 'hidden' }}>
        {/* Sidebar Branding & Collapse Toggle Header */}
        <Box
          sx={{
            height: HEADER_HEIGHT,
            display: 'flex',
            alignItems: 'center',
            justifyContent: showMini ? 'center' : 'space-between',
            px: showMini ? 1 : 2,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
            <Box
              sx={{
                width: 30,
                height: 30,
                borderRadius: 1,
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: showMini ? 0 : 1.25,
                p: 0.4,
                flexShrink: 0,
              }}
            >
              <Box component="img" src="/favicon.svg" alt="G.P.R. Logo" sx={{ width: 20, height: 20, objectFit: 'contain' }} />
            </Box>
            {!showMini && (
              <Box sx={{ overflow: 'hidden' }}>
                <Typography sx={{ fontWeight: 800, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1.2, color: '#ffffff', whiteSpace: 'nowrap' }}>
                  GPR Printers
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.625rem', whiteSpace: 'nowrap' }}>
                  Since 1997 • Tirunelveli
                </Typography>
              </Box>
            )}
          </Box>

          {!isMobileDrawer && (
            <Tooltip title={showMini ? 'Expand Sidebar' : 'Collapse Sidebar'} placement="right">
              <IconButton
                size="small"
                onClick={toggleCollapsed}
                sx={{
                  color: 'rgba(255, 255, 255, 0.65)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  p: 0.5,
                  ml: showMini ? 0 : 1,
                  display: showMini ? 'none' : 'flex',
                  '&:hover': { color: '#ffffff', bgcolor: 'rgba(255, 255, 255, 0.12)' },
                }}
              >
                <ChevronLeftIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Mini expand toggle button if collapsed */}
        {showMini && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Tooltip title="Expand Sidebar" placement="right">
              <IconButton
                size="small"
                onClick={toggleCollapsed}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  p: 0.5,
                  '&:hover': { color: '#38bdf8', bgcolor: 'rgba(255, 255, 255, 0.08)' },
                }}
              >
                <ChevronRightIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}

        {/* Sidebar Navigation Items with Categorized Sections */}
        <List
          sx={{
            px: showMini ? 0.75 : 1,
            py: 1,
            flexGrow: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderRadius: 2 },
          }}
        >
          {navigationCategories.map((group, groupIdx) => {
            const filteredItems = group.items.filter((item) => item.roles.includes(userRole));
            if (filteredItems.length === 0) return null;

            return (
              <Box key={group.category} sx={{ mb: groupIdx === navigationCategories.length - 1 ? 0 : 1.25 }}>
                {!showMini ? (
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: 'transparent',
                      color: 'rgba(255, 255, 255, 0.45)',
                      fontSize: '0.625rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      lineHeight: '22px',
                      px: 1.5,
                      mt: groupIdx === 0 ? 0 : 0.75,
                    }}
                  >
                    {group.category}
                  </ListSubheader>
                ) : (
                  groupIdx > 0 && <Divider sx={{ my: 0.75, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
                )}

                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const buttonContent = (
                    <ListItemButton
                      component={Link}
                      to={item.path}
                      onClick={isMobile ? handleDrawerToggle : undefined}
                      sx={{
                        borderRadius: 1,
                        py: 0.6,
                        px: showMini ? 0 : 1.5,
                        minHeight: 36,
                        justifyContent: showMini ? 'center' : 'flex-start',
                        bgcolor: isActive ? 'rgba(2, 132, 199, 0.22)' : 'transparent',
                        color: isActive ? '#38bdf8' : '#ffffff',
                        position: 'relative',
                        '&:hover': {
                          bgcolor: isActive ? 'rgba(2, 132, 199, 0.28)' : 'rgba(255, 255, 255, 0.08)',
                          color: isActive ? '#38bdf8' : '#ffffff',
                        },
                        '&::before': isActive
                          ? {
                              content: '""',
                              position: 'absolute',
                              left: 0,
                              top: '15%',
                              bottom: '15%',
                              width: 3.5,
                              borderRadius: '0 2px 2px 0',
                              bgcolor: '#0284c7',
                            }
                          : undefined,
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: showMini ? 'unset' : 32,
                          color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.75)',
                          justifyContent: 'center',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      {!showMini && (
                        <ListItemText
                          primary={item.text}
                          primaryTypographyProps={{
                            fontSize: '0.8125rem',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#38bdf8' : '#ffffff',
                            noWrap: true,
                          }}
                        />
                      )}
                    </ListItemButton>
                  );

                  return (
                    <ListItem key={item.text} disablePadding sx={{ mb: 0.25, display: 'block' }}>
                      {showMini ? (
                        <Tooltip title={`${item.text} (${group.category})`} placement="right" arrow>
                          {buttonContent}
                        </Tooltip>
                      ) : (
                        buttonContent
                      )}
                    </ListItem>
                  );
                })}
              </Box>
            );
          })}
        </List>

        {/* Sidebar User Footer Info */}
        <Box sx={{ p: showMini ? 1 : 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}>
          {!showMini ? (
            <React.Fragment>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 0.75, borderRadius: 1, bgcolor: 'rgba(255, 255, 255, 0.04)', mb: 0.75 }}>
                <Avatar sx={{ bgcolor: 'secondary.main', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', width: 28, height: 28, mr: 1.25, borderRadius: 0.75 }}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box sx={{ overflow: 'hidden' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', noWrap: true, color: '#ffffff' }}>
                    {profile?.name || 'User'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.6875rem', noWrap: true, display: 'block' }}>
                    {getRoleLabel(profile?.role)}
                  </Typography>
                </Box>
              </Box>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                color="inherit"
                startIcon={<LogoutIcon fontSize="small" />}
                onClick={handleSignOutClick}
                sx={{
                  borderRadius: 1,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.75)',
                  py: 0.4,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': {
                    borderColor: '#ffffff',
                    color: '#ffffff',
                    bgcolor: 'rgba(255, 255, 255, 0.08)',
                  },
                }}
              >
                Sign Out
              </Button>
            </React.Fragment>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`${profile?.name || 'User'} (${getRoleLabel(profile?.role)})`} placement="right">
                <Avatar sx={{ bgcolor: 'secondary.main', color: '#ffffff', fontWeight: 700, fontSize: '0.75rem', width: 32, height: 32, borderRadius: 1 }}>
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </Tooltip>
              <Tooltip title="Sign Out" placement="right">
                <IconButton
                  size="small"
                  onClick={handleSignOutClick}
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    '&:hover': { color: '#f87171', bgcolor: 'rgba(255, 255, 255, 0.08)' },
                  }}
                >
                  <LogoutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', maxHeight: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      {/* Mobile Menu Toggle (Floating) */}
      <IconButton
        color="primary"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{
          display: { md: 'none' },
          position: 'fixed',
          top: 12,
          left: 12,
          bgcolor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
          zIndex: (theme) => theme.zIndex.drawer - 1,
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* Drawer Side Navigation */}
      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        }}
      >
        {/* Mobile Temporary Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(15, 23, 42, 0.08)',
            },
          }}
        >
          {renderDrawerContent(true)}
        </Drawer>

        {/* Desktop Permanent Collapsible Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              borderRight: '1px solid rgba(15, 23, 42, 0.08)',
              overflowX: 'hidden',
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
            },
          }}
          open
        >
          {renderDrawerContent(false)}
        </Drawer>
      </Box>

      {/* Main Content Area - Full-Height Fixed Viewport (No Double Scrolling) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          height: '100vh',
          maxHeight: '100vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { xs: 6.5, md: 2 },
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppShell;


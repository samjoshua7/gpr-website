import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Chip,
  Tooltip,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import LayersIcon from '@mui/icons-material/Layers';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PaymentsIcon from '@mui/icons-material/Payments';
import BadgeIcon from '@mui/icons-material/Badge';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const DRAWER_WIDTH = 260;

export const AppShell = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOutClick = async () => {
    handleProfileMenuClose();
    await signOut();
  };

  // Navigation menu definitions
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/dashboard', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Customers', icon: <PeopleIcon fontSize="small" />, path: '/dashboard/customers', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Job Cards', icon: <AssignmentIcon fontSize="small" />, path: '/dashboard/jobs', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Sales Invoices', icon: <DescriptionIcon fontSize="small" />, path: '/dashboard/invoices', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Receipts', icon: <AttachMoneyIcon fontSize="small" />, path: '/dashboard/receipts', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Inventory', icon: <LayersIcon fontSize="small" />, path: '/dashboard/inventory', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Suppliers', icon: <BusinessIcon fontSize="small" />, path: '/dashboard/suppliers', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Purchase Bills', icon: <ReceiptIcon fontSize="small" />, path: '/dashboard/purchase-bills', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Payments', icon: <PaymentsIcon fontSize="small" />, path: '/dashboard/payments', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Employees', icon: <BadgeIcon fontSize="small" />, path: '/dashboard/employees', roles: ['SUPER_ADMIN'] },
    { text: 'Company Settings', icon: <SettingsIcon fontSize="small" />, path: '/dashboard/settings', roles: ['SUPER_ADMIN'] },
  ];

  const userRole = profile?.role || 'STAFF';
  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#ffffff' }}>
      {/* Sidebar Branding Header */}
      <Box
        sx={{
          height: 70,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 1.5,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            p: 0.5,
          }}
        >
          <Box component="img" src="/favicon.svg" alt="G.P.R. ERP Logo" sx={{ width: 24, height: 24, objectFit: 'contain' }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2, color: '#ffffff' }}>
            G.P.R. ERP
          </Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
            Press Management
          </Typography>
        </Box>
      </Box>

      {/* Sidebar Navigation Items */}
      <List sx={{ px: 1.5, py: 2, flexGrow: 1, overflowY: 'auto' }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  px: 2,
                  bgcolor: isActive ? 'rgba(2, 132, 199, 0.16)' : 'transparent',
                  color: isActive ? '#38bdf8' : 'rgba(248, 250, 252, 0.75)',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(2, 132, 199, 0.22)' : 'rgba(255, 255, 255, 0.06)',
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
                        borderRadius: '0 4px 4px 0',
                        bgcolor: '#0284c7',
                      }
                    : undefined,
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: isActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sidebar User Footer Info */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.04)' }}>
          <Avatar sx={{ bgcolor: 'secondary.main', color: '#ffffff', fontWeight: 700, width: 34, height: 34, mr: 1.5 }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true, color: '#ffffff' }}>
              {profile?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', noWrap: true, display: 'block' }}>
              {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff Member'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const activeTitle = menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Header Navbar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(12px)',
          color: 'text.primary',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', height: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h5" noWrap component="h1" sx={{ fontWeight: 800, color: '#0f172a' }}>
              {activeTitle}
            </Typography>
          </Box>

          {/* Right Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="View Customer Storefront">
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  bgcolor: 'rgba(15, 23, 42, 0.04)',
                  '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.08)' },
                }}
              >
                <StorefrontIcon fontSize="small" color="action" />
              </IconButton>
            </Tooltip>

            {/* Profile menu toggler */}
            <IconButton
              onClick={handleProfileMenuOpen}
              sx={{
                p: 0.5,
                pl: 1,
                pr: 1.5,
                borderRadius: 6,
                bgcolor: 'rgba(15, 23, 42, 0.04)',
                '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.08)' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    fontWeight: 700,
                    width: 32,
                    height: 32,
                    fontSize: '0.875rem',
                  }}
                >
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, color: '#0f172a' }}>
                  {profile?.name || 'User'}
                </Typography>
                <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
              </Box>
            </IconButton>

            {/* Profile Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  width: 240,
                  borderRadius: 3,
                  p: 0.5,
                },
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {profile?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {profile?.email}
                </Typography>
                <Chip
                  label={profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff Member'}
                  size="small"
                  color={profile?.role === 'SUPER_ADMIN' ? 'primary' : 'secondary'}
                  sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                />
              </Box>

              <Divider sx={{ my: 1 }} />

              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/'); }} sx={{ py: 1.2 }}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <StorefrontIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Customer Storefront" primaryTypographyProps={{ fontSize: '0.875rem' }} />
              </MenuItem>

              <Divider sx={{ my: 1 }} />

              <MenuItem onClick={handleSignOutClick} sx={{ py: 1.2, color: 'error.main' }}>
                <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 700 }} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer Side Navigation */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid rgba(15, 23, 42, 0.08)' },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid rgba(15, 23, 42, 0.08)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '70px',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppShell;

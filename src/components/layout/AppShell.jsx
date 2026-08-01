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

  // Define navigation items with roles
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Customers', icon: <PeopleIcon />, path: '/dashboard/customers', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Job Cards', icon: <AssignmentIcon />, path: '/dashboard/jobs', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Sales Invoices', icon: <DescriptionIcon />, path: '/dashboard/invoices', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Receipts', icon: <AttachMoneyIcon />, path: '/dashboard/receipts', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Inventory', icon: <LayersIcon />, path: '/dashboard/inventory', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Suppliers', icon: <BusinessIcon />, path: '/dashboard/suppliers', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Purchase Bills', icon: <ReceiptIcon />, path: '/dashboard/purchase-bills', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Payments', icon: <PaymentsIcon />, path: '/dashboard/payments', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Employees', icon: <BadgeIcon />, path: '/dashboard/employees', roles: ['SUPER_ADMIN'] },
    { text: 'Company Settings', icon: <SettingsIcon />, path: '/dashboard/settings', roles: ['SUPER_ADMIN'] },
  ];

  // Filter items based on active user's role
  const userRole = profile?.role || 'STAFF';
  const filteredMenuItems = menuItems.filter((item) => item.roles.includes(userRole));

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: '#ffffff' }}>
      {/* Drawer Header / Branding */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mr: 2,
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#ffffff' }}>
            P
          </Typography>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
          G.P.R ERP
        </Typography>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 2, py: 2, flexGrow: 1, overflowY: 'auto' }}>
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
                  py: 1.25,
                  px: 2,
                  bgcolor: isActive ? 'rgba(0, 176, 255, 0.15)' : 'transparent',
                  color: isActive ? '#00b0ff' : 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(0, 176, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                    color: isActive ? '#00b0ff' : '#ffffff',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isActive ? '#00b0ff' : 'rgba(255, 255, 255, 0.5)',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Drawer Footer / User Indicator */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
          <Avatar sx={{ bgcolor: 'secondary.main', color: '#000000', fontWeight: 'bold', mr: 2 }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, noWrap: true }}>
              {profile?.name || 'User'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', noWrap: true, display: 'block' }}>
              {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Top Navbar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { md: `${DRAWER_WIDTH}px` },
          bgcolor: '#ffffff',
          color: 'text.primary',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
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
            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, display: { xs: 'none', sm: 'block' } }}>
              {menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          {/* User Menu Toggler */}
          <Box>
            <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0 }}>
              <Avatar
                sx={{
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 'bold',
                  width: 36,
                  height: 36,
                  fontSize: '0.95rem',
                }}
              >
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
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
                  width: 220,
                  borderRadius: 3,
                  boxShadow: '0px 8px 30px rgba(0, 0, 0, 0.08)',
                  overflow: 'visible',
                  border: '1px solid rgba(0,0,0,0.08)',
                },
              }}
            >
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {profile?.name || 'User'}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  {profile?.email}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'inline-block',
                    bgcolor: profile?.role === 'SUPER_ADMIN' ? 'rgba(26, 35, 126, 0.08)' : 'rgba(0, 176, 255, 0.08)',
                    color: profile?.role === 'SUPER_ADMIN' ? 'primary.main' : 'secondary.dark',
                    px: 1,
                    py: 0.25,
                    borderRadius: 1.5,
                    fontWeight: 600,
                  }}
                >
                  {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff'}
                </Typography>
              </Box>
              <Divider />
              <MenuItem onClick={handleSignOutClick} sx={{ color: 'error.main', py: 1.25, px: 2.5 }}>
                <ListItemIcon sx={{ color: 'error.main', minWidth: 32 }}>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Sign Out" primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 600 }} />
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar Navigation Drawers */}
      <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {/* Mobile Drawer (Temporary overlay) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }} // Better open performance on mobile
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer (Permanent sidebar) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, borderRight: '1px solid rgba(0,0,0,0.08)' },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Page Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8, // Margins out navbar
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AppShell;

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
  Button,
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

const DRAWER_WIDTH = 224;
const HEADER_HEIGHT = 52;

export const AppShell = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOutClick = async () => {
    await signOut();
  };

  // Navigation menu definitions
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon fontSize="small" />, path: '/dashboard', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Job Cards', icon: <AssignmentIcon fontSize="small" />, path: '/dashboard/jobs', roles: ['SUPER_ADMIN', 'STAFF'] },
    { text: 'Customers', icon: <PeopleIcon fontSize="small" />, path: '/dashboard/customers', roles: ['SUPER_ADMIN'] },
    { text: 'Sales Invoices', icon: <DescriptionIcon fontSize="small" />, path: '/dashboard/invoices', roles: ['SUPER_ADMIN'] },
    { text: 'Receipts', icon: <AttachMoneyIcon fontSize="small" />, path: '/dashboard/receipts', roles: ['SUPER_ADMIN'] },
    { text: 'Inventory', icon: <LayersIcon fontSize="small" />, path: '/dashboard/inventory', roles: ['SUPER_ADMIN'] },
    { text: 'Statements', icon: <ReceiptIcon fontSize="small" />, path: '/dashboard/statements', roles: ['SUPER_ADMIN'] },
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
          height: HEADER_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          px: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <Box component="img" src="/favicon.svg" alt="G.P.R. ERP Logo" sx={{ width: 22, height: 22, objectFit: 'contain', mr: 1.5 }} />
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1.2, color: '#ffffff' }}>
            G.P.R. ERP
          </Typography>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.55)', fontSize: '0.625rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Press Management
          </Typography>
        </Box>
      </Box>

      {/* Sidebar Navigation Items */}
      <List sx={{ px: 1, py: 1.5, flexGrow: 1, overflowY: 'auto' }}>
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={isMobile ? handleDrawerToggle : undefined}
                sx={{
                  borderRadius: 0,
                  py: 0.5,
                  px: 2,
                  minHeight: 32,
                  bgcolor: isActive ? '#1e293b' : 'transparent',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  borderLeft: isActive ? '3px solid #38bdf8' : '3px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? '#1e293b' : 'rgba(255, 255, 255, 0.04)',
                    color: '#ffffff',
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 28,
                    color: isActive ? '#38bdf8' : '#94a3b8',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 700 : 500,
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Sidebar User Footer Info */}
      <Box sx={{ p: 1.5, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', p: 0.75, mb: 0.75 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: '#ffffff', fontWeight: 600, fontSize: '0.75rem', width: 24, height: 24, mr: 1, borderRadius: 1 }}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.8125rem', noWrap: true, color: '#ffffff' }}>
              {profile?.name || 'User'}
            </Typography>
            <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.6875rem', noWrap: true, display: 'block' }}>
              {profile?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Staff Member'}
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
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': {
              borderColor: '#ffffff',
              color: '#ffffff',
              bgcolor: 'rgba(255, 255, 255, 0.08)'
            }
          }}
        >
          Sign Out
        </Button>
      </Box>
    </Box>
  );

  const activeTitle = menuItems.find((item) => item.path === location.pathname)?.text || 'Dashboard';

  return (
    <Box sx={{ display: 'flex', height: '100vh', minHeight: '100vh', bgcolor: 'background.default', overflow: 'hidden' }}>
      {/* Mobile Menu Toggle (Floating) */}
      <IconButton
        color="primary"
        aria-label="open drawer"
        onClick={handleDrawerToggle}
        sx={{
          display: { md: 'none' },
          position: 'fixed',
          top: 16,
          left: 16,
          bgcolor: 'white',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          zIndex: (theme) => theme.zIndex.drawer - 1,
          '&:hover': { bgcolor: '#f1f5f9' },
        }}
      >
        <MenuIcon />
      </IconButton>

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
          height: '100vh',
          overflow: 'hidden',
          p: { xs: 1, sm: 1.5, md: 2 },
          pt: { xs: 7, md: 2 },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;

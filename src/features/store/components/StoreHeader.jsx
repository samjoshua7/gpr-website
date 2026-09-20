import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Container,
  Box,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Avatar,
  Stack,
  TextField,
  InputAdornment,
  Divider,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import GoogleIcon from '@mui/icons-material/Google';

import { BrandLogo } from '../../../components/common/BrandLogo';
import { CategoryIcon } from '../../../components/common/CategoryIcon';
import { useAuth } from '../../../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { getStoreCategories } from '../api';

export const StoreHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user, profile, signOut, signInWithGoogle } = useAuth();
  const { cartCount } = useCart();

  const [categories, setCategories] = useState([]);
  const [catMenuAnchor, setCatMenuAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getStoreCategories()
      .then((data) => setCategories(data || []))
      .catch((err) => console.warn('Failed to load categories for header', err));
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(false);
    setCatMenuAnchor(null);
    setUserMenuAnchor(null);
  }, [location.pathname, location.search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  const handleSignOut = async () => {
    setUserMenuAnchor(null);
    await signOut();
  };

  const isInternal = profile && ['SUPER_ADMIN', 'ACCOUNTS', 'STAFF', 'STAKEHOLDER'].includes(profile.role);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(12px)',
          color: '#0f172a',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          zIndex: (th) => th.zIndex.appBar,
        }}
      >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ height: 72, gap: 2, justifyContent: 'space-between' }}>
          {/* Mobile Menu Toggle */}
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setMobileDrawerOpen(true)}
              edge="start"
              sx={{ color: '#0f172a' }}
              aria-label="Open navigation menu"
              aria-expanded={mobileDrawerOpen}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo & Brand */}
          <Box
            sx={{ cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <BrandLogo size={42} />
          </Box>

          {/* Desktop Navigation Links */}
          {!isMobile && (
            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                color="inherit"
                onClick={() => navigate('/')}
                sx={{
                  fontWeight: location.pathname === '/' ? 700 : 500,
                  color: location.pathname === '/' ? 'primary.main' : 'text.primary',
                  textTransform: 'none',
                }}
              >
                Home
              </Button>

              <Button
                color="inherit"
                onClick={(e) => setCatMenuAnchor(e.currentTarget)}
                endIcon={<KeyboardArrowDownIcon />}
                sx={{ textTransform: 'none', fontWeight: 500 }}
              >
                Categories
              </Button>
              <Menu
                anchorEl={catMenuAnchor}
                open={Boolean(catMenuAnchor)}
                onClose={() => setCatMenuAnchor(null)}
                sx={{ mt: 1 }}
              >
                <MenuItem
                  onClick={() => {
                    setCatMenuAnchor(null);
                    navigate('/products');
                  }}
                  sx={{ fontWeight: 700 }}
                >
                  All Products
                </MenuItem>
                <Divider />
                {categories.map((cat) => (
                  <MenuItem
                    key={cat.category_id}
                    onClick={() => {
                      setCatMenuAnchor(null);
                      navigate(`/products?category=${cat.slug}`);
                    }}
                    sx={{ py: 1 }}
                  >
                    <CategoryIcon slug={cat.slug} name={cat.name} sx={{ mr: 1.5, fontSize: '1.25rem', color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={500}>{cat.name}</Typography>
                  </MenuItem>
                ))}
              </Menu>

              <Button
                color="inherit"
                onClick={() => navigate('/products')}
                sx={{
                  fontWeight: location.pathname === '/products' ? 700 : 500,
                  color: location.pathname === '/products' ? 'primary.main' : 'text.primary',
                  textTransform: 'none',
                }}
              >
                Catalog
              </Button>

              <Button
                color="inherit"
                onClick={() => navigate('/about')}
                sx={{
                  fontWeight: location.pathname === '/about' ? 700 : 500,
                  color: location.pathname === '/about' ? 'primary.main' : 'text.primary',
                  textTransform: 'none',
                }}
              >
                About Us
              </Button>
            </Stack>
          )}

          {/* Search Bar */}
          <Box
            component="form"
            onSubmit={handleSearchSubmit}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexGrow: { sm: 0.5, md: 0.35 },
            }}
          >
            <TextField
              size="small"
              fullWidth
              placeholder="Search visiting cards, banners, letterheads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 6,
                  bgcolor: '#f8fafc',
                  '& fieldset': { borderColor: 'rgba(0,0,0,0.08)' },
                  fontSize: '0.875rem',
                },
              }}
            />
          </Box>

          {/* User Account & Cart Actions */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Cart Button */}
            <IconButton
              onClick={() => navigate('/cart')}
              sx={{
                bgcolor: 'grey.50',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'grey.100' },
              }}
              aria-label="View Shopping Cart"
            >
              <Badge badgeContent={cartCount} color="error" max={99}>
                <ShoppingCartIcon fontSize="small" sx={{ color: 'text.primary' }} />
              </Badge>
            </IconButton>

            {/* Auth State Button */}
            {user ? (
              <>
                <Box
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: 'pointer',
                    p: 0.5,
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'grey.50' },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: 'primary.main',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                    }}
                  >
                    {profile?.name ? profile.name[0].toUpperCase() : 'U'}
                  </Avatar>
                  {!isMobile && (
                    <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', pr: 1 }}>
                      {profile?.name || 'Account'}
                    </Typography>
                  )}
                </Box>

                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  sx={{ mt: 1 }}
                >
                  <Box sx={{ px: 2, py: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {profile?.name || 'Customer'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {profile?.email}
                    </Typography>
                  </Box>
                  <Divider />

                  {isInternal ? (
                    <MenuItem
                      onClick={() => {
                        setUserMenuAnchor(null);
                        navigate('/dashboard');
                      }}
                    >
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" color="primary" />
                      </ListItemIcon>
                      ERP Dashboard
                    </MenuItem>
                  ) : (
                    [
                      <MenuItem
                        key="profile"
                        onClick={() => {
                          setUserMenuAnchor(null);
                          navigate('/account');
                        }}
                      >
                        <ListItemIcon>
                          <PersonIcon fontSize="small" />
                        </ListItemIcon>
                        My Profile
                      </MenuItem>,
                      <MenuItem
                        key="orders"
                        onClick={() => {
                          setUserMenuAnchor(null);
                          navigate('/account/orders');
                        }}
                      >
                        <ListItemIcon>
                          <ShoppingBagIcon fontSize="small" />
                        </ListItemIcon>
                        My Orders
                      </MenuItem>
                    ]
                  )}

                  <Divider />
                  <MenuItem onClick={handleSignOut} sx={{ color: 'error.main' }}>
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    Sign Out
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<GoogleIcon sx={{ fontSize: '1rem' }} />}
                onClick={() => signInWithGoogle()}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: 'none',
                  px: 2,
                }}
              >
                Sign In
              </Button>
            )}
          </Stack>
        </Toolbar>
      </Container>
    </AppBar>

    {/* Mobile Drawer (Rendered outside AppBar to prevent stacking context trapping) */}
    <Drawer
      anchor="left"
      open={mobileDrawerOpen}
      onClose={() => setMobileDrawerOpen(false)}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        zIndex: (th) => th.zIndex.drawer,
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(4px)',
          bgcolor: 'rgba(15, 23, 42, 0.4)',
        },
      }}
    >
      <Box sx={{ width: 290, p: 2.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ cursor: 'pointer' }} onClick={() => { setMobileDrawerOpen(false); navigate('/'); }}>
            <BrandLogo size={36} subtitle="" />
          </Box>
          <IconButton
            size="small"
            onClick={() => setMobileDrawerOpen(false)}
            aria-label="Close menu"
            sx={{ color: 'text.secondary' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 1.5 }} />

        <List sx={{ pt: 0, flexGrow: 1, overflowY: 'auto' }}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { setMobileDrawerOpen(false); navigate('/'); }}>
              <ListItemText primary="Home" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { setMobileDrawerOpen(false); navigate('/products'); }}>
              <ListItemText primary="All Products" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => { setMobileDrawerOpen(false); navigate('/about'); }}>
              <ListItemText primary="About Us &amp; Production" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>
          </ListItem>
          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ px: 2, display: 'block', mb: 1 }}>
            CATEGORIES
          </Typography>
          {categories.map((cat) => (
            <ListItem key={cat.category_id} disablePadding>
              <ListItemButton
                onClick={() => {
                  setMobileDrawerOpen(false);
                  navigate(`/products?category=${cat.slug}`);
                }}
              >
                <CategoryIcon slug={cat.slug} name={cat.name} sx={{ mr: 1.5, fontSize: '1.2rem', color: 'primary.main' }} />
                <ListItemText primary={cat.name} primaryTypographyProps={{ fontSize: '0.9rem', fontWeight: 500 }} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  </>
);
};

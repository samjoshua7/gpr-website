import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Badge,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Divider,
  Menu,
  MenuItem,
  useTheme,
  Avatar,
  Stack,
  Skeleton,
  ListItemIcon,
  Chip,
} from '@mui/material';

import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PrintIcon from '@mui/icons-material/Print';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import StarIcon from '@mui/icons-material/Star';
import SpeedIcon from '@mui/icons-material/Speed';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GoogleIcon from '@mui/icons-material/Google';

const CATEGORIES = [
  { name: 'Wedding Printing', desc: 'Premium Wedding Cards & Foil Invites', icon: '💌' },
  { name: 'Visiting Cards', desc: 'Matte & Gloss Finish Business Cards', icon: '📇' },
  { name: 'Flex Banner', desc: 'High-res outdoor star flex banners', icon: '🖼️' },
  { name: 'Books & Catalogs', desc: 'Hardcover & perfect binding prints', icon: '📚' },
  { name: 'Certificates', desc: 'Gold foil credentials & certificates', icon: '🎓' },
  { name: 'Notices & Posters', desc: 'Vibrant promotional poster sheets', icon: '📢' },
  { name: 'Pamphlets & Flyers', desc: 'Marketing brochures & tri-fold flyers', icon: '📄' },
  { name: 'Office Stationery', desc: 'Custom Letterheads & Security Envelopes', icon: '✒️' },
];

const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Visiting Cards',
    price: 250,
    unit: '100 Cards (Box)',
    rating: 4.8,
    reviews: 124,
    img: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=60',
    desc: '350 GSM matte-finish, high density premium paper business cards.',
  },
  {
    id: 2,
    name: 'Executive Letterhead Pads',
    price: 350,
    unit: '100 sheets (Pad)',
    rating: 4.9,
    reviews: 89,
    img: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=500&auto=format&fit=crop&q=60',
    desc: 'Executive 100 GSM bond paper printing with custom company branding.',
  },
  {
    id: 3,
    name: 'Outdoor Flex Banners',
    price: 450,
    unit: '10 x 4 ft (Banner)',
    rating: 4.7,
    reviews: 210,
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60',
    desc: 'Weather-proof, UV-resistant high quality star flex outdoor banner.',
  },
  {
    id: 4,
    name: 'Corporate Envelopes',
    price: 300,
    unit: '100 Pcs (Box)',
    rating: 4.6,
    reviews: 65,
    img: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60',
    desc: 'Custom printed window and non-window executive security envelopes.',
  },
];

export const PublicHomePage = () => {
  const navigate = useNavigate();
  const { session, profile, loading, signOut } = useAuth();
  const theme = useTheme();

  // Category menu anchoring
  const [catAnchor, setCatAnchor] = useState(null);
  const handleCatClick = (e) => setCatAnchor(e.currentTarget);
  const handleCatClose = () => setCatAnchor(null);

  // User Profile Dropdown Menu Anchoring
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const handleUserMenuOpen = (e) => setUserMenuAnchor(e.currentTarget);
  const handleUserMenuClose = () => setUserMenuAnchor(null);

  // Auto redirection for staff / admins / stakeholders / accounts to ERP dashboard
  useEffect(() => {
    if (!loading && profile) {
      const isInternal = ['SUPER_ADMIN', 'STAFF', 'STAKEHOLDER', 'ACCOUNTS'].includes(profile.role);
      if (isInternal) {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  const handleSignOutClick = async () => {
    handleUserMenuClose();
    await signOut();
  };

  const isInternalUser = ['SUPER_ADMIN', 'STAFF', 'STAKEHOLDER', 'ACCOUNTS'].includes(profile?.role);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'STAKEHOLDER': return 'Stakeholder';
      case 'ACCOUNTS': return 'Accounts';
      case 'STAFF': return 'Staff';
      default: return 'Customer';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {/* 1. TOP NAVIGATION BAR */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          color: '#0f172a',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: 2, height: 70 }}>
            {/* Branding Logo */}
            <Box
              sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => navigate('/')}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  bgcolor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  boxShadow: '0 4px 12px rgba(30, 27, 75, 0.25)',
                  p: 0.5,
                }}
              >
                <Box component="img" src="/favicon.svg" alt="G.P.R. Printers Logo" sx={{ width: 26, height: 26, objectFit: 'contain' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.02em', color: '#0f172a' }}>
                G.P.R. <Typography component="span" variant="h5" sx={{ color: 'secondary.main', fontWeight: 900 }}>Printers</Typography>
              </Typography>
            </Box>

            {/* Navigation Menu & Search Bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, justifyContent: 'center', maxWidth: 580 }}>
              <Button
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleCatClick}
                sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, display: { xs: 'none', md: 'flex' } }}
              >
                Categories
              </Button>
              <Menu
                anchorEl={catAnchor}
                open={Boolean(catAnchor)}
                onClose={handleCatClose}
                transformOrigin={{ horizontal: 'left', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.name} onClick={handleCatClose} sx={{ py: 1.25, px: 2 }}>
                    <Box component="span" sx={{ mr: 1.5, fontSize: '1.2rem' }}>{c.icon}</Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{c.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.desc}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Menu>

              <TextField
                fullWidth
                size="small"
                placeholder="Search visiting cards, flex banners, letterheads..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 8,
                    bgcolor: 'background.subtle',
                    '& fieldset': { borderColor: 'transparent' },
                    '&:hover fieldset': { borderColor: 'rgba(15, 23, 42, 0.15)' },
                  },
                }}
              />
            </Box>

            {/* Action Bar (Cart, Favorites, Auth) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" aria-label="Favorites" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <FavoriteBorderIcon fontSize="small" />
              </IconButton>
              <IconButton color="inherit" aria-label="Cart">
                <Badge badgeContent={0} color="secondary">
                  <ShoppingCartIcon fontSize="small" />
                </Badge>
              </IconButton>

              <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

              {/* Requirement 7: Login Experience Navigation */}
              {loading ? (
                <Skeleton variant="circular" width={38} height={38} />
              ) : session ? (
                <Box>
                  <Button
                    onClick={handleUserMenuOpen}
                    sx={{
                      p: 0.5,
                      pl: 1,
                      pr: 1.5,
                      borderRadius: 6,
                      bgcolor: 'rgba(15, 23, 42, 0.04)',
                      '&:hover': { bgcolor: 'rgba(15, 23, 42, 0.08)' },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: 'secondary.main',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                        }}
                      >
                        {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                      </Avatar>
                      <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, fontWeight: 600, color: '#0f172a' }}>
                        {profile?.name || 'Customer'}
                      </Typography>
                      <KeyboardArrowDownIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </Stack>
                  </Button>

                  {/* Profile Dropdown Menu */}
                  <Menu
                    anchorEl={userMenuAnchor}
                    open={Boolean(userMenuAnchor)}
                    onClose={handleUserMenuClose}
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
                        {profile?.name || 'Customer'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        {profile?.email || 'Logged In Account'}
                      </Typography>
                      <Chip
                        label={getRoleLabel(profile?.role)}
                        size="small"
                        color={isInternalUser ? 'primary' : 'secondary'}
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                      />
                    </Box>
                    <Divider sx={{ my: 1 }} />

                    {isInternalUser && (
                      <MenuItem onClick={() => { handleUserMenuClose(); navigate('/dashboard'); }} sx={{ py: 1.2 }}>
                        <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>
                          <DashboardIcon fontSize="small" />
                        </ListItemIcon>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>ERP Dashboard</Typography>
                      </MenuItem>
                    )}

                    <MenuItem onClick={handleUserMenuClose} sx={{ py: 1.2 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <PersonIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2">My Profile (Placeholder)</Typography>
                    </MenuItem>

                    <MenuItem onClick={handleUserMenuClose} sx={{ py: 1.2 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <ShoppingBagIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2">My Orders (Placeholder)</Typography>
                    </MenuItem>

                    <Divider sx={{ my: 1 }} />

                    <MenuItem onClick={handleSignOutClick} sx={{ py: 1.2, color: 'error.main' }}>
                      <ListItemIcon sx={{ minWidth: 32, color: 'error.main' }}>
                        <LogoutIcon fontSize="small" />
                      </ListItemIcon>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Sign Out</Typography>
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => navigate('/login')}
                    startIcon={<GoogleIcon fontSize="small" />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      px: 2.5,
                      py: 1,
                      boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                    }}
                  >
                    Continue with Google
                  </Button>
                </Stack>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. HERO SECTION */}
      <Box
        sx={{
          bgcolor: '#0f172a',
          color: '#ffffff',
          py: { xs: 8, md: 12 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient Glows */}
        <Box
          sx={{
            position: 'absolute',
            top: -120,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -100,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(49, 46, 129, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={7}>
              <Chip
                label="ESTABLISHED 1998 • 25+ YEARS OF TRUST"
                size="small"
                sx={{
                  bgcolor: 'rgba(2, 132, 199, 0.15)',
                  color: '#38bdf8',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  mb: 3,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              />
              <Typography
                variant="h1"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', sm: '3.25rem', md: '3.75rem' },
                  lineHeight: 1.1,
                  mb: 2.5,
                  letterSpacing: '-0.03em',
                  color: '#ffffff',
                }}
              >
                Precision Printing <br />
                <Typography
                  component="span"
                  inheritViewBox
                  sx={{
                    fontSize: 'inherit',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Crafted for Impact.
                </Typography>
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(226, 232, 240, 0.8)',
                  mb: 4,
                  fontSize: { xs: '1rem', md: '1.15rem' },
                  lineHeight: 1.6,
                  maxWidth: 580,
                }}
              >
                From premium gold-foil wedding invitations to high-volume offset catalogs, star flex banners, and custom corporate stationery.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    px: 4,
                    py: 1.75,
                    borderRadius: 2.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  Explore Catalog
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: '#ffffff',
                    borderColor: 'rgba(255, 255, 255, 0.25)',
                    px: 4,
                    py: 1.75,
                    borderRadius: 2.5,
                    fontSize: '1rem',
                    '&:hover': {
                      borderColor: '#ffffff',
                      bgcolor: 'rgba(255, 255, 255, 0.08)',
                    },
                  }}
                >
                  Request Quote
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                sx={{
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: -4,
                    borderRadius: 5,
                    padding: '2px',
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.5), rgba(49, 46, 129, 0.2))',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  },
                }}
              >
                <Box
                  component="img"
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60"
                  alt="Modern Printing Press Banner"
                  sx={{
                    width: '100%',
                    height: 380,
                    objectFit: 'cover',
                    borderRadius: 4,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. CATEGORIES SECTION */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Box sx={{ mb: 5, textAlign: 'left' }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
            Shop by Category
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Select a product category to customize specifications, paper weights, and finishing styles.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {CATEGORIES.map((cat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 3,
                  p: 1,
                  cursor: 'pointer',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -4px rgba(15, 23, 42, 0.1)',
                    borderColor: 'secondary.main',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center', py: 3 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: 3,
                      bgcolor: 'rgba(2, 132, 199, 0.08)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      fontSize: '1.75rem',
                    }}
                  >
                    {cat.icon}
                  </Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {cat.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {cat.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 4. FEATURED PRODUCTS */}
      <Box sx={{ bgcolor: 'rgba(15, 23, 42, 0.02)', py: { xs: 6, md: 10 }, borderTop: '1px solid rgba(15, 23, 42, 0.06)', borderBottom: '1px solid rgba(15, 23, 42, 0.06)' }}>
        <Container maxWidth="lg">
          <Box sx={{ mb: 5, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, letterSpacing: '-0.02em' }}>
                Featured Print Items
              </Typography>
              <Typography variant="body1" color="text.secondary">
                High-demand commercial prints with instant volume pricing.
              </Typography>
            </Box>
          </Box>

          <Grid container spacing={4}>
            {FEATURED_PRODUCTS.map((prod) => (
              <Grid item xs={12} sm={6} md={3} key={prod.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 32px -4px rgba(15, 23, 42, 0.12)',
                    },
                  }}
                >
                  <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height="190"
                      image={prod.img}
                      alt={prod.name}
                      sx={{
                        transition: 'transform 300ms ease',
                        '&:hover': { transform: 'scale(1.05)' },
                      }}
                    />
                    <Chip
                      label={prod.unit}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        bgcolor: 'rgba(15, 23, 42, 0.8)',
                        color: '#ffffff',
                        backdropFilter: 'blur(4px)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                      }}
                    />
                  </Box>

                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mb: 1 }}>
                      <StarIcon sx={{ color: '#f59e0b', fontSize: '1rem' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a' }}>
                        {prod.rating}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({prod.reviews})
                      </Typography>
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: '1rem', lineHeight: 1.3 }}>
                      {prod.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.desc}
                    </Typography>

                    <Typography variant="h5" sx={{ fontWeight: 800, color: 'primary.main' }}>
                      ₹{prod.price.toFixed(2)}
                    </Typography>
                  </CardContent>

                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled
                      size="small"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Inquire / Direct Order
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. WHY CHOOSE US */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1.5, letterSpacing: '-0.02em' }}>
            Why G.P.R Offset Printers?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Combining classic craftsmanship with modern high-capacity offset and digital printing.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <CardContent>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(30, 27, 75, 0.06)', color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <WorkspacePremiumIcon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Unmatched Quality</Typography>
                <Typography variant="body2" color="text.secondary">
                  Heidelberg offset presses, foil stamping, and heavy GSM paper stock.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <CardContent>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(2, 132, 199, 0.06)', color: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <SpeedIcon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Fast Turnaround</Typography>
                <Typography variant="body2" color="text.secondary">
                  Streamlined internal workflows ensure prompt delivery for tight deadlines.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <CardContent>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(5, 150, 105, 0.06)', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <MonetizationOnIcon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Transparent Pricing</Typography>
                <Typography variant="body2" color="text.secondary">
                  Direct press wholesale rates with complete GST invoice transparency.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ p: 2, height: '100%', borderRadius: 3, textAlign: 'center', border: '1px solid rgba(15, 23, 42, 0.06)' }}>
              <CardContent>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: 'rgba(217, 119, 6, 0.06)', color: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                  <PrintIcon fontSize="medium" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>25+ Years Legacy</Typography>
                <Typography variant="body2" color="text.secondary">
                  Decades of trusted service catering to corporate, retail, and personal events.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* 6. FOOTER */}
      <Box sx={{ bgcolor: '#0f172a', color: 'rgba(226, 232, 240, 0.7)', py: 8, mt: 'auto', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box component="img" src="/favicon.svg" alt="G.P.R Offset Printers Logo" sx={{ width: 32, height: 32, mr: 1.5, objectFit: 'contain' }} />
                <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, letterSpacing: '-0.01em' }}>
                  G.P.R Offset Printers
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ lineHeight: 1.7, mb: 2 }}>
                159/23/1, Kuruchi Main Road, Kulavanigarpuram<br />
                Palayamkottai, Tirunelveli, Tamil Nadu, India.
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                Phone: +91 94434 53271, 77 0808 3281<br />
                Email: gprprinters@gmail.com
              </Typography>
            </Grid>

            <Grid item xs={6} md={4}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, mb: 2.5 }}>
                Print Services
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Wedding Card Printing</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Offset Book Binding</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Star Flex Banners</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Corporate Envelopes</Typography>
              </Stack>
            </Grid>

            <Grid item xs={6} md={4}>
              <Typography variant="subtitle1" sx={{ color: '#ffffff', fontWeight: 700, mb: 2.5 }}>
                Quick Access
              </Typography>
              <Stack spacing={1.5}>
                <Typography variant="body2" sx={{ cursor: 'pointer', color: 'secondary.light', fontWeight: 600 }} onClick={() => navigate('/login')}>
                  Internal ERP Login &rarr;
                </Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>About Press</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Privacy Policy</Typography>
                <Typography variant="body2" sx={{ cursor: 'pointer', '&:hover': { color: '#ffffff' } }}>Terms of Service</Typography>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 4 }} />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'rgba(148, 163, 184, 0.6)' }}>
            &copy; {new Date().getFullYear()} G.P.R. Offset Printers. All rights reserved. GST Registered Invoicing & ERP Portal.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicHomePage;

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

const CATEGORIES = [
  { name: 'Wedding Printing', desc: 'Premium Wedding Cards', icon: '💌' },
  { name: 'Visiting Cards', desc: 'Premium Business Cards', icon: '📇' },
  { name: 'Flex Banner', desc: 'Vibrant outdoor banners', icon: '🖼️' },
  { name: 'Books & Catalogs', desc: 'Perfect binding printing', icon: '📚' },
  { name: 'Certificates', desc: 'Gold foil credentials', icon: '🎓' },
  { name: 'Notices & Posters', desc: 'High visibility prints', icon: '📢' },
  { name: 'Pamphlets & Flyers', desc: 'Promotional marketing', icon: '📄' },
  { name: 'Office Stationery', desc: 'Letterheads & Envelopes', icon: '✒️' },
];

const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Visiting Cards',
    price: 250,
    unit: '100 Cards (Box)',
    rating: 4.8,
    img: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=60',
    desc: 'Matte-finish, high density premium paper business cards.',
  },
  {
    id: 2,
    name: 'Executive Letterhead Pads',
    price: 350,
    unit: '100 sheets (Pad)',
    rating: 4.9,
    img: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?w=500&auto=format&fit=crop&q=60',
    desc: 'Bond paper printing with custom company branding templates.',
  },
  {
    id: 3,
    name: 'Outdoor Flex Banners',
    price: 450,
    unit: '10 x 4 ft (Banner)',
    rating: 4.7,
    img: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&auto=format&fit=crop&q=60',
    desc: 'Weather-proof, high quality star flex printing banner.',
  },
  {
    id: 4,
    name: 'Corporate Envelopes',
    price: 300,
    unit: '100 Pcs (Box)',
    rating: 4.6,
    img: 'https://images.unsplash.com/photo-1595079676339-1534801ad6cf?w=500&auto=format&fit=crop&q=60',
    desc: 'Custom printed window and non-window security envelopes.',
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

  // Auto redirection for staff / admins
  useEffect(() => {
    if (!loading && profile) {
      if (profile.role === 'SUPER_ADMIN' || profile.role === 'STAFF') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [profile, loading, navigate]);

  const handleAuthAction = () => {
    if (session) {
      signOut();
    } else {
      navigate('/login');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      {/* 1. TOP NAVIGATION BAR */}
      <AppBar position="sticky" sx={{ bgcolor: '#ffffff', color: '#0f172a', borderBottom: '1px solid rgba(0,0,0,0.06)' }} elevation={0}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: 2 }}>
            {/* Branding */}
            <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
              <PrintIcon sx={{ color: 'primary.main', mr: 1, fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 900, tracking: '-1px' }}>
                G.P.R. <span style={{ color: theme.palette.primary.main }}>Printers</span>
              </Typography>
            </Box>

            {/* Menu options & search */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexGrow: 1, justify: 'center', maxWidth: 600 }}>
              <Button
                color="inherit"
                endIcon={<KeyboardArrowDownIcon />}
                onClick={handleCatClick}
                sx={{ textTransform: 'none', fontWeight: 600, display: { xs: 'none', md: 'flex' } }}
              >
                Categories
              </Button>
              <Menu anchorEl={catAnchor} open={Boolean(catAnchor)} onClose={handleCatClose}>
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.name} onClick={handleCatClose}>
                    {c.icon} &nbsp; {c.name}
                  </MenuItem>
                ))}
              </Menu>

              <TextField
                fullWidth
                size="small"
                placeholder="Search premium visiting cards, envelopes, Flex..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 10, bgcolor: '#f1f5f9' } }}
              />
            </Box>

            {/* Icons list */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton color="inherit" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <FavoriteBorderIcon />
              </IconButton>
              <IconButton color="inherit">
                <Badge badgeContent={0} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>

              <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 1, display: { xs: 'none', sm: 'block' } }} />

              {/* Login avatar / buttons */}
              {session ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', color: '#000000', fontWeight: 'bold' }}>
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'C'}
                  </Avatar>
                  <Typography variant="body2" sx={{ display: { xs: 'none', md: 'block' }, fontWeight: 700 }}>
                    {profile?.name || 'Customer'}
                  </Typography>
                  <Button variant="outlined" color="primary" onClick={handleAuthAction} size="small" sx={{ borderRadius: 2 }}>
                    Logout
                  </Button>
                </Stack>
              ) : (
                <Button variant="contained" color="primary" onClick={handleAuthAction} sx={{ borderRadius: 2, fontWeight: 700 }}>
                  Login
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* 2. HERO BANNER */}
      <Box sx={{ bgcolor: '#0f172a', color: '#ffffff', py: { xs: 8, md: 12 }, position: 'relative', overflow: 'hidden' }}>
        {/* Background gradient graphics */}
        <Box sx={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,176,255,0.15) 0%, transparent 70%)' }} />
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 2 }}>
                ESTABLISHED 1998
              </Typography>
              <Typography variant="h2" sx={{ fontWeight: 900, mb: 2, mt: 1, lineHeight: 1.1 }}>
                Premium Quality Printing Services
              </Typography>
              <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.7)', mb: 4, fontWeight: 400 }}>
                Offset & Digital press solutions. Custom wedding cards, premium catalogs, books, flex banner layouts and office stationery.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" color="primary" size="large" sx={{ px: 4, py: 1.5, borderRadius: 2.5, fontWeight: 700 }}>
                  Explore Products
                </Button>
                <Button variant="outlined" sx={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)', px: 4, py: 1.5, borderRadius: 2.5 }}>
                  Get Custom Quote
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=60"
                alt="Printing services layout banner"
                sx={{ width: '100%', borderRadius: 4, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3. FEATURED CATEGORIES */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
          Shop by Categories
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Choose from our vast collection of specialized commercial and retail prints.
        </Typography>

        <Grid container spacing={3}>
          {CATEGORIES.map((cat, index) => (
            <Grid item xs={6} sm={4} md={3} key={index}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: '0 10px 15px rgba(0,0,0,0.05)',
                    borderColor: 'primary.main',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              >
                <CardContent sx={{ py: 3 }}>
                  <Typography variant="h3" sx={{ mb: 1 }}>{cat.icon}</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{cat.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{cat.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* 4. FEATURED PRODUCTS */}
      <Box sx={{ bgcolor: '#f1f5f9', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h4" sx={{ fontWeight: 900, mb: 1 }}>
            Best Sellers & Prints
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Direct ordering options with bulk volume discount calculators.
          </Typography>

          <Grid container spacing={4}>
            {FEATURED_PRODUCTS.map((prod) => (
              <Grid item xs={12} sm={6} md={3} key={prod.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={prod.img}
                    alt={prod.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {prod.unit}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <StarIcon sx={{ color: '#ffb300', fontSize: '1rem', mr: 0.5 }} />
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{prod.rating}</Typography>
                      </Box>
                    </Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1 }}>
                      {prod.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                      {prod.desc}
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900 }}>
                      ₹{prod.price.toFixed(2)}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button fullWidth variant="contained" disabled sx={{ borderRadius: 2 }}>
                      Add to Cart (Disabled)
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* 5. WHY CHOOSE US */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, mb: 5, textAlign: 'center' }}>
          Crafting Precision Prints Since 1998
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <WorkspacePremiumIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Unmatched Quality</Typography>
              <Typography variant="body2" color="text.secondary">
                We employ offset machinery and gold stamp foils to ensure print accuracy.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <SpeedIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Fast Delivery</Typography>
              <Typography variant="body2" color="text.secondary">
                Dedicated binding and finishing lines speed up execution pipelines.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <MonetizationOnIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Affordable Rates</Typography>
              <Typography variant="body2" color="text.secondary">
                Wholesale bulk packaging discounts with transparent GST accounting calculations.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center' }}>
              <PrintIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>25+ Years Experience</Typography>
              <Typography variant="body2" color="text.secondary">
                Over two decades of satisfying large institutions and personal events.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* 6. FOOTER */}
      <Box sx={{ bgcolor: '#0f172a', color: 'rgba(255,255,255,0.6)', py: 6, mt: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, mb: 2 }}>
                G.P.R. Printing Press
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Main Workshop, Printing Press Zone,<br />
                Sivakasi, Tamil Nadu, India.
              </Typography>
              <Typography variant="body2">
                Phone: +91 98765 43210<br />
                Email: info@gprprinters.com
              </Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, mb: 2 }}>
                Services
              </Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Wedding Card Printing</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Offset Book Binding</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Star Flex Outdoor Prints</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Business Stationery</Typography>
            </Grid>
            <Grid item xs={6} md={4}>
              <Typography variant="h6" sx={{ color: '#ffffff', fontWeight: 800, mb: 2 }}>
                Quick Links
              </Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }} onClick={() => navigate('/login')}>Internal ERP Access</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>About Us</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Privacy Policy</Typography>
              <Typography variant="body2" display="block" sx={{ mb: 1, cursor: 'pointer' }}>Terms of Service</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 3 }} />
          <Typography variant="caption" sx={{ display: 'block', textAlign: 'center' }}>
            &copy; {new Date().getFullYear()} G.P.R. Printing Press. All rights reserved. Registered GST Compliant Invoicing system.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default PublicHomePage;

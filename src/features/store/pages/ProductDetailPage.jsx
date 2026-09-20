import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Breadcrumbs,
  Link,
  CardMedia,
  Paper,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Button,
  Chip,
  Skeleton,
  Alert,
  Stack,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaletteIcon from '@mui/icons-material/Palette';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

import { StoreHeader } from '../components/StoreHeader';
import { StoreFooter } from '../components/StoreFooter';
import { PricingCalculator } from '../components/PricingCalculator';
import { useCart } from '../context/CartContext';
import { getProductBySlug, calculateProductPricing } from '../api';

export const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Customization State
  const [selectedOptions, setSelectedOptions] = useState({}); // { [option_id]: value_id }
  const [quantity, setQuantity] = useState(100);
  const [designProvision, setDesignProvision] = useState('self_supplied'); // 'self_supplied' | 'design_by_gpr'
  const [selectedImage, setSelectedImage] = useState('');

  // Cart feedback state
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getProductBySlug(slug)
      .then((data) => {
        setProduct(data);
        setSelectedImage(data.main_image_url || '');
        setQuantity(data.min_quantity || 100);

        // Pre-select defaults for options
        const initialOpts = {};
        if (data.options) {
          data.options.forEach((opt) => {
            const defaultVal = opt.values?.find((v) => v.is_default) || opt.values?.[0];
            if (defaultVal) {
              initialOpts[opt.option_id] = defaultVal.value_id;
            }
          });
        }
        setSelectedOptions(initialOpts);
      })
      .catch((err) => {
        setError(err.message || 'Product not found.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  // Compute live price using options and tiers
  const pricing = useMemo(() => {
    if (!product) {
      return { unitPrice: 0, subtotal: 0, hasTierDiscount: false };
    }

    // Resolve selected option values
    const selectedValuesList = [];
    if (product.options) {
      product.options.forEach((opt) => {
        const valId = selectedOptions[opt.option_id];
        const valObj = opt.values?.find((v) => v.value_id === valId);
        if (valObj) selectedValuesList.push(valObj);
      });
    }

    return calculateProductPricing({
      basePrice: product.base_price,
      minQuantity: product.min_quantity,
      quantity,
      selectedOptionValues: selectedValuesList,
      quantityTiers: product.tiers || [],
    });
  }, [product, selectedOptions, quantity]);

  const handleOptionChange = (optionId, valueId) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: valueId,
    }));
    setAddedSuccess(false);
  };

  const handleQuantityChange = (val) => {
    const min = product?.min_quantity || 1;
    const num = Math.max(parseInt(val, 10) || min, min);
    setQuantity(num);
    setAddedSuccess(false);
  };

  const handleAddToCart = async () => {
    if (!product) return;

    try {
      setAddingToCart(true);

      // Build human-readable option snapshot
      const optionLabels = {};
      product.options?.forEach((opt) => {
        const valId = selectedOptions[opt.option_id];
        const valObj = opt.values?.find((v) => v.value_id === valId);
        if (valObj) {
          optionLabels[opt.name] = valObj.label;
        }
      });

      const itemPayload = {
        product_id: product.product_id,
        product_name: product.name,
        product_slug: product.slug,
        product_image_url: selectedImage || product.main_image_url,
        base_price: product.base_price,
        quantity,
        selected_options: selectedOptions,
        selected_option_labels: optionLabels,
        unit_price: pricing.unitPrice,
        subtotal: pricing.subtotal,
        design_provision: designProvision,
      };

      await addItem(itemPayload);
      setAddedSuccess(true);
    } catch (err) {
      alert('Failed to add to cart: ' + err.message);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="xl" sx={{ py: 6, flexGrow: 1 }}>
          <Skeleton variant="text" width={260} height={32} sx={{ mb: 3 }} />
          <Grid container spacing={5}>
            <Grid item xs={12} md={6}>
              <Skeleton variant="rounded" height={480} sx={{ borderRadius: 3 }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Skeleton variant="text" width="80%" height={48} />
              <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
              <Skeleton variant="rounded" height={160} />
            </Grid>
          </Grid>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <StoreHeader />
        <Container maxWidth="md" sx={{ py: 10, textAlign: 'center', flexGrow: 1 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || 'The requested product is unavailable.'}
          </Alert>
          <Button variant="contained" onClick={() => navigate('/products')}>
            Back to Catalog
          </Button>
        </Container>
        <StoreFooter />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <StoreHeader />

      <Container maxWidth="xl" sx={{ py: 4, flexGrow: 1 }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
          <Link component={RouterLink} to="/" color="inherit" underline="hover">
            Home
          </Link>
          <Link component={RouterLink} to="/products" color="inherit" underline="hover">
            Catalog
          </Link>
          {product.category && (
            <Link
              component={RouterLink}
              to={`/products?category=${product.category.slug}`}
              color="inherit"
              underline="hover"
            >
              {product.category.name}
            </Link>
          )}
          <Typography color="text.primary" fontWeight={600}>
            {product.name}
          </Typography>
        </Breadcrumbs>

        <Grid container spacing={5}>
          {/* LEFT COLUMN: PRODUCT IMAGES */}
          <Grid item xs={12} md={6} lg={5}>
            <Box sx={{ position: { md: 'sticky' }, top: 90 }}>
              {/* Main Display Image */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3.5,
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.08)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
                  bgcolor: '#ffffff',
                  mb: 2,
                }}
              >
                <CardMedia
                  component="img"
                  image={selectedImage || 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=800&auto=format&fit=crop&q=80'}
                  alt={product.name}
                  sx={{
                    width: '100%',
                    height: { xs: 320, sm: 420, md: 460 },
                    objectFit: 'cover',
                  }}
                />
              </Paper>

              {/* Gallery Thumbnails */}
              {product.images && product.images.length > 0 && (
                <Stack direction="row" spacing={1.5} sx={{ overflowX: 'auto', pb: 1 }}>
                  <Paper
                    onClick={() => setSelectedImage(product.main_image_url)}
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: 2,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: selectedImage === product.main_image_url ? 'primary.main' : 'transparent',
                    }}
                  >
                    <img src={product.main_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Paper>
                  {product.images.map((img) => (
                    <Paper
                      key={img.image_id}
                      onClick={() => setSelectedImage(img.image_url)}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: selectedImage === img.image_url ? 'primary.main' : 'transparent',
                      }}
                    >
                      <img src={img.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Paper>
                  ))}
                </Stack>
              )}

              {/* Quality & Assurance Badges */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ffffff', borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
                  GPR Press Assurance
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Heidelberg &amp; Komori Automated Offset Printing</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Pre-flight PDF artwork check before plate generation</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VerifiedIcon fontSize="small" color="primary" />
                    <Typography variant="body2">Moisture-proof corrugated protective packaging</Typography>
                  </Box>
                </Stack>
              </Box>
            </Box>
          </Grid>

          {/* RIGHT COLUMN: PRODUCT SPECIFICATIONS & CUSTOMIZER */}
          <Grid item xs={12} md={6} lg={7}>
            <Box>
              {/* Category & Title */}
              {product.category && (
                <Chip
                  label={product.category.name}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontWeight: 700, mb: 1.5 }}
                />
              )}

              <Typography
                variant="h3"
                fontWeight={900}
                sx={{
                  color: 'text.primary',
                  letterSpacing: '-0.02em',
                  fontSize: { xs: '1.75rem', sm: '2.25rem' },
                  lineHeight: 1.2,
                  mb: 1.5,
                }}
              >
                {product.name}
              </Typography>

              {product.short_description && (
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  {product.short_description}
                </Typography>
              )}

              <Divider sx={{ my: 3 }} />

              {/* 1. CONFIGURABLE OPTIONS SECTION */}
              {product.options && product.options.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                    Customize Specifications
                  </Typography>

                  <Stack spacing={3}>
                    {product.options.map((opt) => (
                      <Box key={opt.option_id}>
                        <Typography variant="body2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                          {opt.name} {opt.is_required && <span style={{ color: '#ef4444' }}>*</span>}
                        </Typography>

                        <FormControl component="fieldset">
                          <RadioGroup
                            value={selectedOptions[opt.option_id] || ''}
                            onChange={(e) => handleOptionChange(opt.option_id, e.target.value)}
                          >
                            <Grid container spacing={1.5}>
                              {opt.values?.map((val) => {
                                const isSelected = selectedOptions[opt.option_id] === val.value_id;
                                const extra = parseFloat(val.price_adjustment) || 0;

                                return (
                                  <Grid item xs={12} sm={6} key={val.value_id}>
                                    <Paper
                                      variant="outlined"
                                      onClick={() => handleOptionChange(opt.option_id, val.value_id)}
                                      sx={{
                                        p: 1.5,
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        border: '1.5px solid',
                                        borderColor: isSelected ? 'primary.main' : 'divider',
                                        bgcolor: isSelected ? 'rgba(30, 27, 75, 0.03)' : '#ffffff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <FormControlLabel
                                        value={val.value_id}
                                        control={<Radio size="small" />}
                                        label={
                                          <Typography variant="body2" fontWeight={isSelected ? 700 : 500}>
                                            {val.label}
                                          </Typography>
                                        }
                                        sx={{ m: 0, flexGrow: 1 }}
                                      />
                                      {extra > 0 && (
                                        <Chip
                                          label={`+₹${extra.toFixed(2)}`}
                                          size="small"
                                          color={isSelected ? 'primary' : 'default'}
                                          sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                                        />
                                      )}
                                    </Paper>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </RadioGroup>
                        </FormControl>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* 2. DESIGN & ARTWORK PROVISION */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>
                  Artwork &amp; Design Preparation
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => setDesignProvision('self_supplied')}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: designProvision === 'self_supplied' ? 'primary.main' : 'divider',
                        bgcolor: designProvision === 'self_supplied' ? 'rgba(30, 27, 75, 0.03)' : '#ffffff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <CloudUploadIcon color={designProvision === 'self_supplied' ? 'primary' : 'action'} />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Self-Supplied Artwork
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        I will supply print-ready PDF/CDR/AI artwork after order placement.
                      </Typography>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Paper
                      variant="outlined"
                      onClick={() => setDesignProvision('design_by_gpr')}
                      sx={{
                        p: 2,
                        borderRadius: 2.5,
                        cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: designProvision === 'design_by_gpr' ? 'primary.main' : 'divider',
                        bgcolor: designProvision === 'design_by_gpr' ? 'rgba(30, 27, 75, 0.03)' : '#ffffff',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                        <PaletteIcon color={designProvision === 'design_by_gpr' ? 'primary' : 'action'} />
                        <Typography variant="subtitle2" fontWeight={700}>
                          Design by GPR Studio
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Our graphic designers will prepare custom layouts and share digital proofs.
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* 3. QUANTITY & VOLUME TIERS */}
              <Box sx={{ mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={800}>
                    Order Quantity
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Minimum required: <strong>{product.min_quantity} units</strong>
                  </Typography>
                </Box>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      type="number"
                      size="small"
                      label="Quantity (Units)"
                      value={quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      fullWidth
                      inputProps={{ min: product.min_quantity, step: 50 }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" spacing={1}>
                      {[product.min_quantity, product.min_quantity * 5, product.min_quantity * 10].map((preset) => (
                        <Button
                          key={preset}
                          size="small"
                          variant={quantity === preset ? 'contained' : 'outlined'}
                          onClick={() => handleQuantityChange(preset)}
                          sx={{ textTransform: 'none', borderRadius: 2 }}
                        >
                          {preset} units
                        </Button>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>

                {/* Volume Tier Matrix Table */}
                {product.tiers && product.tiers.length > 0 && (
                  <Box sx={{ mt: 2.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>
                      VOLUME BULK DISCOUNT TABLE
                    </Typography>
                    <Table size="small" sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <TableHead sx={{ bgcolor: 'grey.50' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Quantity Bracket</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Base Unit Rate</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {product.tiers.map((tier) => {
                          const isActiveBracket =
                            quantity >= tier.min_quantity &&
                            (tier.max_quantity === null || quantity <= tier.max_quantity);

                          return (
                            <TableRow
                              key={tier.tier_id}
                              sx={{
                                bgcolor: isActiveBracket ? 'rgba(34, 197, 94, 0.08)' : 'inherit',
                              }}
                            >
                              <TableCell sx={{ fontSize: '0.8rem' }}>
                                {tier.min_quantity} – {tier.max_quantity ? `${tier.max_quantity} units` : 'Above'}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                ₹{parseFloat(tier.price_per_unit).toFixed(2)} / unit
                              </TableCell>
                              <TableCell align="center">
                                {isActiveBracket && (
                                  <Chip label="Active Bracket" size="small" color="success" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }} />
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>

              {/* 4. PRICING CALCULATOR & ADD TO CART */}
              <Box sx={{ mb: 5 }}>
                <PricingCalculator
                  unitPrice={pricing.unitPrice}
                  quantity={pricing.quantity}
                  subtotal={pricing.subtotal}
                  hasTierDiscount={pricing.hasTierDiscount}
                  onAddToCart={handleAddToCart}
                  addingToCart={addingToCart}
                  addedSuccess={addedSuccess}
                  onGoToCart={() => navigate('/cart')}
                />
              </Box>

              {/* 5. FULL DESCRIPTION & SPECS */}
              {product.description && (
                <Box sx={{ mt: 5, p: 3, bgcolor: '#ffffff', borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>
                    Technical Specifications &amp; Features
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, color: 'text.secondary' }}>
                    {product.description}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>

      <StoreFooter />
    </Box>
  );
};

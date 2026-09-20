import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/products/${product.slug}`);
  };

  return (
    <Card
      onClick={handleCardClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'rgba(0,0,0,0.06)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        transition: 'all 0.25s ease',
        cursor: 'pointer',
        overflow: 'hidden',
        bgcolor: 'background.paper',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 16px 32px rgba(0,0,0,0.08)',
          borderColor: 'primary.light',
          '& .product-card-img': {
            transform: 'scale(1.04)',
          },
        },
      }}
    >
      {/* Product Image */}
      <Box sx={{ position: 'relative', overflow: 'hidden', pt: '65%', bgcolor: 'grey.100' }}>
        <CardMedia
          component="img"
          className="product-card-img"
          image={product.main_image_url || 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=60'}
          alt={product.name}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
        />

        {product.is_featured && (
          <Chip
            label="Popular"
            size="small"
            color="primary"
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              fontWeight: 700,
              fontSize: '0.7rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}
          />
        )}

        {product.category && (
          <Chip
            label={product.category.name}
            size="small"
            sx={{
              position: 'absolute',
              bottom: 12,
              left: 12,
              bgcolor: 'rgba(255, 255, 255, 0.92)',
              backdropFilter: 'blur(6px)',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.72rem',
            }}
          />
        )}
      </Box>

      {/* Product Body */}
      <CardContent sx={{ flexGrow: 1, p: 2.5, display: 'flex', flexDirection: 'column' }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            fontSize: '1.05rem',
            lineHeight: 1.3,
            color: 'text.primary',
            letterSpacing: '-0.01em',
            mb: 1,
          }}
        >
          {product.name}
        </Typography>

        {product.short_description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: '0.85rem',
              lineHeight: 1.5,
              mb: 2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              flexGrow: 1,
            }}
          >
            {product.short_description}
          </Typography>
        )}

        {/* Pricing and Action Footer */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            mt: 'auto',
            pt: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontWeight: 600 }}>
              Starting From
            </Typography>
            <Typography
              variant="h6"
              fontWeight={900}
              sx={{ color: 'primary.main', lineHeight: 1.1, fontFamily: 'monospace' }}
            >
              ₹{parseFloat(product.base_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem' }}>
              Min {product.min_quantity} units
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            endIcon={<ArrowForwardIcon fontSize="small" />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              fontSize: '0.8rem',
              px: 1.5,
            }}
          >
            Customize
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

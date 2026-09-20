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

  // Aggregate images (main + gallery)
  const cardImages = React.useMemo(() => {
    const list = [];
    if (product.main_image_url) {
      list.push(product.main_image_url);
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img.image_url && img.image_url !== product.main_image_url) {
          list.push(img.image_url);
        }
      });
    }
    if (list.length === 0) {
      list.push('https://images.unsplash.com/photo-1589254065878-42c9da997008?w=500&auto=format&fit=crop&q=60');
    }
    return list;
  }, [product]);

  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const touchStartXRef = React.useRef(0);

  const handleCardClick = () => {
    navigate(`/products/${product.slug}`);
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (cardImages.length <= 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      e.stopPropagation();
      if (deltaX < 0) {
        setActiveImageIndex((prev) => (prev + 1) % cardImages.length);
      } else {
        setActiveImageIndex((prev) => (prev - 1 + cardImages.length) % cardImages.length);
      }
    }
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
      <Box
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        sx={{ position: 'relative', overflow: 'hidden', pt: '65%', bgcolor: 'grey.100' }}
      >
        <CardMedia
          component="img"
          className="product-card-img"
          image={cardImages[activeImageIndex] || cardImages[0]}
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

        {/* Multi-Image Indicator Dots (Only if 2 or more images) */}
        {cardImages.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 12,
              display: 'flex',
              gap: 0.6,
              zIndex: 3,
              bgcolor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(4px)',
              px: 0.8,
              py: 0.4,
              borderRadius: 2,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {cardImages.map((_, idx) => (
              <Box
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                sx={{
                  width: idx === activeImageIndex ? 12 : 5,
                  height: 5,
                  borderRadius: 2.5,
                  bgcolor: idx === activeImageIndex ? '#ffffff' : 'rgba(255, 255, 255, 0.45)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </Box>
        )}

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

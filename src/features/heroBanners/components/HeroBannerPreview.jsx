import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export const HeroBannerPreview = ({ banner, viewport = 'desktop' }) => {
  const isMobileView = viewport === 'mobile';
  const isImageOnly = banner.banner_type === 'image_only';

  const imageUrl = (isMobileView && banner.mobile_image_url) 
    ? banner.mobile_image_url 
    : (banner.image_url || 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80');

  // Alignment
  const textAlign = banner.text_align || 'left';
  const textPosition = banner.text_position || 'center-left';

  // Determine flex alignment based on position
  let justifyContent = 'flex-start';
  let alignItems = 'center';

  if (textPosition === 'center') {
    justifyContent = 'center';
    alignItems = 'center';
  } else if (textPosition === 'center-right') {
    justifyContent = 'flex-end';
    alignItems = 'center';
  } else if (textPosition === 'bottom-left') {
    justifyContent = 'flex-start';
    alignItems = 'flex-end';
  } else if (textPosition === 'bottom-center') {
    justifyContent = 'center';
    alignItems = 'flex-end';
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: isMobileView ? 380 : '100%',
        mx: 'auto',
        borderRadius: 2.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: '#0f172a',
        position: 'relative',
        minHeight: isMobileView ? 280 : 340,
        display: 'flex',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        transition: 'all 0.3s ease',
      }}
    >
      {/* If Image + Text, render readable contrast overlay */}
      {!isImageOnly && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: textAlign === 'center'
              ? 'radial-gradient(circle, rgba(15, 23, 42, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%)'
              : textAlign === 'right'
              ? 'linear-gradient(270deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.6) 60%, rgba(15, 23, 42, 0.2) 100%)'
              : 'linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.6) 60%, rgba(15, 23, 42, 0.2) 100%)',
            zIndex: 1,
          }}
        />
      )}

      {/* Banner Content Container */}
      {!isImageOnly && (
        <Container
          maxWidth="lg"
          sx={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems,
            justifyContent,
            py: isMobileView ? 3 : 4,
            px: isMobileView ? 2.5 : 4,
            width: '100%',
          }}
        >
          <Box
            sx={{
              maxWidth: isMobileView ? '100%' : 540,
              textAlign,
            }}
          >
            {/* Optional Eyebrow */}
            {banner.eyebrow && (
              <Box
                sx={{
                  display: 'inline-block',
                  bgcolor: 'primary.main',
                  color: '#fff',
                  px: 1.25,
                  py: 0.3,
                  borderRadius: 1,
                  fontSize: isMobileView ? '0.65rem' : '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  mb: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                {banner.eyebrow}
              </Box>
            )}

            {/* Heading */}
            {banner.title && (
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{
                  color: '#ffffff',
                  fontSize: isMobileView ? '1.25rem' : '1.75rem',
                  lineHeight: 1.18,
                  letterSpacing: '-0.02em',
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                }}
              >
                {banner.title}
              </Typography>
            )}

            {/* Subtitle */}
            {banner.subtitle && (
              <Typography
                variant="body2"
                sx={{
                  color: '#cbd5e1',
                  fontSize: isMobileView ? '0.75rem' : '0.875rem',
                  lineHeight: 1.45,
                  mb: 2,
                }}
              >
                {banner.subtitle}
              </Typography>
            )}

            {/* Action Buttons */}
            {(banner.btn1_label || banner.btn2_label) && (
              <Box
                sx={{
                  display: 'flex',
                  gap: 1.5,
                  flexWrap: 'wrap',
                  justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
                }}
              >
                {banner.btn1_label && (
                  <Button
                    variant="contained"
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: '0.9rem !important' }} />}
                    sx={{
                      bgcolor: '#ffffff',
                      color: '#0f172a',
                      fontWeight: 700,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      '&:hover': { bgcolor: '#f1f5f9' },
                    }}
                  >
                    {banner.btn1_label}
                  </Button>
                )}

                {banner.btn2_label && (
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{
                      color: '#ffffff',
                      borderColor: 'rgba(255, 255, 255, 0.4)',
                      fontWeight: 600,
                      px: 2,
                      py: 0.75,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontSize: '0.8rem',
                      '&:hover': {
                        borderColor: '#ffffff',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    {banner.btn2_label}
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Container>
      )}

      {/* Image-Only Indicator Overlay in Preview */}
      {isImageOnly && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            bgcolor: 'rgba(0,0,0,0.65)',
            color: '#fff',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            fontSize: '0.75rem',
            fontWeight: 600,
            backdropFilter: 'blur(4px)',
          }}
        >
          Image-Only Banner (No text overlay)
        </Box>
      )}
    </Box>
  );
};

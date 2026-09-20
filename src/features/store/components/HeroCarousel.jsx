import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Skeleton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/effect-fade';

import { getHeroBanners, getStoreHeroCarouselDuration } from '../api';

const DEFAULT_BANNERS = [
  {
    banner_id: 'default-1',
    banner_name: 'Commercial Offset Banner',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&auto=format&fit=crop&q=85',
    banner_type: 'image_text',
    eyebrow: 'Factory Direct Printing • Tirunelveli',
    title: 'High-Precision Commercial Offset Printing',
    subtitle: 'Premium Business Cards, Catalogs, Flex Banners & Wedding Invites Crafted with Master Precision.',
    text_align: 'left',
    text_position: 'center-left',
    btn1_label: 'Explore Catalog',
    btn1_url: '/products',
    btn2_label: 'Visiting Cards',
    btn2_url: '/products?category=visiting-cards',
  },
  {
    banner_id: 'default-2',
    banner_name: 'Online Ordering Banner',
    image_url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=1600&auto=format&fit=crop&q=85',
    banner_type: 'image_text',
    eyebrow: 'Instant Live Customization',
    title: 'Instant Online Ordering & Live Pricing',
    subtitle: 'Choose your paper GSM, lamination finish, and volume tiers with transparent factory rates.',
    text_align: 'left',
    text_position: 'center-left',
    btn1_label: 'Explore Catalog',
    btn1_url: '/products',
  },
];

export const HeroCarousel = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [durationSeconds, setDurationSeconds] = useState(6);
  const [progressKey, setProgressKey] = useState(0);
  const swiperRef = useRef(null);

  useEffect(() => {
    Promise.all([getHeroBanners(), getStoreHeroCarouselDuration()])
      .then(([bannersData, duration]) => {
        if (bannersData && bannersData.length > 0) {
          setBanners(bannersData);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
        if (duration) {
          setDurationSeconds(duration);
        }
      })
      .catch((err) => {
        console.warn('Hero banner load failed, using defaults', err);
        setBanners(DEFAULT_BANNERS);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleActionClick = (url) => {
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      navigate(url);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 3 } }}>
        <Skeleton
          variant="rounded"
          height={460}
          sx={{ borderRadius: { xs: 3, md: 4 } }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 2.5 }, mb: 4 }}>
      <Box
        sx={{
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12)',
          bgcolor: '#0f172a',
          position: 'relative',
        }}
      >
        <Swiper
          modules={[Autoplay, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={banners.length > 1}
          autoplay={{
            delay: durationSeconds * 1000,
            disableOnInteraction: false,
          }}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
          }}
          onSlideChange={(swiper) => {
            setActiveSlideIndex(swiper.realIndex);
            setProgressKey((k) => k + 1);
          }}
          style={{ width: '100%', height: '100%' }}
        >
          {banners.map((banner) => {
            const isImageOnly = banner.banner_type === 'image_only';
            const clickUrl = banner.btn1_url || banner.link_url;
            const textAlign = banner.text_align || 'left';
            const textPosition = banner.text_position || 'center-left';

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
              <SwiperSlide key={banner.banner_id}>
                <Box
                  onClick={() => {
                    if (isImageOnly && clickUrl) {
                      handleActionClick(clickUrl);
                    }
                  }}
                  sx={{
                    position: 'relative',
                    minHeight: { xs: 320, sm: 420, md: 480 },
                    display: 'flex',
                    alignItems: 'center',
                    backgroundImage: {
                      xs: `url(${banner.mobile_image_url || banner.image_url})`,
                      md: `url(${banner.image_url})`,
                    },
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: isImageOnly && clickUrl ? 'pointer' : 'default',
                  }}
                >
                  {/* Subtle Contrast Gradient Overlay for Text Readability */}
                  {!isImageOnly && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background:
                          textAlign === 'center'
                            ? 'radial-gradient(circle, rgba(15, 23, 42, 0.72) 0%, rgba(15, 23, 42, 0.88) 100%)'
                            : textAlign === 'right'
                            ? 'linear-gradient(270deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.6) 55%, rgba(15, 23, 42, 0.15) 100%)'
                            : 'linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.6) 55%, rgba(15, 23, 42, 0.15) 100%)',
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Banner Content Container (if image + text) */}
                  {!isImageOnly && (
                    <Container
                      maxWidth="lg"
                      sx={{
                        position: 'relative',
                        zIndex: 2,
                        py: { xs: 5, md: 7 },
                        px: { xs: 3, md: 6 },
                        display: 'flex',
                        alignItems,
                        justifyContent,
                        width: '100%',
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: { xs: '100%', md: 640 },
                          textAlign,
                        }}
                      >
                        {/* Eyebrow Badge (Optional) */}
                        {banner.eyebrow && (
                          <Box
                            sx={{
                              display: 'inline-block',
                              bgcolor: 'primary.main',
                              color: '#fff',
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 1.5,
                              fontSize: { xs: '0.7rem', sm: '0.75rem' },
                              fontWeight: 700,
                              letterSpacing: '0.05em',
                              mb: 2,
                              textTransform: 'uppercase',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }}
                          >
                            {banner.eyebrow}
                          </Box>
                        )}

                        {/* Title (Optional) */}
                        {banner.title && (
                          <Typography
                            variant="h2"
                            fontWeight={900}
                            sx={{
                              color: '#ffffff',
                              fontSize: { xs: '1.65rem', sm: '2.4rem', md: '3.1rem' },
                              lineHeight: 1.12,
                              letterSpacing: '-0.03em',
                              mb: 1.8,
                              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}
                          >
                            {banner.title}
                          </Typography>
                        )}

                        {/* Subtitle (Optional) */}
                        {banner.subtitle && (
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#e2e8f0',
                              fontWeight: 400,
                              fontSize: { xs: '0.85rem', sm: '1.05rem', md: '1.15rem' },
                              lineHeight: 1.5,
                              mb: 3.5,
                            }}
                          >
                            {banner.subtitle}
                          </Typography>
                        )}

                        {/* Configurable Action Buttons */}
                        {(banner.btn1_label || banner.btn2_label) && (
                          <Box
                            sx={{
                              display: 'flex',
                              gap: 2,
                              flexWrap: 'wrap',
                              justifyContent:
                                textAlign === 'center'
                                  ? 'center'
                                  : textAlign === 'right'
                                  ? 'flex-end'
                                  : 'flex-start',
                            }}
                          >
                            {banner.btn1_label && (
                              <Button
                                variant="contained"
                                size="large"
                                endIcon={<ArrowForwardIcon />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(banner.btn1_url || '/products');
                                }}
                                sx={{
                                  bgcolor: '#ffffff',
                                  color: '#0f172a',
                                  fontWeight: 700,
                                  px: { xs: 2.5, sm: 3.5 },
                                  py: 1.25,
                                  borderRadius: 2.5,
                                  textTransform: 'none',
                                  fontSize: { xs: '0.9rem', sm: '1rem' },
                                  '&:hover': {
                                    bgcolor: '#f1f5f9',
                                  },
                                }}
                              >
                                {banner.btn1_label}
                              </Button>
                            )}

                            {banner.btn2_label && (
                              <Button
                                variant="outlined"
                                size="large"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActionClick(banner.btn2_url || '/products');
                                }}
                                sx={{
                                  color: '#ffffff',
                                  borderColor: 'rgba(255, 255, 255, 0.4)',
                                  fontWeight: 600,
                                  px: { xs: 2.5, sm: 3 },
                                  py: 1.25,
                                  borderRadius: 2.5,
                                  textTransform: 'none',
                                  fontSize: { xs: '0.9rem', sm: '1rem' },
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
                </Box>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Horizontal Segmented Progress Bar (Hidden for single banner) */}
        {banners.length > 1 && (
          <Box
            sx={{
              position: 'absolute',
              bottom: { xs: 14, sm: 20 },
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 1, sm: 1.5 },
              px: 3,
              zIndex: 10,
            }}
          >
            {banners.map((_, index) => {
              const isActive = index === activeSlideIndex;
              const isPast = index < activeSlideIndex;
              return (
                <Box
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (swiperRef.current) {
                      swiperRef.current.slideToLoop(index);
                      setActiveSlideIndex(index);
                      setProgressKey((k) => k + 1);
                    }
                  }}
                  sx={{
                    flex: { xs: '1 1 0', sm: '0 1 54px' },
                    maxWidth: 64,
                    height: 4,
                    borderRadius: 4,
                    bgcolor: 'rgba(255, 255, 255, 0.3)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.55)',
                    },
                  }}
                  role="button"
                  aria-label={`Go to slide ${index + 1}`}
                >
                  <Box
                    key={isActive ? `bar-${progressKey}` : `bar-inactive-${index}`}
                    sx={{
                      height: '100%',
                      bgcolor: '#ffffff',
                      borderRadius: 4,
                      width: isPast ? '100%' : '0%',
                      ...(isActive && {
                        animation: `heroProgress ${durationSeconds}s linear forwards`,
                        '@keyframes heroProgress': {
                          '0%': { width: '0%' },
                          '100%': { width: '100%' },
                        },
                      }),
                    }}
                  />
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
};

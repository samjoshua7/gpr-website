import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button, Skeleton } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import 'swiper/css/effect-fade';

import { getHeroBanners } from '../api';

const DEFAULT_BANNERS = [
  {
    banner_id: 'default-1',
    image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1600&auto=format&fit=crop&q=85',
    title: 'High-Precision Commercial Offset Printing',
    subtitle: 'Premium Business Cards, Catalogs, Flex Banners & Wedding Invites Crafted with Master Precision.',
    link_url: '/products',
  },
  {
    banner_id: 'default-2',
    image_url: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=1600&auto=format&fit=crop&q=85',
    title: 'Instant Online Customization & Live Pricing',
    subtitle: 'Choose your paper GSM, lamination finish, and volume tiers with transparent factory rates.',
    link_url: '/products',
  },
];

export const HeroCarousel = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHeroBanners()
      .then((data) => {
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(DEFAULT_BANNERS);
        }
      })
      .catch((err) => {
        console.warn('Hero banner load failed, using defaults', err);
        setBanners(DEFAULT_BANNERS);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3 }}>
        <Skeleton
          variant="rounded"
          height={480}
          sx={{ borderRadius: 4 }}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          borderRadius: { xs: 3, md: 4 },
          overflow: 'hidden',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.15)',
          bgcolor: '#0f172a',
          position: 'relative',
        }}
      >
        <Swiper
          modules={[Autoplay, Pagination, Navigation, EffectFade]}
          effect="fade"
          fadeEffect={{ crossFade: true }}
          loop={banners.length > 1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation
          style={{ width: '100%', height: '100%' }}
        >
          {banners.map((banner) => (
            <SwiperSlide key={banner.banner_id}>
              <Box
                sx={{
                  position: 'relative',
                  minHeight: { xs: 380, sm: 460, md: 520 },
                  display: 'flex',
                  alignItems: 'center',
                  backgroundImage: `url(${banner.image_url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                {/* Contrast Gradient Overlay */}
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.65) 55%, rgba(15, 23, 42, 0.25) 100%)',
                    zIndex: 1,
                  }}
                />

                {/* Banner Content */}
                <Container
                  maxWidth="lg"
                  sx={{
                    position: 'relative',
                    zIndex: 2,
                    py: { xs: 6, md: 8 },
                    px: { xs: 3, md: 6 },
                  }}
                >
                  <Box sx={{ maxWidth: 640 }}>
                    <Box
                      sx={{
                        display: 'inline-block',
                        bgcolor: 'primary.main',
                        color: '#fff',
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1.5,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        mb: 2,
                        textTransform: 'uppercase',
                      }}
                    >
                      Factory Direct Printing &bull; Tirunelveli
                    </Box>

                    <Typography
                      variant="h2"
                      fontWeight={900}
                      sx={{
                        color: '#ffffff',
                        fontSize: { xs: '1.85rem', sm: '2.5rem', md: '3.2rem' },
                        lineHeight: 1.12,
                        letterSpacing: '-0.03em',
                        mb: 2,
                      }}
                    >
                      {banner.title}
                    </Typography>

                    {banner.subtitle && (
                      <Typography
                        variant="h6"
                        sx={{
                          color: '#e2e8f0',
                          fontWeight: 400,
                          fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.2rem' },
                          lineHeight: 1.5,
                          mb: 4,
                        }}
                      >
                        {banner.subtitle}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Button
                        variant="contained"
                        size="large"
                        endIcon={<ArrowForwardIcon />}
                        onClick={() => navigate(banner.link_url || '/products')}
                        sx={{
                          bgcolor: '#ffffff',
                          color: '#0f172a',
                          fontWeight: 700,
                          px: 3.5,
                          py: 1.4,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            bgcolor: '#f1f5f9',
                          },
                        }}
                      >
                        Explore Catalog
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/products?category=visiting-cards')}
                        sx={{
                          color: '#ffffff',
                          borderColor: 'rgba(255, 255, 255, 0.4)',
                          fontWeight: 600,
                          px: 3,
                          py: 1.4,
                          borderRadius: 2.5,
                          textTransform: 'none',
                          fontSize: '1rem',
                          '&:hover': {
                            borderColor: '#ffffff',
                            bgcolor: 'rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      >
                        Visiting Cards
                      </Button>
                    </Box>
                  </Box>
                </Container>
              </Box>
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
    </Container>
  );
};

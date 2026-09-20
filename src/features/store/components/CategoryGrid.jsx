import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardActionArea,
  Typography,
  Box,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { CategoryIcon } from '../../../components/common/CategoryIcon';

export const CategoryGrid = ({ categories = [] }) => {
  const navigate = useNavigate();

  return (
    <Grid container spacing={2.5}>
      {categories.map((cat) => (
        <Grid item xs={6} sm={4} md={3} key={cat.category_id}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'rgba(0,0,0,0.06)',
              bgcolor: 'background.paper',
              transition: 'all 0.25s ease',
              '&:hover': {
                transform: 'translateY(-3px)',
                boxShadow: '0 12px 24px rgba(0,0,0,0.06)',
                borderColor: 'primary.light',
                '& .cat-arrow': {
                  transform: 'translateX(4px)',
                },
              },
            }}
          >
            <CardActionArea
              onClick={() => navigate(`/products?category=${cat.slug}`)}
              sx={{ height: '100%', p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(30, 27, 75, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.75rem',
                  mb: 2,
                }}
              >
                <CategoryIcon slug={cat.slug} name={cat.name} sx={{ fontSize: '1.85rem', color: 'primary.main' }} />
              </Box>

              <Typography variant="subtitle1" fontWeight={800} color="text.primary" sx={{ mb: 0.5, lineHeight: 1.2 }}>
                {cat.name}
              </Typography>

              {cat.description && (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', lineHeight: 1.4, mb: 2 }}>
                  {cat.description}
                </Typography>
              )}

              <Box
                sx={{
                  mt: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                }}
              >
                <span>Browse Products</span>
                <ArrowForwardIcon
                  className="cat-arrow"
                  sx={{ fontSize: '0.9rem', transition: 'transform 0.2s' }}
                />
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

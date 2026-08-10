import React from 'react';
import { Box, Typography } from '@mui/material';
import { SearchInput } from '../ui/SearchInput';

export const PageToolbar = ({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions,
  children,
}) => {
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {onSearchChange && (
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={onSearchChange}
              sx={{ minWidth: 260, bgcolor: 'background.paper', borderRadius: 2 }}
            />
          )}
          {actions}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageToolbar;

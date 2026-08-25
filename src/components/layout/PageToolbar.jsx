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
  action,
  children,
}) => {
  const actionItems = actions || action;

  return (
    <Box sx={{ mb: 1.5, flexShrink: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.25rem', sm: '1.5rem' }, lineHeight: 1.2 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {onSearchChange && (
            <SearchInput
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={onSearchChange}
              sx={{ minWidth: { xs: 200, sm: 260 }, bgcolor: 'background.paper', borderRadius: 1.5 }}
            />
          )}
          {actionItems}
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default PageToolbar;


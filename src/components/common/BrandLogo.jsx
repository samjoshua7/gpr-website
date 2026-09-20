import React from 'react';
import { Box, Typography } from '@mui/material';
import logoSvg from '../../assets/logo.svg';

export const BrandLogo = ({
  size = 40,
  showText = true,
  subtitle = 'Since 1997 • Tirunelveli',
  textColor = 'text.primary',
  sx = {},
}) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, ...sx }}>
      <Box
        component="img"
        src={logoSvg}
        alt="GPR Offset Printers"
        onError={(e) => {
          // Fallback if bundler path differs
          if (e.currentTarget.src !== window.location.origin + '/favicon.svg') {
            e.currentTarget.src = '/favicon.svg';
          }
        }}
        sx={{
          width: size,
          height: size,
          objectFit: 'contain',
          flexShrink: 0,
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.12))',
        }}
      />
      {showText && (
        <Box sx={{ minWidth: 0, userSelect: 'none' }}>
          <Typography
            variant="h6"
            fontWeight={900}
            sx={{
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              color: textColor === 'inherit' ? 'inherit' : textColor,
              fontSize: size > 36 ? '1.25rem' : '1.1rem',
              whiteSpace: 'nowrap',
            }}
          >
            GPR Offset Printers
          </Typography>
          {subtitle && (
            <Typography
              variant="caption"
              sx={{
                color: textColor === '#ffffff' ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                letterSpacing: '0.08em',
                fontWeight: 700,
                fontSize: '0.66rem',
                display: 'block',
                whiteSpace: 'nowrap',
              }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

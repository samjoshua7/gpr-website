import { shadows } from './shadows';

export const components = {
  MuiCssBaseline: {
    styleOverrides: {
      html: {
        scrollBehavior: 'smooth',
        boxSizing: 'border-box',
      },
      '*, *::before, *::after': {
        boxSizing: 'inherit',
      },
      body: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontFamily: '"Outfit", "Inter", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
      /* Requirement 2: Custom Thin Rounded Scrollbar */
      '::-webkit-scrollbar': {
        width: '6px',
        height: '6px',
      },
      '::-webkit-scrollbar-track': {
        background: 'transparent',
      },
      '::-webkit-scrollbar-thumb': {
        background: 'rgba(148, 163, 184, 0.4)',
        borderRadius: '999px',
        transition: 'background-color 0.2s ease',
      },
      '::-webkit-scrollbar-thumb:hover': {
        background: 'rgba(100, 116, 139, 0.7)',
      },
      '*': {
        scrollbarWidth: 'thin',
        scrollbarColor: 'rgba(148, 163, 184, 0.4) transparent',
      },
      '::selection': {
        backgroundColor: 'rgba(2, 132, 199, 0.2)',
        color: '#0284c7',
      },
    },
  },

  /* Requirement 4: Button Polish */
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        padding: '8px 18px',
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: 'none',
        textTransform: 'none',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        '&:active': {
          transform: 'scale(0.98)',
        },
        '&.Mui-focusVisible': {
          outline: '2px solid #0284c7',
          outlineOffset: '2px',
        },
      },
      containedPrimary: {
        backgroundColor: '#1e1b4b',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#312e81',
          boxShadow: '0 4px 12px rgba(30, 27, 75, 0.25)',
        },
      },
      containedSecondary: {
        backgroundColor: '#0284c7',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#0369a1',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
        },
      },
      outlined: {
        borderColor: 'rgba(15, 23, 42, 0.15)',
        color: '#0f172a',
        '&:hover': {
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.04)',
        },
      },
    },
  },

  /* Requirement 3: Card Interactions */
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: shadows[1],
        backgroundColor: '#ffffff',
        transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms ease',
      },
    },
  },

  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: shadows[1],
        border: '1px solid rgba(15, 23, 42, 0.06)',
      },
      elevation2: {
        boxShadow: shadows[2],
      },
      elevation3: {
        boxShadow: shadows[3],
      },
    },
  },

  /* Requirement 5: Table Polish */
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: shadows[1],
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: '#f8fafc',
        '& .MuiTableCell-root': {
          fontWeight: 700,
          color: '#0f172a',
          fontSize: '0.85rem',
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          borderBottom: '1.5px solid rgba(15, 23, 42, 0.08)',
          backgroundColor: '#f8fafc',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '14px 16px',
        borderColor: 'rgba(15, 23, 42, 0.06)',
        fontSize: '0.875rem',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 150ms ease-in-out',
        '&.MuiTableRow-hover:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.03)',
        },
      },
    },
  },

  /* Form controls & accessibility */
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        transition: 'border-color 200ms ease, box-shadow 200ms ease',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(15, 23, 42, 0.15)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#0284c7',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#0284c7',
          borderWidth: '1.5px',
          boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.12)',
        },
        '& input[type=number]': {
          '-moz-appearance': 'textfield',
        },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
          '-webkit-appearance': 'none',
          margin: 0,
        },
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
  },

  /* Dialogs & Modals */
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 16,
        boxShadow: shadows[8],
        border: '1px solid rgba(15, 23, 42, 0.08)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontFamily: '"Outfit", sans-serif',
        fontWeight: 700,
        fontSize: '1.25rem',
        padding: '20px 24px 16px 24px',
      },
    },
  },

  /* Menus & Dropdowns */
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: 12,
        boxShadow: shadows[5],
        border: '1px solid rgba(15, 23, 42, 0.08)',
        marginTop: 6,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        margin: '2px 6px',
        padding: '8px 12px',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'background-color 150ms ease',
        '&:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.06)',
          color: '#0284c7',
        },
      },
    },
  },

  /* Chips */
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
    },
  },

  /* Skeleton Loading */
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
      },
    },
  },

  /* Icon Buttons */
  MuiIconButton: {
    styleOverrides: {
      root: {
        transition: 'all 150ms ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
        },
      },
    },
  },
};

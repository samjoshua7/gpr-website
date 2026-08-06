import { shadows } from './shadows';

// Shared density tokens — reuse these across custom (non-MUI-default) components
// so every hand-built surface matches the same scale.
export const density = {
  radius: 2,
  radiusSm: 2,
  radiusLg: 4,
  controlHeight: 30,
  headerHeight: 48,
  drawerWidth: 224,
};

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
        backgroundColor: '#f4f5f7',
        color: '#0f172a',
        fontFamily: '"Inter", sans-serif',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      },
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

  /* Buttons — compact, fixed 32px control height */
  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: density.radius,
        padding: '5px 14px',
        minHeight: density.controlHeight,
        fontWeight: 600,
        fontSize: '0.8125rem',
        letterSpacing: '0.01em',
        boxShadow: 'none',
        textTransform: 'none',
        transition: 'background-color 120ms ease, border-color 120ms ease',
      },
      sizeSmall: {
        minHeight: 28,
        padding: '3px 10px',
        fontSize: '0.75rem',
      },
      sizeLarge: {
        minHeight: 36,
        padding: '7px 18px',
      },
      containedPrimary: {
        backgroundColor: '#1e1b4b',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#312e81',
        },
      },
      containedSecondary: {
        backgroundColor: '#0284c7',
        color: '#ffffff',
        '&:hover': {
          backgroundColor: '#0369a1',
        },
      },
      outlined: {
        borderColor: 'rgba(15, 23, 42, 0.18)',
        color: '#0f172a',
        '&:hover': {
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.04)',
        },
      },
    },
  },

  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: density.radius,
        padding: 6,
        transition: 'background-color 120ms ease',
        '&:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.08)',
        },
      },
      sizeSmall: {
        padding: 4,
      },
    },
  },

  /* Cards & Paper — small radius, subtle border, minimal shadow */
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusLg,
        border: '1px solid rgba(15, 23, 42, 0.08)',
        boxShadow: shadows[1],
        backgroundColor: '#ffffff',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: '12px 16px',
        '&:last-child': { paddingBottom: '12px' },
      },
    },
  },
  MuiCardHeader: {
    styleOverrides: {
      root: {
        padding: '10px 16px',
      },
      title: {
        fontSize: '0.875rem',
        fontWeight: 700,
      },
      subheader: {
        fontSize: '0.75rem',
      },
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusLg,
        backgroundImage: 'none',
      },
      elevation1: {
        boxShadow: shadows[1],
        border: '1px solid rgba(15, 23, 42, 0.08)',
      },
      elevation2: {
        boxShadow: shadows[2],
      },
      elevation3: {
        boxShadow: shadows[3],
      },
    },
  },

  /* Tables — dense rows, sticky header, alternating stripes */
  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusLg,
        border: '1px solid rgba(15, 23, 42, 0.10)',
        boxShadow: 'none',
      },
    },
  },
  MuiTable: {
    styleOverrides: {
      root: {
        borderCollapse: 'separate',
        borderSpacing: 0,
      },
    },
  },
  MuiTableHead: {
    styleOverrides: {
      root: {
        '& .MuiTableCell-root': {
          position: 'sticky',
          top: 0,
          zIndex: 2,
          fontWeight: 700,
          color: '#334155',
          fontSize: '0.6875rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          padding: '8px 12px',
          borderBottom: '1px solid rgba(15, 23, 42, 0.12)',
          backgroundColor: '#f8fafc',
        },
      },
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: {
        padding: '6px 12px',
        borderColor: 'rgba(15, 23, 42, 0.07)',
        fontSize: '0.8125rem',
        lineHeight: 1.4,
      },
      sizeSmall: {
        padding: '4px 10px',
      },
    },
  },
  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 100ms ease-in-out',
        '&.MuiTableRow-hover:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.04)',
        },
        '&:nth-of-type(even):not(:hover)': {
          backgroundColor: 'rgba(15, 23, 42, 0.015)',
        },
      },
    },
  },
  MuiTablePagination: {
    styleOverrides: {
      root: {
        fontSize: '0.75rem',
      },
      toolbar: {
        minHeight: 40,
        paddingLeft: 12,
      },
      selectLabel: {
        fontSize: '0.75rem',
      },
      displayedRows: {
        fontSize: '0.75rem',
      },
    },
  },

  /* Form controls — 32px height inputs */
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: density.radius,
        fontSize: '0.8125rem',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: 'rgba(15, 23, 42, 0.18)',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: '#0284c7',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: '#0284c7',
          borderWidth: '1.5px',
          boxShadow: '0 0 0 3px rgba(2, 132, 199, 0.10)',
        },
        '& input[type=number]': {
          MozAppearance: 'textfield',
        },
        '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
          WebkitAppearance: 'none',
          margin: 0,
        },
      },
      input: {
        padding: '6.5px 10px',
      },
      inputSizeSmall: {
        padding: '5.5px 9px',
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '0.8125rem',
      },
      shrink: {
        fontSize: '0.8125rem',
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        fontSize: '0.6875rem',
        marginLeft: 2,
        marginTop: 3,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
      size: 'small',
    },
  },
  MuiSelect: {
    defaultProps: {
      size: 'small',
    },
  },
  MuiFormControl: {
    defaultProps: {
      size: 'small',
    },
  },

  /* Dialogs — tighter padding, small radius */
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: density.radiusLg,
        boxShadow: shadows[6],
        border: '1px solid rgba(15, 23, 42, 0.08)',
      },
    },
  },
  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontWeight: 700,
        fontSize: '1rem',
        padding: '14px 18px',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
      },
    },
  },
  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '16px 18px',
      },
    },
  },
  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '10px 18px',
        borderTop: '1px solid rgba(15, 23, 42, 0.08)',
      },
    },
  },

  /* Menus & Dropdowns */
  MuiMenu: {
    styleOverrides: {
      paper: {
        borderRadius: density.radiusLg,
        boxShadow: shadows[4],
        border: '1px solid rgba(15, 23, 42, 0.08)',
        marginTop: 4,
      },
    },
  },
  MuiMenuItem: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusSm,
        margin: '1px 5px',
        padding: '6px 10px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        minHeight: 30,
        transition: 'background-color 100ms ease',
        '&:hover': {
          backgroundColor: 'rgba(2, 132, 199, 0.06)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(2, 132, 199, 0.10)',
        },
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusSm,
      },
    },
  },

  /* Chips */
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusSm,
        fontWeight: 600,
        fontSize: '0.6875rem',
        height: 22,
      },
      label: {
        padding: '0 8px',
      },
      sizeSmall: {
        height: 20,
      },
    },
  },

  /* Tabs */
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.8125rem',
        minHeight: 40,
        padding: '8px 14px',
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 40,
      },
    },
  },

  /* Tooltips */
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        fontSize: '0.6875rem',
        padding: '4px 8px',
        borderRadius: density.radiusSm,
      },
    },
  },

  /* Skeleton Loading */
  MuiSkeleton: {
    styleOverrides: {
      root: {
        borderRadius: density.radiusSm,
        backgroundColor: 'rgba(148, 163, 184, 0.12)',
      },
    },
  },

  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: 'none',
        borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
      },
    },
  },

  MuiToolbar: {
    styleOverrides: {
      root: {
        minHeight: `${density.headerHeight}px !important`,
      },
    },
  },
};

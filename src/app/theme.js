import { createTheme } from '@mui/material/styles';

// G.P.R. Printing Press Aesthetic:
// Primary: Professional Dark Charcoal / Ink Blue
// Secondary: Vibrant Cyan / Teal (representing cyan ink)
// Success: Emerald Green
// Warning: Amber Orange
// Error: Ruby Red
export const theme = createTheme({
  palette: {
    primary: {
      main: '#1a237e', // Ink Blue
      light: '#534bae',
      dark: '#000051',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00b0ff', // Cyan
      light: '#69e2ff',
      dark: '#0081cb',
      contrastText: '#000000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
    text: {
      primary: '#212121',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: '"Outfit", "Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

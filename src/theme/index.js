import { createTheme } from '@mui/material/styles';
import { palette } from './palette';
import { typography } from './typography';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { components } from './components';

export const theme = createTheme({
  palette,
  typography,
  shadows,
  spacing,
  components,
});

export default theme;

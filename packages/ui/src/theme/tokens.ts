// Design tokens for consistent theming
export const tokens = {
  colors: {
    primary: {
      main: '#334e68',
      dark: '#243b53',
      light: '#627d98',
      contrast: '#ffffff',
    },
    secondary: {
      main: '#64748b',
      dark: '#475569',
      contrast: '#ffffff',
    },
    success: { main: '#16a34a' },
    warning: { main: '#d97706' },
    danger: { main: '#dc2626' },
    background: {
      primary: '#ffffff',
      secondary: '#f8fafc',
      tertiary: '#f1f5f9',
    },
    text: {
      primary: '#0f172a',
      secondary: '#334155',
      tertiary: '#64748b',
      inverse: '#ffffff',
    },
    border: {
      light: '#e2e8f0',
      medium: '#cbd5e1',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
    },
    fontWeight: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
};

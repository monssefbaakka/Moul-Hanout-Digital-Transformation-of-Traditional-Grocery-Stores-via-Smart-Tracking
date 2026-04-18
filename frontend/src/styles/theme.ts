export const appTheme = {
  id: 'moul-hanout',
  brand: 'Moul Hanout',
  description: 'Production-grade POS SaaS for neighborhood commerce.',
  colors: {
    primary: '#1f7a5a',
    primaryStrong: '#166246',
    secondary: '#eef3ff',
    secondaryStrong: '#dbe6ff',
    success: '#1f8f61',
    danger: '#c94b4b',
    background: '#f4f7fb',
    surface: '#ffffff',
    surfaceMuted: '#f8fbff',
    border: '#dbe4f0',
    text: '#132238',
    textMuted: '#64748b',
  },
  typography: {
    display: '3.5rem',
    h1: '2.75rem',
    h2: '1.875rem',
    h3: '1.25rem',
    body: '1rem',
    small: '0.875rem',
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },
  radius: {
    sm: '0.875rem',
    md: '1.125rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadows: {
    soft: '0 12px 30px rgba(15, 23, 42, 0.08)',
    card: '0 20px 45px rgba(15, 23, 42, 0.08)',
    floating: '0 26px 60px rgba(15, 23, 42, 0.12)',
  },
} as const;

export type AppTheme = typeof appTheme;

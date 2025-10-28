// Design System Tokens for AWAKE Connect
// Centralized design constants for consistent UI

export const colors = {
  // Primary Brand Colors (Green Theme)
  primary: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',  // Main brand green
    600: '#16a34a',  // Darker green for hover states
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Secondary Colors (Amber/Orange for status)
  secondary: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Main amber
    600: '#d97706',  // Darker amber
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Accent Colors (Blue for links and info)
  accent: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Neutral Grays
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Status Colors
  success: '#22c55e',   // Green
  warning: '#f59e0b',   // Amber
  error: '#ef4444',     // Red
  info: '#3b82f6',      // Blue
};

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
};

export const spacing = {
  px: '1px',
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  base: '0.25rem',  // 4px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
};

// Component-specific design tokens
export const components = {
  button: {
    padding: {
      sm: `${spacing[2]} ${spacing[3]}`,     // py-2 px-3
      base: `${spacing[3]} ${spacing[4]}`,   // py-3 px-4
      lg: `${spacing[4]} ${spacing[6]}`,     // py-4 px-6
    },
    borderRadius: borderRadius.xl,  // rounded-xl for all buttons
    fontSize: {
      sm: typography.fontSize.sm,
      base: typography.fontSize.base,
      lg: typography.fontSize.lg,
    },
    fontWeight: typography.fontWeight.medium,
  },
  
  card: {
    padding: spacing[6],           // p-6
    borderRadius: borderRadius.xl,  // rounded-xl
    shadow: shadows.md,
    backgroundColor: '#ffffff',
    border: `1px solid ${colors.gray[200]}`,
  },
  
  input: {
    padding: `${spacing[3]} ${spacing[4]}`,  // py-3 px-4
    borderRadius: borderRadius.xl,           // rounded-xl
    border: `1px solid ${colors.gray[300]}`,
    fontSize: typography.fontSize.base,
    backgroundColor: '#ffffff',
  },
  
  badge: {
    padding: `${spacing[1]} ${spacing[3]}`,  // py-1 px-3
    borderRadius: borderRadius.full,         // rounded-full
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
};

// Navigation and layout constants
export const layout = {
  headerHeight: '4rem',        // 64px
  sidebarWidth: '16rem',       // 256px
  maxContentWidth: '80rem',    // 1280px (max-w-7xl)
  containerPadding: {
    mobile: spacing[4],         // px-4
    tablet: spacing[6],         // px-6  
    desktop: spacing[8],        // px-8
  },
};

// Animation and transition constants
export const transitions = {
  fast: '150ms ease-in-out',
  base: '300ms ease-in-out',
  slow: '500ms ease-in-out',
};

// Utility functions for consistent styling
export const getButtonStyles = (variant = 'primary', size = 'base') => {
  const baseStyles = {
    padding: components.button.padding[size],
    borderRadius: components.button.borderRadius,
    fontSize: components.button.fontSize[size],
    fontWeight: components.button.fontWeight,
    transition: transitions.fast,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    outline: 'none',
  };
  
  const variants = {
    primary: {
      backgroundColor: colors.primary[500],
      color: '#ffffff',
      ':hover': {
        backgroundColor: colors.primary[600],
      },
    },
    secondary: {
      backgroundColor: '#ffffff',
      color: colors.primary[600],
      border: `1px solid ${colors.primary[500]}`,
      ':hover': {
        backgroundColor: colors.primary[50],
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: colors.gray[700],
      border: `1px solid ${colors.gray[300]}`,
      ':hover': {
        backgroundColor: colors.gray[50],
      },
    },
    danger: {
      backgroundColor: colors.error,
      color: '#ffffff',
      ':hover': {
        backgroundColor: '#dc2626',
      },
    },
  };
  
  return { ...baseStyles, ...variants[variant] };
};

export default {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  components,
  layout,
  transitions,
  getButtonStyles,
};
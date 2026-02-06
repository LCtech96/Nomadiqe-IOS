/**
 * iOS Border Radius System
 */

export const borderRadius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 16,
  '3xl': 20,
  '4xl': 24,
  full: 9999,

  // iOS Standard
  button: 10,
  card: 12,
  modal: 14,
  sheet: 10,
} as const;

export type BorderRadius = typeof borderRadius;

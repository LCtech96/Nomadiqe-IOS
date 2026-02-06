/**
 * iOS Spacing System
 * Multipli di 4 per una griglia consistente
 */

export const spacing = {
  // Base spacing units
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
  '6xl': 64,

  // iOS Specific
  hairline: 1,
  separator: 0.5,
  
  // Layout
  screenPadding: 16,
  sectionSpacing: 24,
  cardPadding: 16,
  listItemPadding: 16,
  
  // Navigation
  navBarHeight: 44,
  tabBarHeight: 49,
  statusBarHeight: 44, // including safe area
  
  // Touch targets
  minTouchTarget: 44,
  iconSize: {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
  },
} as const;

export type Spacing = typeof spacing;

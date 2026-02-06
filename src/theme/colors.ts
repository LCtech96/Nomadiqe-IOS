/**
 * iOS Native Color System
 * Segue le linee guida Apple Human Interface Guidelines
 */

export const colors = {
  // iOS System Colors
  system: {
    blue: '#007AFF',
    green: '#34C759',
    indigo: '#5856D6',
    orange: '#FF9500',
    pink: '#FF2D55',
    purple: '#AF52DE',
    red: '#FF3B30',
    teal: '#5AC8FA',
    yellow: '#FFCC00',
  },

  // Primary Brand Colors - Nomadiqe Gradient
  primary: {
    blue: '#4F46E5',      // from-blue-600
    purple: '#9333EA',    // via-purple-600
    pink: '#DB2777',      // to-pink-600
    light: '#818CF8',     // lighter variant
    dark: '#3730A3',      // darker variant
  },

  // Light Mode Colors
  light: {
    background: '#FFFFFF',
    secondaryBackground: '#F2F2F7',
    tertiaryBackground: '#FFFFFF',
    groupedBackground: '#F2F2F7',
    secondaryGroupedBackground: '#FFFFFF',
    tertiaryGroupedBackground: '#F2F2F7',
    
    label: '#000000',
    secondaryLabel: '#3C3C43',
    tertiaryLabel: '#3C3C43',
    quaternaryLabel: '#3C3C43',
    
    separator: '#3C3C43',
    opaqueSeparator: '#C6C6C8',
    
    card: '#FFFFFF',
    cardBorder: 'rgba(0, 0, 0, 0.05)',
    
    fill: 'rgba(120, 120, 128, 0.2)',
    secondaryFill: 'rgba(120, 120, 128, 0.16)',
    tertiaryFill: 'rgba(118, 118, 128, 0.12)',
    quaternaryFill: 'rgba(116, 116, 128, 0.08)',
  },

  // Dark Mode Colors
  dark: {
    background: '#000000',
    secondaryBackground: '#1C1C1E',
    tertiaryBackground: '#2C2C2E',
    groupedBackground: '#000000',
    secondaryGroupedBackground: '#1C1C1E',
    tertiaryGroupedBackground: '#2C2C2E',
    
    label: '#FFFFFF',
    secondaryLabel: '#EBEBF5',
    tertiaryLabel: '#EBEBF5',
    quaternaryLabel: '#EBEBF5',
    
    separator: '#545458',
    opaqueSeparator: '#38383A',
    
    card: '#1C1C1E',
    cardBorder: 'rgba(255, 255, 255, 0.05)',
    
    fill: 'rgba(120, 120, 128, 0.36)',
    secondaryFill: 'rgba(120, 120, 128, 0.32)',
    tertiaryFill: 'rgba(118, 118, 128, 0.24)',
    quaternaryFill: 'rgba(116, 116, 128, 0.18)',
  },

  // Semantic Colors
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#007AFF',

  // Transparent
  transparent: 'transparent',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.4)',
  lightOverlay: 'rgba(0, 0, 0, 0.2)',
} as const;

export type Colors = typeof colors;

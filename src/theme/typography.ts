/**
 * iOS Typography System
 * Based on SF Pro (System Font) specifications
 */

export const typography = {
  // iOS Text Styles
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '400' as const,
    letterSpacing: 0.37,
  },
  
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '400' as const,
    letterSpacing: 0.36,
  },
  
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '400' as const,
    letterSpacing: 0.35,
  },
  
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '400' as const,
    letterSpacing: 0.38,
  },
  
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.41,
  },
  
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.41,
  },
  
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
    letterSpacing: -0.32,
  },
  
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.24,
  },
  
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.08,
  },
  
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
    letterSpacing: 0,
  },
  
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
    letterSpacing: 0.07,
  },

  // Font Weights
  fontWeights: {
    ultraLight: '100',
    thin: '200',
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    heavy: '800',
    black: '900',
  } as const,

  // Font Families (default system font on iOS)
  fontFamily: {
    system: 'System',
    rounded: 'System', // Can be customized with SF Pro Rounded
    monospace: 'Menlo',
  },
} as const;

export type Typography = typeof typography;

/**
 * iOS Theme System
 * Tema unificato per l'app Nomadiqe iOS
 */

import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { borderRadius } from './borderRadius';
import { shadows } from './shadows';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
} as const;

export type Theme = typeof theme;

export { colors, typography, spacing, borderRadius, shadows };

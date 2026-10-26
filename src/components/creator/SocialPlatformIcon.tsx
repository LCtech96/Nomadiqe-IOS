import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import type { SocialPlatform } from '../../constants/creator';

const PLATFORM_ICONS: Record<SocialPlatform, keyof typeof Ionicons.glyphMap> = {
  instagram: 'logo-instagram',
  tiktok: 'logo-tiktok',
  facebook: 'logo-facebook',
  x: 'logo-twitter',
  linkedin: 'logo-linkedin',
  youtube: 'logo-youtube',
  reddit: 'logo-reddit',
};

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  instagram: '#E4405F',
  tiktok: '#000000',
  facebook: '#1877F2',
  x: '#000000',
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  reddit: '#FF4500',
};

export function SocialPlatformIcon({
  platform,
  size = 22,
}: {
  platform: SocialPlatform;
  size?: number;
}) {
  return (
    <Ionicons name={PLATFORM_ICONS[platform]} size={size} color={PLATFORM_COLORS[platform]} />
  );
}

/**
 * Avatar Component - iOS Style
 * Avatar con fallback e badge verificato
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { useTheme } from '../../contexts/ThemeContext';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  verified?: boolean;
  style?: ViewStyle;
}

export function Avatar({
  uri,
  size = 40,
  verified = false,
  style,
}: AvatarProps) {
  const { isDark } = useTheme();

  // Coerce to correct types for native (avoid string from API/config)
  const sizeNum = Number(size) || 40;
  const isVerified = Boolean(verified);

  const backgroundColor = isDark
    ? theme.colors.dark.fill
    : theme.colors.light.fill;

  return (
    <View style={[styles.container, { width: sizeNum, height: sizeNum }, style]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{
            width: sizeNum,
            height: sizeNum,
            borderRadius: sizeNum / 2,
          }}
          contentFit="cover"
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: sizeNum,
              height: sizeNum,
              borderRadius: sizeNum / 2,
              backgroundColor,
            },
          ]}
        >
          <Ionicons
            name="person"
            size={sizeNum * 0.5}
            color={isDark ? theme.colors.dark.label : theme.colors.light.label}
          />
        </View>
      )}
      {isVerified && (
        <View style={[styles.verifiedBadge, { width: sizeNum * 0.3, height: sizeNum * 0.3 }]}>
          <Ionicons name="checkmark-circle" size={sizeNum * 0.3} color={theme.colors.system.blue} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
  },
});

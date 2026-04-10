/**
 * KOL&BED Swipe stack – Tinder-style.
 * Swipe right (→) = request collaboration; swipe left (←) = skip.
 * Uses React Native Animated + PanResponder. Only claims horizontal drags so vertical scroll inside the card works.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  Animated,
  PanResponder,
} from 'react-native';
import { KolbedCreatorCard } from './KolbedCreatorCard';
import type { UserProfile } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { useI18n } from '../../contexts/I18nContext';
import { theme } from '../../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HORIZONTAL_PADDING = theme.spacing.screenPadding * 2;
const CARD_WIDTH = SCREEN_WIDTH - HORIZONTAL_PADDING;
const SWIPE_THRESHOLD = CARD_WIDTH * 0.35;
const SWIPE_OFFSCREEN = CARD_WIDTH * 1.2;
/** Min horizontal move to claim gesture (so vertical scroll in card is not stolen) */
const HORIZONTAL_SLOP = 12;
/** Ratio: horizontal must dominate over vertical to start swipe */
const HORIZONTAL_BIAS = 1.4;

export interface KolbedSwipeStackProps {
  profiles: UserProfile[];
  onSwipeLeft: (profile: UserProfile) => void;
  /** Swipe a destra o pulsante: richiesta collaborazione (apre modale dettagli) */
  onRequestCollaboration: (profile: UserProfile) => void;
  onPressViewCatalog?: (jollyId: string) => void;
}

export function KolbedSwipeStack({
  profiles,
  onSwipeLeft,
  onRequestCollaboration,
  onPressViewCatalog,
}: KolbedSwipeStackProps) {
  const { isDark } = useTheme();
  const { t } = useI18n();
  const translateX = useRef(new Animated.Value(0)).current;
  const topId = profiles[0]?.id ?? null;

  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onRequestCollabRef = useRef(onRequestCollaboration);
  const currentProfileRef = useRef<UserProfile | null>(null);
  const swipeInProgressRef = useRef(false);
  onSwipeLeftRef.current = onSwipeLeft;
  onRequestCollabRef.current = onRequestCollaboration;
  currentProfileRef.current = profiles[0] ?? null;

  // Reset posizione card a ogni nuovo profilo in cima, per swipe consecutivi senza blocchi
  useEffect(() => {
    translateX.setValue(0);
    swipeInProgressRef.current = false;
  }, [topId, translateX]);

  useEffect(() => {
    if (profiles.length > 0) currentProfileRef.current = profiles[0];
  }, [profiles]);

  const triggerLeft = () => {
    const profile = currentProfileRef.current;
    swipeInProgressRef.current = false;
    if (profile) onSwipeLeftRef.current(profile);
  };

  /** Richiesta collab: riporta la card al centro e apre il modale (nessuna animazione off-screen) */
  const triggerCollaborationRequest = () => {
    const profile = currentProfileRef.current;
    swipeInProgressRef.current = false;
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 8,
      tension: 80,
    }).start(() => {
      if (profile) onRequestCollabRef.current(profile);
    });
  };

  const runSwipeAnimation = (direction: 'left' | 'right') => {
    if (swipeInProgressRef.current) return;
    swipeInProgressRef.current = true;
    if (direction === 'right') {
      triggerCollaborationRequest();
      return;
    }
    const toValue = -SWIPE_OFFSCREEN;
    Animated.spring(translateX, {
      toValue,
      useNativeDriver: true,
      speed: 20,
      bounciness: 0,
    }).start(triggerLeft);
  };

  const handleReject = () => {
    if (swipeInProgressRef.current) return;
    translateX.setValue(0);
    runSwipeAnimation('left');
  };

  const handleCollaborationPress = () => {
    if (swipeInProgressRef.current) return;
    translateX.setValue(0);
    triggerCollaborationRequest();
  };

  const panResponder = useRef(
    PanResponder.create({
      // Do not claim on touch start: let ScrollView get vertical scrolls
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      // Only claim when user clearly drags horizontally (so card scroll works)
      onMoveShouldSetPanResponder: (_, g) => {
        const { dx, dy } = g;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        return absDx > HORIZONTAL_SLOP && absDx > absDy * HORIZONTAL_BIAS;
      },
      onMoveShouldSetPanResponderCapture: (_, g) => {
        const { dx, dy } = g;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        return absDx > HORIZONTAL_SLOP && absDx > absDy * HORIZONTAL_BIAS;
      },
      // Allow child (ScrollView) to take the gesture if it needs it
      onPanResponderTerminationRequest: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (!swipeInProgressRef.current) translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (swipeInProgressRef.current) return;
        const { dx, vx } = gestureState;
        const goLeft = dx < -SWIPE_THRESHOLD || vx < -0.35;
        const goRight = dx > SWIPE_THRESHOLD || vx > 0.35;
        if (goRight) {
          runSwipeAnimation('right');
        } else if (goLeft) {
          runSwipeAnimation('left');
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 8,
            tension: 80,
          }).start();
        }
      },
    })
  ).current;

  const animatedCardStyle = {
    transform: [{ translateX }],
  };

  if (profiles.length === 0) {
    return (
      <View style={[styles.empty, { backgroundColor: isDark ? theme.colors.dark.background : theme.colors.light.background }]}>
        <Text style={[styles.emptyText, { color: isDark ? theme.colors.dark.secondaryLabel : theme.colors.light.secondaryLabel }]}>
          {t('kolbed.noProfilesToShow')}
        </Text>
      </View>
    );
  }

  const current = profiles[0];
  const next = profiles[1];

  return (
    <View style={styles.container}>
      {/* Prossima card: nascosta dietro la corrente (solo la corrente è visibile fino a swipe completo) */}
      {next && (
        <View style={[styles.cardLayer, styles.cardLayerBehind]} pointerEvents="none">
          <KolbedCreatorCard
          profile={next}
          onPressViewCatalog={onPressViewCatalog}
          onReject={handleReject}
          onAccept={handleCollaborationPress}
        />
        </View>
      )}

      <Animated.View
        key={current.id}
        style={[styles.cardLayer, animatedCardStyle]}
        {...panResponder.panHandlers}
      >
        <KolbedCreatorCard
          profile={current}
          onReject={handleReject}
          onAccept={handleCollaborationPress}
          onPressViewCatalog={onPressViewCatalog}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  cardLayer: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardLayerBehind: {
    opacity: 0,
    zIndex: 0,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.screenPadding,
  },
  emptyText: {
    ...theme.typography.body,
    textAlign: 'center',
  },
});

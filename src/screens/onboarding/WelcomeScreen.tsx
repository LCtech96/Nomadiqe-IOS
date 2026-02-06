/**
 * Welcome Screen
 * Prima schermata onboarding
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContext';
import { theme } from '../../theme';
import type { OnboardingScreenProps } from '../../types/navigation';

export default function WelcomeScreen({ navigation }: OnboardingScreenProps<'Welcome'>) {
  const { isDark } = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <LinearGradient
        colors={[
          theme.colors.primary.blue,
          theme.colors.primary.purple,
          theme.colors.primary.pink,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo/Icon area */}
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>✈️</Text>
            <Text style={styles.appName}>Nomadiqe</Text>
          </View>

          {/* Welcome text */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Nomadiqe</Text>
            <Text style={styles.subtitle}>
              Connect, collaborate, and discover unique stays worldwide
            </Text>
          </View>

          {/* CTA */}
          <View style={styles.buttonContainer}>
            <Button
              onPress={() => navigation.navigate('RoleSelection')}
              size="lg"
              variant="secondary"
              style={styles.button}
            >
              Get Started
            </Button>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: theme.spacing.screenPadding,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: theme.spacing['6xl'],
  },
  logo: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    ...theme.typography.largeTitle,
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    ...theme.typography.title3,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  buttonContainer: {
    marginBottom: theme.spacing.lg,
  },
  button: {
    backgroundColor: '#FFFFFF',
  },
});

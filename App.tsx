/**
 * Nomadiqe iOS App
 * Main entry point
 *
 * Per testare solo la connessione: imposta MINIMAL_APP = true, salva, ricarica in Expo Go.
 * Se vedi "Connesso ✓", la rete funziona e l'errore è nell'app. Rimetti false e ricarica.
 */

import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Providers
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { I18nProvider } from './src/contexts/I18nContext';

// Navigation
import { RootNavigator } from './src/navigation';

// Imposta true solo per verificare che Expo Go si connetta (schermata minima)
      const MINIMAL_APP = false;

export default function App() {
  if (MINIMAL_APP) {
    return (
      <SafeAreaProvider>
        <View style={styles.minimal}>
          <Text style={styles.minimalText}>Connesso ✓</Text>
          <Text style={styles.minimalSub}>Rimetti MINIMAL_APP = false e ricarica</Text>
        </View>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <I18nProvider>
            <AuthProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </AuthProvider>
          </I18nProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  minimal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  minimalText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  minimalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

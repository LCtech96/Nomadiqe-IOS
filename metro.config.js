const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Assicura che il bundle web non usi routerRoot=app (progetto senza Expo Router)
config.resolver = config.resolver || {};
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['require', 'import', 'react-native', 'browser', 'default'];

module.exports = config;

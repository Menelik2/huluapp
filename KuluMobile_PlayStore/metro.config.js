const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro config for Hermes.
 * RN packs bytecode for release automatically when hermesEnabled=true.
 */
const config = {
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // faster startup with Hermes
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);

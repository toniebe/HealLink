const path = require('path');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-dotenv', {
      moduleName: '@env',
      path: process.env.ENVFILE || '.env',
      safe: false,
      allowUndefined: true,
    }],
    'react-native-reanimated/plugin',
  ],
  env: {
    production: {
      plugins: ['react-native-paper/babel'],
    },
  },
};
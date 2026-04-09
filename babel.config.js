module.exports = (api) => {
  const isWeb = api.env('web');

  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: process.env.ENVFILE || '.env',
        safe: false,
        allowUndefined: true,
      }],
      // Exclude reanimated plugin for web builds (handled via CSS on web)
      ...(isWeb ? [] : ['react-native-reanimated/plugin']),
    ],
    env: {
      production: {
        plugins: ['react-native-paper/babel'],
      },
    },
  };
};
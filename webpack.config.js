const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const appDirectory = __dirname;

// Node modules that need to be transpiled for web
const compileNodeModules = [
  'react-native',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-screens',
  'react-native-safe-area-context',
  '@react-navigation',
  'react-native-paper',
  'react-native-svg',
  'lucide-react-native',
  '@react-native-vector-icons',
  'react-native-gifted-charts',
  '@react-native-community/netinfo',
  'react-native-image-picker',
  'react-native-get-random-values',
  'react-native-linear-gradient',
].map(mod => path.resolve(appDirectory, 'node_modules', mod));

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: path.resolve(appDirectory, 'index.web.js'),
    output: {
      filename: 'bundle.web.js',
      path: path.resolve(appDirectory, 'web-build'),
      clean: true,
    },
    resolve: {
      extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
      // Prefer CJS (main) over ESM (module) to avoid interop issues with
      // @react-native/babel-preset transforming ESM → CJS in webpack context
      mainFields: ['browser', 'main', 'module'],
      alias: {
        // Map react-native to react-native-web
        'react-native$': 'react-native-web',
        // Stubs for native-only packages
        '@notifee/react-native': path.resolve(appDirectory, 'src/web/stubs/notifee.js'),
        'react-native-mmkv': path.resolve(appDirectory, 'src/web/stubs/mmkv.js'),
        '@react-native-firebase/app': path.resolve(appDirectory, 'src/web/stubs/firebase-app.js'),
        'react-native-incall-manager': path.resolve(appDirectory, 'src/web/stubs/incall-manager.js'),
        'react-native-permissions': path.resolve(appDirectory, 'src/web/stubs/permissions.js'),
        'react-native-wear-connectivity': path.resolve(appDirectory, 'src/web/stubs/wear-connectivity.js'),
        '@stream-io/react-native-webrtc': path.resolve(appDirectory, 'src/web/stubs/webrtc.js'),
        '@stream-io/video-react-native-sdk': path.resolve(appDirectory, 'src/web/stubs/video-sdk.js'),
        'react-native-linear-gradient': path.resolve(appDirectory, 'src/web/stubs/linear-gradient.js'),
        // Vector icons
        'react-native-vector-icons': path.resolve(appDirectory, 'src/web/stubs/react-native-vector-icons'),
        '@expo/vector-icons': path.resolve(appDirectory, 'src/web/stubs/expo-vector-icons'),
        '@react-native-vector-icons/get-image': path.resolve(appDirectory, 'src/web/stubs/rn-vector-icons-get-image.js'),
        // Expo packages used by third-party libs
        'expo-linear-gradient': path.resolve(appDirectory, 'src/web/stubs/linear-gradient.js'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(tsx?|jsx?)$/,
          exclude: (modulePath) => {
            // Don't transpile node_modules unless in the allowed list
            if (!modulePath.includes('node_modules')) return false;
            return !compileNodeModules.some(mod => modulePath.startsWith(mod));
          },
          // Force webpack to treat babel output as CJS, not ESM
          type: 'javascript/auto',
          use: {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              envName: 'web',
            },
          },
        },
        {
          test: /\.(gif|jpe?g|png|ttf|otf|woff|woff2|eot)$/,
          type: 'asset/resource',
        },
        {
          test: /\.svg$/,
          use: ['@svgr/webpack'],
          issuer: /\.[jt]sx?$/,
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: path.resolve(appDirectory, 'public/index.html'),
      }),
      new webpack.DefinePlugin({
        __DEV__: JSON.stringify(!isProd),
        'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      historyApiFallback: true,
      static: {
        directory: path.join(appDirectory, 'public'),
      },
    },
  };
};

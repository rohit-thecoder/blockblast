export default ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins || []),
    [
      'react-native-google-mobile-ads',
      {
        androidAppId:
          process.env.EXPO_PUBLIC_ADMOB_ANDROID_APP_ID ||
          'ca-app-pub-3940256099942544~3347511713',
      },
    ],
  ],
});
module.exports = {
  name: 'Grad Wizard',
  slug: 'gwizard',
  version: '1.0.0',
  orientation: 'portrait',
  owner: "ennoo",
  icon: './assets/images/logo.png',
  userInterfaceStyle: 'automatic',
  android: {
    package: "com.enesoy.gradwizard",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo0.png",
      backgroundColor: "#FFFFFF"
    },
    config: {
      googleMobileAdsAppId: "ca-app-pub-3940256099942544~3347511713"
    }
  },
  ios: {
    bundleIdentifier: "com.enesoy.gradwizard",
    buildNumber: "1.0.0",
    supportsTablet: true,
    config: {
      googleMobileAdsAppId: "ca-app-pub-3940256099942544~1458002511"
    }
  },
  plugins: [
    "expo-router",
    [
      "react-native-google-mobile-ads",
      {
        android_app_id: "ca-app-pub-7510384238146981~7328107511",
        ios_app_id: "ca-app-pub-7510384238146981~7328107511",
        delay_app_measurement_init: true,
        user_tracking_usage_description: "This identifier will be used to deliver personalized ads to you."
      }
    ],
    [
      'expo-ads-admob',
      {
        userTrackingPermission: "This identifier will be used to deliver personalized ads to you."
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "bfd6db33-c23c-40a9-aa02-3967402f33e5"
    }
  }
};

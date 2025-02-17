module.exports = {
  name: 'Grade Wizard',
  slug: 'gwizard',
  version: '1.0.0',
  orientation: 'portrait',
  owner: "ennoo",
  icon: './assets/images/loggo2.png',
  userInterfaceStyle: 'automatic',
  splash: {
    image: './assets/images/loggo2.png',
    resizeMode: 'contain',
    backgroundColor: "#2e960f"  // Renk güncellendi
  },
  android: {
    package: "com.enesoy.gradwizard",
    adaptiveIcon: {
      foregroundImage: "./assets/images/loggo.png",
      backgroundColor: "#2e960f"  // Renk güncellendi
    },
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ],
    config: {
      googleMobileAdsAppId: "ca-app-pub-7510384238146981~7328107511"
    }
  },
  ios: {
    bundleIdentifier: "com.enesoy.gradwizard",
    buildNumber: "1.0.0",
    supportsTablet: true,
    config: {
      googleMobileAdsAppId: "ca-app-pub-7510384238146981~7328107511"
    }
  },
  plugins: [
    "expo-router"
  ],
  extra: {
    eas: {
      projectId: "bfd6db33-c23c-40a9-aa02-3967402f33e5"
    }
  }
};

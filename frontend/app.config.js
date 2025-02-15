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
    }
  },
  ios: {
    bundleIdentifier: "com.enesoy.gradwizard",
    buildNumber: "1.0.0",
    supportsTablet: true
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

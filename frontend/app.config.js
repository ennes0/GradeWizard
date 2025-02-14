module.exports = {
  name: 'Grad Wizard',
  slug: 'gradwizard',
  version: '1.0.0',
  orientation: 'portrait',
  android: {
    package: "com.enesoy.gradwizard",
    adaptiveIcon: {
      foregroundImage: "./assets/images/logo0.pngs",
      backgroundColor: "#FFFFFF"
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
    ]
  ],
  extra: {
    eas: {
      projectId: "c7af8250-2584-41a8-bf2c-1df4d81266bf"
    }
  }
};

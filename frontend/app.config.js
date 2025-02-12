module.exports = {
  name: 'Grad Wizard',
  slug: 'gradwizard',
  version: '1.0.0',
  orientation: 'portrait',
  plugins: [
    'expo-router',
    [
      'expo-ads-admob',
      {
        userTrackingPermission: "This identifier will be used to deliver personalized ads to you."
      }
    ]
  ],
  android: {
    config: {
      googleMobileAdsAppId: "ca-app-pub-3940256099942544~3347511713"
    }
  },
  ios: {
    config: {
      googleMobileAdsAppId: "ca-app-pub-3940256099942544~1458002511"
    }
  }
};

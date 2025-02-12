import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { AdMobBanner } from 'expo-ads-admob';

function AdTestScreen() {
  const bannerTestID = Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  });

  const handleError = (error: any) => {
    console.error("Ad Error:", error);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Ad Test Page</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Banner Ad Test</Text>
          <AdMobBanner
            bannerSize="banner"
            adUnitID={bannerTestID || ''}
            servePersonalizedAds={true}
            onDidFailToReceiveAdWithError={handleError}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Large Banner Ad Test</Text>
          <AdMobBanner
            bannerSize="mediumRectangle"
            adUnitID={bannerTestID || ''}
            servePersonalizedAds={true}
            onDidFailToReceiveAdWithError={handleError}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#388E3C',
  },
  section: {
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
});

export default AdTestScreen;

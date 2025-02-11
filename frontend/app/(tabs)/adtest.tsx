import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, InterstitialAd } from 'react-native-google-mobile-ads';

const AdTestScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ad Test Page</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Banner Ad Test</Text>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Large Banner Ad Test</Text>
        <BannerAd
          unitId={TestIds.BANNER}
          size={BannerAdSize.MEDIUM_RECTANGLE}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
    </ScrollView>
  );
};

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

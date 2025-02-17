import mobileAds, { 
  MaxAdContentRating, 
  TestIds
} from 'react-native-google-mobile-ads';
import { View } from 'react-native';
import React from 'react';

class AdService {
  static isInitialized = false;

  // Reklam ID'leri
  static readonly adUnitIds = {
    banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-7510384238146981/5021875513',
    interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7510384238146981/5021875513',
    rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-7510384238146981/5021875513'
  };

  static async initialize() {
    if (this.isInitialized) return;

    try {
      // Set global ad configuration
      await mobileAds().setRequestConfiguration({
        // Set max ad content rating
        maxAdContentRating: MaxAdContentRating.PG,
        
        // Configure for COPPA compliance
        tagForChildDirectedTreatment: true,
        tagForUnderAgeOfConsent: true,
        
        // Add test devices
        testDeviceIdentifiers: ['EMULATOR'],
      });

      // Initialize AdMob
      await mobileAds().initialize();
      
      this.isInitialized = true;
      console.log('✅ AdMob initialized successfully');
    } catch (error) {
      console.error('❌ AdMob initialization error:', error);
      this.isInitialized = false;
    }
  }

  static getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded') {
    return this.adUnitIds[type];
  }
}

export default AdService;

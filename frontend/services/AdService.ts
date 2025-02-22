import mobileAds, { 
  MaxAdContentRating, 
  TestIds
} from 'react-native-google-mobile-ads';
import { Platform } from 'react-native';

class AdService {
  static isInitialized = false;

  static readonly adUnitIds = {
    banner: __DEV__ ? TestIds.BANNER : 'ca-app-pub-7510384238146981/9885601056',
    interstitial: __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-7510384238146981/1277913911',
    rewarded: __DEV__ ? TestIds.REWARDED : 'ca-app-pub-7510384238146981/9178199633'
  };

  static async initialize() {
    if (this.isInitialized) return;

    try {
      const requestConfiguration = {
        maxAdContentRating: MaxAdContentRating.PG,
        
        // COPPA ayarlarını production'da undefined bırakıyoruz
        // böylece kullanıcı yaşına göre uygulama içinde ayarlanabilir
        tagForChildDirectedTreatment: __DEV__ ? true : undefined,
        tagForUnderAgeOfConsent: __DEV__ ? true : undefined,
        
        // Test cihazları sadece development modunda ekleniyor
        testDeviceIdentifiers: __DEV__ ? ['EMULATOR'] : [],
      };

      await mobileAds().setRequestConfiguration(requestConfiguration);
      await mobileAds().initialize();
      
      this.isInitialized = true;
      console.log('AdMob initialized successfully');
    } catch (error) {
      // Hata yönetimini geliştirme
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('AdMob initialization failed:', errorMessage);
      
      // Production'da hataları kullanıcıya göstermiyoruz
      if (__DEV__) {
        throw new Error(`AdMob initialization failed: ${errorMessage}`);
      }
      
      this.isInitialized = false;
    }
  }

  static getAdUnitId(type: 'banner' | 'interstitial' | 'rewarded') {
    if (!this.isInitialized && !__DEV__) {
      console.warn('AdMob not initialized, ads may not work properly');
    }
    return this.adUnitIds[type];
  }
}

export default AdService;

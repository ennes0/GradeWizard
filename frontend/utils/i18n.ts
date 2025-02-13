import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from '../translations/en';
import tr from '../translations/tr';

i18next
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      tr: { translation: tr }
    },
    lng: Localization.locale.split('-')[0],
    fallbackLng: 'tr',
    interpolation: {
      escapeValue: false
    }
  });

// Language persistence
AsyncStorage.getItem('userLanguage')
  .then(language => {
    if (language) {
      i18next.changeLanguage(language);
    }
  })
  .catch(err => console.log('Error loading language:', err));

export default i18next;

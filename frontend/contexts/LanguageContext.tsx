import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import tr from '../translations/tr';
import en from '../translations/en';

const translations = { tr, en };

type LanguageContextType = {
  language: string;
  t: (key: string) => string;
  changeLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  t: () => '',
  changeLanguage: async () => {},
});

type LanguageType = 'tr' | 'en';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageType>('tr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('language');
      if (savedLanguage && (savedLanguage === 'tr' || savedLanguage === 'en')) {
        setLanguage(savedLanguage as LanguageType);
        console.log('Loaded language:', savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const changeLanguage = async (lang: LanguageType) => {
    try {
      await AsyncStorage.setItem('language', lang);
      setLanguage(lang);
      
      // Force app-wide re-render
      const event = new Event('languageChanged');
      document.dispatchEvent(event);
      
      console.log('Language changed to:', lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);

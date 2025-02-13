import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../contexts/LanguageContext';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const languages = [
  { 
    code: 'tr', 
    name: 'Türkçe', 
    nativeName: 'Türkçe',
    icon: 'flag',
    description: 'Türkçe dilinde devam et'
  },
  { 
    code: 'en', 
    name: 'English', 
    nativeName: 'English',
    icon: 'flag-usa',
    description: 'Continue in English'
  }
];

export default function LanguageSelect() {
  const { changeLanguage } = useLanguage();

  const handleLanguageSelect = async (langCode: string) => {
    try {
      await changeLanguage(langCode);
      console.log('Language changed to:', langCode);
      // Önce dil ayarını kaydet
      await AsyncStorage.setItem('language', langCode);
      // Sonra onboarding'e yönlendir
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error in language selection:', error);
    }
  };

  return (
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <FontAwesome5 name="globe" size={40} color="#388E3C" />
          <Text style={styles.welcomeText}>Welcome / Hoş Geldiniz</Text>
          <Text style={styles.subtitle}>Please select your language</Text>
          <Text style={styles.subtitle}>Lütfen dilinizi seçin</Text>
        </View>

        <View style={styles.languagesContainer}>
          {languages.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={styles.languageButton}
              onPress={() => handleLanguageSelect(lang.code)}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F5F5F5']}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonContent}>
                  <FontAwesome5 name={lang.icon} size={24} color="#388E3C" />
                  <View style={styles.textContainer}>
                    <Text style={styles.languageName}>{lang.nativeName}</Text>
                    <Text style={styles.languageDesc}>{lang.description}</Text>
                  </View>
                  <FontAwesome5 name="chevron-right" size={16} color="#388E3C" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  languagesContainer: {
    gap: 16,
  },
  languageButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  buttonGradient: {
    padding: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  textContainer: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  languageDesc: {
    fontSize: 14,
    color: '#666',
  },
});

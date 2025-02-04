import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    try {
      await AsyncStorage.setItem('userLanguage', lng);
      i18n.changeLanguage(lng);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.langButton,
          i18n.language === 'tr' && styles.activeButton
        ]}
        onPress={() => changeLanguage('tr')}
      >
        <Text style={styles.langText}>🇹🇷 Türkçe</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.langButton,
          i18n.language === 'en' && styles.activeButton
        ]}
        onPress={() => changeLanguage('en')}
      >
        <Text style={styles.langText}>🇬🇧 English</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    padding: 10,
  },
  langButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  activeButton: {
    backgroundColor: '#E8F5E9',
    borderColor: '#388E3C',
  },
  langText: {
    fontSize: 16,
  },
});

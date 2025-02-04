import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { subjects } from '../../../constants/data';

export default function SubjectSelect() {
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    const profile = await AsyncStorage.getItem('userProfile');
    if (profile) {
      const parsed = JSON.parse(profile);
      setUserData(parsed);
      setSelectedSubject(parsed.subject);
    }
  };

  const handleSave = async () => {
    if (!selectedSubject) return;

    try {
      const updatedProfile = { ...userData, subject: selectedSubject };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      router.back();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Bölümünü Seç</Text>
        <View style={styles.grid}>
          {subjects.map(subject => (
            <TouchableOpacity
              key={subject.id}
              style={[
                styles.card,
                selectedSubject === subject.id && styles.cardSelected
              ]}
              onPress={() => setSelectedSubject(subject.id)}
            >
              <FontAwesome5 
                name={subject.icon} 
                size={24} 
                color={selectedSubject === subject.id ? '#fff' : '#388E3C'} 
              />
              <Text style={[
                styles.cardText,
                selectedSubject === subject.id && styles.cardTextSelected
              ]}>
                {subject.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.saveButton, !selectedSubject && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!selectedSubject}
      >
        <Text style={styles.saveButtonText}>Kaydet</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // ...copy relevant styles from user-setup.tsx
});

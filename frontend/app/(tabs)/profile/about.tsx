import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function About() {
  const appInfo = {
    version: '1.0.0',
    developer: 'Grade Wizard Team',
    email: 'support@gradewizard.com',
    website: 'www.gradewizard.com'
  };

  const features = [
    { title: 'AI-Powered Predictions', icon: 'robot', description: 'Advanced grade prediction using artificial intelligence' },
    { title: 'Study Planning', icon: 'calendar-check', description: 'Personalized study plans and schedules' },
    { title: 'Progress Tracking', icon: 'chart-line', description: 'Detailed progress monitoring and analytics' },
    { title: 'Daily Quiz', icon: 'question-circle', description: 'Daily quizzes to test your knowledge' }
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="arrow-left" size={20} color="#388E3C" />
        </TouchableOpacity>
        <Text style={styles.title}>About Grade Wizard</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="hat-wizard" size={60} color="#388E3C" />
          <Text style={styles.appName}>Grade Wizard</Text>
          <Text style={styles.version}>Version {appInfo.version}</Text>
        </View>

        <Text style={styles.description}>
          Grade Wizard is your intelligent study companion, helping you achieve your academic goals through AI-powered predictions and personalized study planning.
        </Text>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Key Features</Text>
          {features.map((feature, index) => (
            <LinearGradient
              key={index}
              colors={['#F1F8E9', '#E8F5E9']}
              style={styles.featureCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureIcon}>
                <FontAwesome5 name={feature.icon} size={24} color="#388E3C" />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        <View style={styles.contactSection}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL(`mailto:${appInfo.email}`)}
          >
            <FontAwesome5 name="envelope" size={20} color="#388E3C" />
            <Text style={styles.contactText}>{appInfo.email}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL(`https://${appInfo.website}`)}
          >
            <FontAwesome5 name="globe" size={20} color="#388E3C" />
            <Text style={styles.contactText}>{appInfo.website}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2024 {appInfo.developer}. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    backgroundColor: '#FFF',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 15,
  },
  content: {
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 10,
  },
  version: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  featureCard: {
    flexDirection: 'row',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 30,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  contactText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 15,
  },
  copyright: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
  }
});

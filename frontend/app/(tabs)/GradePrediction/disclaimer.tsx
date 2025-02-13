import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function DisclaimerScreen() {
  const router = useRouter();

  const FeatureItem = ({ icon, text }) => (
    <View style={styles.featureItem}>
      <View style={styles.iconContainer}>
        <FontAwesome5 name={icon} size={24} color="#388E3C" />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} bounces={false}>
      <View style={styles.content}>
        <View style={styles.header}>
          <FontAwesome5 name="info-circle" size={40} color="#388E3C" />
          <Text style={styles.title}>About Grade Prediction</Text>
        </View>

        <Text style={styles.description}>
          This system is an AI-based prediction tool. Results are not definitive 
          and are intended for guidance only.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Predictions are based on these factors:</Text>
        
        <View style={styles.featuresList}>
          <FeatureItem 
            icon="brain" 
            text="Your knowledge level in topics"
          />
          <FeatureItem 
            icon="clock" 
            text="Study duration"
          />
          <FeatureItem 
            icon="star" 
            text="Motivation level"
          />
          <FeatureItem 
            icon="chart-line" 
            text="Previous grades"
          />
        </View>

        <View style={styles.note}>
          <FontAwesome5 name="lightbulb" size={20} color="#FFA000" />
          <Text style={styles.noteText}>
            Please answer all questions honestly for more accurate predictions.
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>I Understand</Text>
          <FontAwesome5 name="check" size={18} color="#FFF" style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    margin: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  featuresList: {
    gap: 15,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
  },
  iconContainer: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 20,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  button: {
    backgroundColor: '#388E3C',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

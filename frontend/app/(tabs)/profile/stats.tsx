import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface GradeData {
  id: string;
  subject: string;
  grade: number;
  date: string;
  topics: string[];
}

export default function Stats() {
  const [grades, setGrades] = useState<GradeData[]>([]);
  const [averageBySubject, setAverageBySubject] = useState<{[key: string]: number}>({});
  const [monthlyAverages, setMonthlyAverages] = useState<{[key: string]: number}>({});

  useEffect(() => {
    loadGrades();
  }, []);

  const loadGrades = async () => {
    try {
      const gradeHistory = await AsyncStorage.getItem('gradeHistory');
      const parsedGrades = gradeHistory ? JSON.parse(gradeHistory) : [];
      if (Array.isArray(parsedGrades)) {
        setGrades(parsedGrades);
        calculateAverages(parsedGrades);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const calculateAverages = (gradeData: GradeData[]) => {
    const subjectTotals: {[key: string]: {sum: number; count: number}} = {};
    const monthlyData: {[key: string]: {sum: number; count: number}} = {};

    gradeData.forEach(({ subject, grade, date }) => {
      if (!subjectTotals[subject]) subjectTotals[subject] = { sum: 0, count: 0 };
      subjectTotals[subject].sum += grade;
      subjectTotals[subject].count++;

      const month = new Date(date).toLocaleString('tr-TR', { month: 'long' });
      if (!monthlyData[month]) monthlyData[month] = { sum: 0, count: 0 };
      monthlyData[month].sum += grade;
      monthlyData[month].count++;
    });

    setAverageBySubject(
      Object.fromEntries(Object.entries(subjectTotals).map(([subject, { sum, count }]) => [subject, sum / count]))
    );

    setMonthlyAverages(
      Object.fromEntries(Object.entries(monthlyData).map(([month, { sum, count }]) => [month, sum / count]))
    );
  };

  const chartConfig = {
    backgroundGradientFrom: '#4CAF50',
    backgroundGradientTo: '#2E7D32',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.header}>
        <Text style={styles.title}>Not Analizleri</Text>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    textAlign: 'center',
  },
});

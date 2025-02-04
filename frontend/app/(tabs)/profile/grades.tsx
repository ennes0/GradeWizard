import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLanguage } from '../../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const Grades = () => {
  const { t, language } = useLanguage();
  const [gradeHistory, setGradeHistory] = React.useState([]);
  const [stats, setStats] = React.useState({
    average: 0,
    highest: 0,
    lowest: 100,
    total: 0
  });

  useEffect(() => {
    loadGrades();
  }, [language]);

  const loadGrades = async () => {
    try {
      const grades = await AsyncStorage.getItem('gradeHistory');
      if (grades) {
        const parsedGrades = JSON.parse(grades);
        setGradeHistory(parsedGrades);
        calculateStats(parsedGrades);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const calculateStats = (grades) => {
    if (grades.length === 0) return;
    
    const gradeValues = grades.map(g => Number(g.grade));
    setStats({
      average: (gradeValues.reduce((a, b) => a + b, 0) / grades.length).toFixed(1),
      highest: Math.max(...gradeValues),
      lowest: Math.min(...gradeValues),
      total: grades.length
    });
  };

  const getGradeColor = (grade) => {
    if (grade >= 85) return ['#4CAF50', '#388E3C'];
    if (grade >= 70) return ['#8BC34A', '#689F38'];
    if (grade >= 60) return ['#FFC107', '#FFA000'];
    return ['#F44336', '#D32F2F'];
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <FontAwesome5 name="chart-line" size={20} color="#388E3C" />
          <Text style={styles.statValue}>{stats.average}</Text>
          <Text style={styles.statLabel}>{t('profile.average')}</Text>
        </View>
        <View style={styles.statBox}>
          <FontAwesome5 name="trophy" size={20} color="#388E3C" />
          <Text style={styles.statValue}>{stats.highest}</Text>
          <Text style={styles.statLabel}>{t('profile.highest')}</Text>
        </View>
        <View style={styles.statBox}>
          <FontAwesome5 name="chart-bar" size={20} color="#388E3C" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>{t('profile.totalExams')}</Text>
        </View>
      </View>
    </View>
  );

  const renderGradeItem = ({ item, index }) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 100)}
      style={styles.gradeCard}
    >
      <LinearGradient
        colors={getGradeColor(item.grade)}
        style={styles.gradeAccent}
      />
      <View style={styles.gradeContent}>
        <View style={styles.gradeHeader}>
          <Text style={styles.subject}>{item.subject}</Text>
          <View style={styles.gradeBox}>
            <Text style={styles.grade}>{item.grade}</Text>
          </View>
        </View>
        
        <Text style={styles.topics}>
          {item.topics?.join(" • ") || t('profile.noTopics')}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            <FontAwesome5 name="calendar-alt" size={12} color="#666" />
            <Text style={styles.date}>
              {new Date(item.date).toLocaleDateString(language, {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <View style={styles.titleBar}>
        <Text style={styles.title}>{t('profile.myGrades')}</Text>
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <FontAwesome5 name="times" size={24} color="#388E3C" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={gradeHistory}
        renderItem={renderGradeItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="clipboard" size={50} color="#388E3C" />
            <Text style={styles.emptyText}>{t('profile.noGrades')}</Text>
          </View>
        }
      />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  titleBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: Platform.OS === 'ios' ? 40 : 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  closeButton: {
    padding: 8,
  },
  header: {
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: width / 3.5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  list: {
    paddingBottom: 20,
  },
  gradeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  gradeAccent: {
    width: 6,
  },
  gradeContent: {
    flex: 1,
    padding: 16,
  },
  gradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subject: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  gradeBox: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  grade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  topics: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  date: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default Grades;

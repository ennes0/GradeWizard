import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, RefreshControl, Dimensions, Animated, Easing, Alert, Platform } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { getStudyStreak, markDayAsStudied, getCurrentStreak, type StudyDay } from '../../utils/studyStreak';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { APP_TEXT } from '../../constants/text';
const { width } = Dimensions.get('window');

const Home = () => {
  const [studyStreak, setStudyStreak] = useState<StudyDay[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentGrades, setRecentGrades] = useState([]);
  const [stats, setStats] = useState({
    studyDays: 0,
    averageGrade: 0,
    totalTests: 0
  });
  const [refreshing, setRefreshing] = useState(false);
  const [featuresKey, setFeaturesKey] = useState(0);
  const [animatedValues, setAnimatedValues] = useState<Animated.Value[]>([]);
  const [upcomingExams, setUpcomingExams] = useState([]);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const updateStreak = async () => {
      const streak = await getStudyStreak(); // This will now update dates automatically
      setStudyStreak(streak);
      setCurrentStreak(getCurrentStreak(streak));
    };

    updateStreak();
    loadRecentGrades();
    calculateStats();
    loadUpcomingExams();

    // Add interval to check date changes
    const interval = setInterval(updateStreak, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Initialize animation values when streak data changes
    const newAnimatedValues = studyStreak.map(() => new Animated.Value(0));
    setAnimatedValues(newAnimatedValues);

    // Animate streak days one by one
    newAnimatedValues.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: true,
          friction: 6,
        })
      ]).start();
    });
  }, [studyStreak]);

  const refreshContent = async () => {
    await loadStudyStreak();
    await loadRecentGrades();
    await calculateStats();
    await loadUpcomingExams();
  };

  const loadStudyStreak = async () => {
    const streak = await getStudyStreak();
    setStudyStreak(streak);
    setCurrentStreak(getCurrentStreak(streak));
  };

  const handleMarkToday = async () => {
    const hours = await new Promise((resolve) => {
      Alert.prompt(
        "Çalışma Süresi",
        "Bugün kaç saat çalıştın?",
        [
          {
            text: "İptal",
            onPress: () => resolve(null),
            style: "cancel"
          },
          {
            text: "Kaydet",
            onPress: hours => resolve(Number(hours))
          }
        ],
        "plain-text",
        "",
        "numeric"
      );
    });

    if (!hours) return;

    // Animate button press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start();

    const today = new Date().toISOString().split('T')[0];
    const alreadyMarked = studyStreak.find(
      day => day.date === today && day.completed
    );

    if (alreadyMarked) {
      Alert.alert('Bilgi', 'Bugün zaten çalıştığınızı işaretlemişsiniz!');
      return;
    }

    const updatedStreak = await markDayAsStudied(hours);
    setStudyStreak(updatedStreak);
    setCurrentStreak(getCurrentStreak(updatedStreak));
    calculateStats();
  };

  const getMaxStudyHours = () => {
    if (!studyStreak || studyStreak.length === 0) return 0;
    
    const maxHours = Math.max(
      ...studyStreak
        .filter(day => day.completed && day.studyHours)
        .map(day => day.studyHours || 0)
    );
    
    return isFinite(maxHours) ? maxHours : 0;
  };

  const loadRecentGrades = async () => {
    try {
      const grades = await AsyncStorage.getItem('gradeHistory');
      if (grades) {
        const parsedGrades = JSON.parse(grades);
        // Get only the last 3 grades
        setRecentGrades(parsedGrades.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading recent grades:', error);
    }
  };

  const calculateStats = async () => {
    try {
      // Get all grades
      const grades = await AsyncStorage.getItem('gradeHistory');
      const parsedGrades = grades ? JSON.parse(grades) : [];
      
      // Get study streak
      const streak = await AsyncStorage.getItem('study_streak');
      const studyDays = streak ? 
        JSON.parse(streak).filter(day => day.completed).length : 0;

      // Calculate average grade
      const totalGrade = parsedGrades.reduce((sum, grade) => 
        sum + parseFloat(grade.grade), 0);
      const averageGrade = parsedGrades.length > 0 ? 
        (totalGrade / parsedGrades.length).toFixed(1) : 0;

      setStats({
        studyDays,
        averageGrade,
        totalTests: parsedGrades.length
      });

    } catch (error) {
      console.error('Error calculating stats:', error);
    }
  };

  const loadUpcomingExams = async () => {
    try {
      const savedExams = await AsyncStorage.getItem('exams');
      if (savedExams) {
        const allExams = JSON.parse(savedExams);
        const sortedExams = allExams
          .filter(exam => new Date(exam.examDate) > new Date())
          .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
          .slice(0, 5); // Get only next 5 exams
        setUpcomingExams(sortedExams);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadStudyStreak(),
        loadRecentGrades(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
    setRefreshing(false);
  }, []);

  const features = [
    { 
      id: "1", 
      name: "Grade Prediction", 
      icon: "chart-line",
      route: "/(tabs)/GradePrediction",
      description: "AI-powered grade predictions",
      bgColor: ['#4CAF50', '#81C784'],
      subFeatures: [
        'AI predictions',
        'Topic analysis',
        'Personal insights'
      ]
    },
    { 
      id: "2", 
      name: "Study Plan", 
      icon: "calendar-alt",
      route: "/exams/exams",
      description: "Create personalized study plans",
      bgColor: ['#2196F3', '#64B5F6'],
      subFeatures: [
        'Daily schedule',
        'Smart reminders',
        'Goal tracking'
      ]
    },
    { 
      id: "3", 
      name: "Daily Quiz", 
      icon: "lightbulb",
      route: "/(tabs)/quiz",
      description: "Test your knowledge daily",
      bgColor: ['#9C27B0', '#BA68C8'],
      subFeatures: [
        'New questions daily',
        'Various categories',
        'Instant feedback'
      ]
    },
    { 
      id: "4", 
      name: "Exam Management", 
      icon: "tasks",
      route: "/exams/exams",
      description: "Manage all your exams in one place",
      bgColor: ['#FF9800', '#FFB74D'],
      subFeatures: [
        'Exam calendar',
        'Topic tracking',
        'Priority management'
      ]
    },
  ];

  const renderStreakDay = (day: StudyDay, index: number) => (
    <Animated.View 
      key={day.date}
      style={[
        styles.dayContainer,
        { 
          opacity: animatedValues[index] || new Animated.Value(1),
          transform: [{ 
            scale: (animatedValues[index] || new Animated.Value(1)).interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1]
            })
          }]
        }
      ]}
    >
      <Text style={styles.dayLabel}>
        {new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' })}
      </Text>
      <View style={[
        styles.streakDay,
        { backgroundColor: day.completed ? '#4CAF50' : '#C8E6C9' }
      ]} />
    </Animated.View>
  );

  const renderStreakSection = () => (
    <View style={styles.streakContainer}>
      <View style={styles.streakHeader}>
        <View style={styles.streakTitleContainer}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View>
            <Text style={styles.streakTitle}>
              {`Study Streak: ${currentStreak} days`}
            </Text>
            <Text style={styles.streakSubtitle}>
              {currentStreak > 0 
                ? "You're doing great, keep it up!"
                : 'Start studying to begin your streak!'}
            </Text>
          </View>
        </View>
        
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={styles.markTodayButton}
            onPress={handleMarkToday}
          >
            <FontAwesome5 name="check" size={16} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.markTodayText}>Today</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <View style={styles.streakInfo}>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatValue}>
            {studyStreak.filter(day => day.completed).length}
          </Text>
          <Text style={styles.streakStatLabel}>Total Days</Text>
        </View>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatValue}>
            {getMaxStudyHours()}h
          </Text>
          <Text style={styles.streakStatLabel}>Longest Study</Text>
        </View>
        <View style={styles.streakStat}>
          <Text style={styles.streakStatValue}>
            {studyStreak.filter(day => 
              new Date(day.date).getMonth() === new Date().getMonth() && day.completed
            ).length}
          </Text>
          <Text style={styles.streakStatLabel}>This Month</Text>
        </View>
      </View>

      <View style={styles.streakDays}>
        {studyStreak.map((day, index) => renderStreakDay(day, index))}
      </View>

      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9']}
        style={styles.streakMotivation}
      >
        <FontAwesome5 name="lightbulb" size={16} color="#388E3C" />
        <Text style={styles.motivationText}>
          {currentStreak > 5 
            ? 'Müthiş bir seri yakaladın! 🎯' 
            : 'Her gün çalışarak başarıya ulaş! 💪'}
        </Text>
      </LinearGradient>
    </View>
  );

  const renderExamCard = ({ item }) => {
    const daysUntilExam = Math.ceil(
      (new Date(item.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <TouchableOpacity
        style={styles.examCard}
        onPress={() => router.push('/exams/exams')}
      >
        <View style={[styles.examBadge, { backgroundColor: item.importance === 'high' ? '#ef476f' : 
          item.importance === 'medium' ? '#ffd166' : '#06d6a0' }]}>
          <Text style={styles.examBadgeText}>{daysUntilExam}</Text>
          <Text style={styles.examBadgeLabel}>GÜN</Text>
        </View>
        
        <View style={styles.examContent}>
          <Text style={styles.examSubject}>{item.subject}</Text>
          <Text style={styles.examDate}>
            {new Date(item.examDate).toLocaleDateString('tr-TR')}
          </Text>
          <View style={styles.examTopics}>
            {item.topics.map((topic, index) => (
              <Text key={index} style={styles.examTopic}>
                {topic}
              </Text>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FeatureCarousel = () => {
    const flatListRef = useRef(null);
    const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });
    const onViewRef = useRef(({ changed }) => {
      if (changed[0].isViewable) {
        const index = changed[0].index;
        // Optional: Update current index if needed
      }
    });

    const renderFeature = ({ item, index }) => {
      const inputRange = [
        (index - 1) * width,
        index * width,
        (index + 1) * width,
      ];

      const scale = scrollX.interpolate({
        inputRange,
        outputRange: [0.8, 1, 0.8],
      });

      const opacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.5, 1, 0.5],
      });

      return (
        <TouchableOpacity 
          style={styles.featureSlide}
          onPress={() => router.push(item.route)}
          activeOpacity={0.9}
        >
          <Animated.View style={[
            styles.featureContent,
            { transform: [{ scale }], opacity }
          ]}>
            <LinearGradient
              colors={item.bgColor}
              style={styles.gradientBg}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.featureHeader}>
                <FontAwesome5 name={item.icon} size={32} color="#FFF" />
                <Text style={styles.featureName}>{item.name}</Text>
              </View>
              
              <Text style={styles.featureDescription}>
                {item.description}
              </Text>

              <View style={styles.subFeaturesContainer}>
                {item.subFeatures.map((feature, idx) => (
                  <View key={idx} style={styles.subFeatureItem}>
                    <FontAwesome5 name="check-circle" size={14} color="#FFF" />
                    <Text style={styles.subFeatureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Başla</Text>
                <FontAwesome5 name="arrow-right" size={14} color="#FFF" />
              </View>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      );
    };

    const getItemLayout = (data, index) => ({
      length: width,
      offset: width * index,
      index,
    });

    const snapToAlignment = Platform.select({
      ios: 'center',
      android: 'start',
    });

    return (
      <View style={styles.carouselContainer}>
        <Animated.FlatList
          ref={flatListRef}
          horizontal
          data={features}
          renderItem={renderFeature}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          snapToInterval={width}
          snapToAlignment={snapToAlignment}
          decelerationRate="fast"
          viewabilityConfig={viewConfigRef.current}
          onViewableItemsChanged={onViewRef.current}
          getItemLayout={getItemLayout}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          contentContainerStyle={[
            styles.carousel,
            { paddingHorizontal: 0 } // Remove horizontal padding
          ]}
        />
        
        <View style={styles.pagination}>
          {features.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            const scaleX = scrollX.interpolate({
              inputRange,
              outputRange: [1, 2.5, 1],
              extrapolate: 'clamp',
            });

            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });

            return (
              <Animated.View
                key={i}
                style={[
                  styles.dot,
                  { 
                    opacity,
                    transform: [{ scaleX }]
                  }
                ]}
              />
            );
          })}
        </View>
      </View>
    );
  };

  const renderStats = () => (
    <View style={styles.statsSection}>
      <Text style={styles.sectionTitleLarge}>Overview</Text>
      <LinearGradient
        colors={['#E8F5E9', '#C8E6C9']}
        style={styles.statsContainer}
      >
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <FontAwesome5 name="calendar-check" size={20} color="#388E3C" />
          </View>
          <Text style={styles.statValue}>{stats.studyDays}</Text>
          <Text style={styles.statLabel}>Study Days</Text>
        </View>

        <View style={[styles.statCard, styles.middleCard]}>
          <View style={[styles.statIconContainer, { backgroundColor: '#E3F2FD' }]}>
            <FontAwesome5 name="chart-line" size={20} color="#1976D2" />
          </View>
          <Text style={[styles.statValue, { color: '#1976D2' }]}>{stats.averageGrade}%</Text>
          <Text style={styles.statLabel}>Average</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconContainer, { backgroundColor: '#F3E5F5' }]}>
            <FontAwesome5 name="edit" size={20} color="#9C27B0" />
          </View>
          <Text style={[styles.statValue, { color: '#9C27B0' }]}>{stats.totalTests}</Text>
          <Text style={styles.statLabel}>Total Exams</Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderActivities = () => (
    <View style={styles.activitiesSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitleLarge}>Recent Activities</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/profile/grades')}
        >
          <Text style={styles.viewAllText}>View All</Text>
          <FontAwesome5 name="chevron-right" size={12} color="#388E3C" />
        </TouchableOpacity>
      </View>

      {recentGrades.length > 0 ? (
        <View style={styles.activitiesList}>
          {recentGrades.map((activity) => (
            <LinearGradient
              key={activity.id}
              colors={['#FFFFFF', '#F5F5F5']}
              style={styles.activityCard}
            >
              <View style={styles.activityLeft}>
                <View style={[
                  styles.gradeBadge,
                  { backgroundColor: activity.grade >= 70 ? '#4CAF50' : 
                    activity.grade >= 50 ? '#FFC107' : '#F44336' }
                ]}>
                  <Text style={styles.gradeText}>
                    {Math.round(activity.grade)}
                  </Text>
                </View>
                <View style={styles.activityInfo}>
                  <Text style={styles.activitySubject}>{activity.subject}</Text>
                  <Text style={styles.activityDate}>
                    {new Date(activity.date).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long'
                    })}
                  </Text>
                </View>
              </View>
              <View style={styles.topicsContainer}>
                {activity.topics?.map((topic, index) => (
                  <View key={index} style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>
          ))}
        </View>
      ) : (
        <View style={styles.emptyStateContainer}>
          <FontAwesome5 name="clipboard" size={40} color="#C8E6C9" />
          <Text style={styles.emptyText}>No grades recorded yet</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setFeaturesKey(prev => prev + 1);
            onRefresh();
          }}
          colors={["#388E3C"]}
          tintColor="#388E3C"
          title="Refreshing..."
          titleColor="#388E3C"
        />
      }
    >
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>Continue your success journey</Text>

      {upcomingExams.length > 0 && (
        <View style={styles.examSection}>
          <Text style={styles.sectionTitle}>Upcoming Exams</Text>
          <FlatList
            horizontal
            data={upcomingExams}
            renderItem={renderExamCard}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examList}
          />
        </View>
      )}

      <FeatureCarousel />

      {renderStats()}
      {renderActivities()}

      {renderStreakSection()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    marginBottom: 20,
  },
  grid: {
    justifyContent: "space-between",
  },
  card: {
    flex: 1,
    backgroundColor: "#C8E6C9",
    padding: 20,
    margin: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#388E3C",
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    padding: 10,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  recentContainer: {
    marginTop: 20,
    padding: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityInfo: {
    flex: 1,
  },
  activitySubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityTopics: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  gradeContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  gradeLabel: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  activityGrade: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginTop: 10,
    fontStyle: 'italic',
  },
  streakContainer: {
    margin: 10,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  streakHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  streakTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakEmoji: {
    fontSize: 24,
    marginRight: 8,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  markTodayButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markTodayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonIcon: {
    marginRight: 6,
  },
  dayContainer: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  streakDay: {
    width: 30,
    height: 30,
    borderRadius: 15,
    margin: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  carouselContainer: {
    height: 280,
    marginTop: 20,
  },
  featureSlide: {
    width: width,
    paddingHorizontal: 20,
  },
  featureContent: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradientBg: {
    padding: 20,
    height: 240,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  featureName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  featureDescription: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginBottom: 20,
  },
  subFeaturesContainer: {
    gap: 8,
    marginBottom: 20,
  },
  subFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subFeatureText: {
    color: '#FFF',
    fontSize: 14,
    opacity: 0.9,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  dot: {
    height: 8,
    width: 8, // Base width
    borderRadius: 4,
    backgroundColor: '#388E3C',
    marginHorizontal: 4,
  },
  examSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  examList: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  examCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    width: 280,
    marginRight: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examBadge: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  examBadgeText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  examBadgeLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  examContent: {
    flex: 1,
    padding: 15,
  },
  examSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  examDate: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  examTopics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  examTopic: {
    fontSize: 12,
    color: '#34495E',
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  streakInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 15,
  },
  streakStat: {
    alignItems: 'center',
  },
  streakStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  streakStatLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  streakMotivation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  motivationText: {
    fontSize: 14,
    color: '#388E3C',
    fontWeight: '500',
  },
  statsSection: {
    marginVertical: 20,
  },
  sectionTitleLarge: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  middleCard: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 15,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activitiesSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: '#388E3C',
    fontSize: 14,
    fontWeight: '600',
  },
  activitiesList: {
    gap: 12,
  },
  activityCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'column',
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gradeBadge: {
    width: 48, // Increased from 45
    height: 48, // Increased from 45
    borderRadius: 24, // Half of width/height
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  gradeText: {
    color: '#FFF',
    fontSize: 16, // Decreased from 18
    fontWeight: 'bold',
    textAlign: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activitySubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  topicText: {
    fontSize: 12,
    color: '#666',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    backgroundColor: '#FFF',
    borderRadius: 12,
    elevation: 2,
  },
  emptyText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default Home;
import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Grade Prediction',
    description: 'Enter your topics and study status, our AI-powered system will predict your potential grade.',
    subpoints: [
      'Topic-specific predictions',
      'Personalized recommendations',
      'Progress tracking'
    ],
    icon: 'chart-line',
    gradientColors: ['#4CAF50', '#81C784']
  },
  {
    id: '2',
    title: 'Study Plan',
    description: 'Create a custom study plan for each exam and progress step by step towards your goals.',
    subpoints: [
      'Weekly study program',
      'Topic-based planning',
      'Smart time management'
    ],
    icon: 'calendar-check',
    gradientColors: ['#2196F3', '#64B5F6']
  },
  {
    id: '3',
    title: 'Study Tracking',
    description: 'Track your daily study routine and keep your motivation high.',
    subpoints: [
      'Daily study duration',
      'Success statistics',
      'Motivation notifications'
    ],
    icon: 'tasks',
    gradientColors: ['#9C27B0', '#BA68C8']
  },
  {
    id: '4',
    title: 'Success Analysis',
    description: 'Analyze your performance and discover areas for improvement.',
    subpoints: [
      'Detailed performance graphs',
      'Development suggestions',
      'Success comparisons'
    ],
    icon: 'graduation-cap',
    gradientColors: ['#FF9800', '#FFB74D']
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0); // Start from first slide
  const slideRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animatedValue = useRef(new Animated.Value(0)).current;

  const handleOnboardingComplete = async () => {
    try {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40
      }).start(async () => {
        await AsyncStorage.setItem('hasSeenOnboarding', 'true');
        router.replace('/user-setup');
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8]
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.5, 1, 0.5]
    });

    return (
      <Animated.View style={[styles.slide, { transform: [{ scale }], opacity }]}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.iconContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <FontAwesome5 name={item.icon} size={60} color="#FFF" />
        </LinearGradient>
        
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        <View style={styles.subpointsContainer}>
          {item.subpoints.map((point, idx) => (
            <Animated.View 
              key={idx} 
              style={[styles.subpointRow, {
                transform: [{
                  translateX: scrollX.interpolate({
                    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                    outputRange: [50, 0, -50]
                  })
                }],
                opacity: scrollX.interpolate({
                  inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                  outputRange: [0, 1, 0]
                })
              }]}
            >
              <FontAwesome5 name="check-circle" size={16} color={item.gradientColors[0]} />
              <Text style={styles.subpointText}>{point}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const Pagination = () => (
    <View style={styles.paginationContainer}>
      {slides.map((_, index) => {
        const width = scrollX.interpolate({
          inputRange: [
            (index - 1) * Dimensions.get('window').width,
            index * Dimensions.get('window').width,
            (index + 1) * Dimensions.get('window').width,
          ],
          outputRange: [8, 16, 8],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange: [
            (index - 1) * Dimensions.get('window').width,
            index * Dimensions.get('window').width,
            (index + 1) * Dimensions.get('window').width,
          ],
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width,
                opacity,
                backgroundColor: slides[currentIndex].gradientColors[0]
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={slideRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      <Pagination />
      <View style={styles.buttonContainer}>
        {currentIndex === slides.length - 1 ? (
          <TouchableOpacity style={styles.button} onPress={handleOnboardingComplete}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              slideRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
              });
            }}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  slide: {
    width,
    height,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
    marginBottom: 30,
  },
  subpointsContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: 40,
    width: '100%',
  },
  subpointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  subpointText: {
    fontSize: 16,
    color: '#4A5568',
    marginLeft: 12,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
    width: '100%',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: width * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  languageContainer: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    padding: 20,
    justifyContent: 'center',
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

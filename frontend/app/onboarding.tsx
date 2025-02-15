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
    icon: 'brain',
    gradientColors: ['#4CAF50', '#81C784'],
    illustration: '🎯'
  },
  {
    id: '2',
    title: 'Smart Study Plan',
    description: 'Create a custom study plan for each exam and progress step by step towards your goals.',
    subpoints: [
      'Weekly study program',
      'Topic-based planning',
      'Smart time management'
    ],
    icon: 'calendar-check',
    gradientColors: ['#2196F3', '#64B5F6'],
    illustration: '📚'
  },
  {
    id: '3',
    title: 'Daily Progress',
    description: 'Track your daily study routine and keep your motivation high with personalized insights.',
    subpoints: [
      'Daily study tracking',
      'Success statistics',
      'Motivation boosters'
    ],
    icon: 'chart-line',
    gradientColors: ['#9C27B0', '#BA68C8'],
    illustration: '📈'
  },
  {
    id: '4',
    title: 'Get Started!',
    description: 'Ready to improve your academic performance? Let\'s begin your success journey!',
    subpoints: [
      'Personalized experience',
      'Daily motivation',
      'Track your growth'
    ],
    icon: 'graduation-cap',
    gradientColors: ['#FF9800', '#FFB74D'],
    illustration: '🎓'
  }
];

export default function Onboarding() {
  const [currentIndex, setCurrentIndex] = useState(0); // Start from first slide
  const slideRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const animatedValue = useRef(new Animated.Value(0)).current;

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem("hasSeenOnboarding", "true");
      // User setup ekranına yönlendir
      router.replace("/user-setup");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
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

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [50, 0, 50]
    });

    return (
      <Animated.View style={[styles.slide, { 
        transform: [{ scale }, { translateY }],
        opacity 
      }]}>
        <LinearGradient
          colors={item.gradientColors}
          style={styles.contentContainer}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Illustration & Icon Container */}
          <Animated.View style={[styles.illustrationContainer, {
            transform: [{
              rotate: scrollX.interpolate({
                inputRange,
                outputRange: ['-15deg', '0deg', '15deg']
              })
            }]
          }]}>
            <Text style={styles.illustration}>{item.illustration}</Text>
            <View style={styles.iconOverlay}>
              <FontAwesome5 name={item.icon} size={32} color="#FFF" />
            </View>
          </Animated.View>
          
          {/* Content */}
          <Animated.Text style={[styles.title, {
            transform: [{
              translateX: scrollX.interpolate({
                inputRange,
                outputRange: [-50, 0, 50]
              })
            }]
          }]}>
            {item.title}
          </Animated.Text>
          
          <Text style={styles.description}>{item.description}</Text>
          
          {/* Features List */}
          <View style={styles.featuresList}>
            {item.subpoints.map((point, idx) => (
              <Animated.View 
                key={idx}
                style={[styles.featureItem, {
                  transform: [{
                    translateX: scrollX.interpolate({
                      inputRange,
                      outputRange: [100, 0, -100]
                    })
                  }],
                  opacity: scrollX.interpolate({
                    inputRange,
                    outputRange: [0, 1, 0]
                  })
                }]}
              >
                <View style={styles.featureIcon}>
                  <FontAwesome5 name="check" size={12} color="#FFF" />
                </View>
                <Text style={styles.featureText}>{point}</Text>
              </Animated.View>
            ))}
          </View>
        </LinearGradient>
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
      
      {/* Bottom Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity 
          style={[styles.navButton, styles.skipButton]}
          onPress={() => finishOnboarding()}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton]}
          onPress={() => {
            if (currentIndex === slides.length - 1) {
              finishOnboarding();
            } else {
              slideRef.current?.scrollToIndex({
                index: currentIndex + 1,
                animated: true
              });
            }
          }}
        >
          <LinearGradient
            colors={slides[currentIndex].gradientColors}
            style={styles.nextButtonGradient}
          >
            <Text style={styles.nextButtonText}>
              {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <FontAwesome5 
              name={currentIndex === slides.length - 1 ? 'rocket' : 'arrow-right'} 
              size={16} 
              color="#FFF" 
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
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
  contentContainer: {
    width: width * 0.9,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  illustrationContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  illustration: {
    fontSize: 80,
    marginBottom: -20,
  },
  iconOverlay: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 16,
    borderRadius: 20,
    marginTop: 16,
  },
  featuresList: {
    width: '100%',
    marginTop: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  featureIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#FFF',
    fontSize: 16,
    flex: 1,
  },
  navigation: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    minWidth: 120,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

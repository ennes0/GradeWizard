import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Animated, Alert, ActivityIndicator, ScrollView 
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons'; // FontAwesome5 yerine FontAwesome kullan
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Notifications from 'expo-notifications';
import { quizApi } from '../../services/api';
import { BannerAd, BannerAdSize, InterstitialAd, AdEventType } from 'react-native-google-mobile-ads';
import AdService from '../../services/AdService';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
}

// Dil seçenekleri için interface
interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export default function Quiz() {
  const [quizzes, setQuizzes] = useState<QuizQuestion[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [canPlay, setCanPlay] = useState(true);
  const [loading, setLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const [quizCompleted, setQuizCompleted] = useState(false); // Add this state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [showLanguageSelect, setShowLanguageSelect] = useState(true);

  useEffect(() => {
    checkDailyQuiz();
    loadQuizStats();
  }, []);

  // Debug için useEffect ekleyelim
  useEffect(() => {
    console.log('Quizzes state:', quizzes);
    console.log('Current quiz index:', currentQuizIndex);
  }, [quizzes, currentQuizIndex]);

  const loadQuizStats = async () => {
    try {
      const quizStats = await AsyncStorage.getItem('quizStats');
      if (quizStats) {
        const parsed = JSON.parse(quizStats);
        setScore(parsed.totalScore || 0);
        setStreak(parsed.streak || 0);
      }
    } catch (error) {
      console.error('Error loading quiz stats:', error);
    }
  };

  const checkDailyQuiz = async () => {
    try {
      const lastPlayed = await AsyncStorage.getItem('lastQuizDate');
      const today = new Date().toDateString();
      if (lastPlayed === today) {
        setCanPlay(false);
      }
    } catch (error) {
      console.error('Error checking quiz date:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizQuestion = async () => {
    try {
      const response = await axios.get('https://gradewizard-1.onrender.com/generate_quiz');
      console.log('Quiz API Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  };

  const startQuiz = async () => {
    try {
      setLoading(true);
      const newQuizzes = [];

      for (let i = 0; i < 5; i++) {
        try {
          // Dil parametresini API çağrısına ekle
          const quizData = await quizApi.fetchQuizQuestion(selectedLanguage);
          newQuizzes.push({
            question: quizData.question,
            options: quizData.options,
            correctAnswer: quizData.correctAnswer
          });
        } catch (error) {
          console.error(`Error fetching question ${i + 1}:`, error);
          throw error;
        }
      }

      console.log('Final quizzes array:', newQuizzes); // Debug log

      if (newQuizzes.length === 5) {
        setQuizzes(newQuizzes);
        setCurrentQuizIndex(0);
        animateQuestion();
      } else {
        throw new Error('Not enough questions loaded');
      }

    } catch (error) {
      console.error('Quiz loading error:', error);
      Alert.alert('Error', 'Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const animateQuestion = () => {
    fadeAnim.setValue(0);
    Animated.spring(fadeAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  };

  const showFeedback = (correct: boolean) => {
    setIsCorrect(correct);
    setFeedbackVisible(true);
    feedbackAnim.setValue(0);
    
    Animated.sequence([
      Animated.spring(feedbackAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8
      }),
      Animated.delay(1500),
      Animated.spring(feedbackAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8
      })
    ]).start(() => {
      setFeedbackVisible(false);
      if (currentQuizIndex < quizzes.length - 1) {
        setCurrentQuizIndex(prev => prev + 1);
        animateQuestion();
      } else {
        handleQuizComplete();
      }
    });
  };

  const handleAnswer = async (selectedAnswer: string) => {
    const currentQuiz = quizzes[currentQuizIndex];
    const isCorrect = selectedAnswer === currentQuiz.correctAnswer;
    
    setUserAnswers(prev => ({
      ...prev,
      [currentQuizIndex]: selectedAnswer
    }));

    // Seçilen şıkkın animasyonu
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();

    showFeedback(isCorrect);
  };

  const handleQuizComplete = async () => {
    try {
      setLoading(true);
      const correctCount = Object.entries(userAnswers).filter(
        ([idx, answer]) => answer === quizzes[parseInt(idx)].correctAnswer
      ).length;

      // Interstitial reklam göster
      const interstitial = InterstitialAd.createForAdRequest(
        AdService.getAdUnitId('interstitial'),
        {
          requestNonPersonalizedAdsOnly: true,
          keywords: ['education', 'quiz', 'learning'],
        }
      );

      interstitial.addAdEventListener(AdEventType.LOADED, () => {
        interstitial.show();
      });

      interstitial.load();

      // Quiz istatistiklerini kaydet
      await AsyncStorage.setItem('lastQuizDate', new Date().toDateString());
      await AsyncStorage.setItem('quizStats', JSON.stringify({
        totalScore: score + (correctCount * 10),
        streak: streak + (correctCount >= 3 ? 1 : 0)
      }));

      setQuizCompleted(true);
      setCanPlay(false);
      
    } catch (error) {
      console.error('Quiz completion error:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleNextQuizNotification = async () => {
    try {
      // Yarın aynı saatte bildirim gönder
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0); // Sabah 10'da bildirim

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New Quiz Available! 🎯",
          body: "Your daily quiz is ready. Are you ready to test your knowledge?",
          data: { type: 'quiz' },
        },
        trigger: {
          date: tomorrow,
        },
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  const renderCurrentQuestion = () => {
    const currentQuiz = quizzes[currentQuizIndex];
    console.log('Rendering current question:', currentQuiz);

    if (!currentQuiz) {
      console.log('No current quiz available');
      return null;
    }

    return (
      <View style={styles.mainContainer}>
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { 
            width: `${((currentQuizIndex + 1) / 5) * 100}%` 
          }]} />
        </View>

        {/* Question Counter */}
        <Text style={styles.questionCount}>
          Question {currentQuizIndex + 1}/5
        </Text>

        {/* Question Banner */}
        <View style={styles.questionBannerContainer}>
          <BannerAd
            unitId={AdService.getAdUnitId('banner')}
            size={BannerAdSize.BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
              keywords: ['education', 'quiz', 'learning'],
            }}
          />
        </View>

        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{currentQuiz.question}</Text>
          
          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuiz.options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.optionButton}
                onPress={() => handleAnswer(option)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#FFFFFF', '#F5F5F5']}
                  style={styles.optionGradient}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + index)}
                    </Text>
                    <Text style={styles.optionText}>{option}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Feedback komponenti güncellemesi
  const FeedbackOverlay = () => {
    const currentQuiz = quizzes[currentQuizIndex];
    
    return (
      <Animated.View style={[
        styles.feedbackOverlay,
        {
          opacity: feedbackAnim,
          transform: [{
            scale: feedbackAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.3, 1]
            })
          }]
        }
      ]}>
        <LinearGradient
          colors={isCorrect ? ['#4CAF50', '#388E3C'] : ['#F44336', '#D32F2F']}
          style={styles.feedbackCard}
        >
          {/* Icon ve Ana Metin */}
          <View style={styles.feedbackHeader}>
            <FontAwesome
              name={isCorrect ? "check-circle" : "times-circle"}
              size={50}
              color="#FFF"
            />
            <Text style={styles.feedbackTitle}>
              {isCorrect ? 'Correct!' : 'Incorrect!'}
            </Text>
          </View>

          {/* Açıklama Bölümü */}
          {!isCorrect && (
            <View style={styles.explanationContainer}>
              <Text style={styles.explanationLabel}>Correct Answer:</Text>
              <Text style={styles.correctAnswerText}>
                {currentQuiz.correctAnswer}
              </Text>
            </View>
          )}

          {/* Devam Butonu */}
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={() => {
              setFeedbackVisible(false);
              if (currentQuizIndex < quizzes.length - 1) {
                setCurrentQuizIndex(prev => prev + 1);
                animateQuestion();
              } else {
                handleQuizComplete();
              }
            }}
          >
            <Text style={styles.nextButtonText}>
              {currentQuizIndex < quizzes.length - 1 ? 'Next Question' : 'Complete Quiz'}
            </Text>
            <FontAwesome name="arrow-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Welcome screen render function
  const renderWelcomeScreen = () => (
    <View style={styles.welcomeContainer}>
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.welcomeCard}
      >
        <View style={styles.iconContainer}>
          <FontAwesome name="lightbulb" size={40} color="#FFF" />
        </View>
        
        <Text style={styles.welcomeTitle}>Daily Quiz</Text>
        <Text style={styles.welcomeDescription}>
          Test your knowledge with new questions every day and earn points!
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <FontAwesome name="star" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Total Points</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome name="fire" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <FontAwesome name="check-circle" size={16} color="#FFF" />
            <Text style={styles.infoText}>5 different questions</Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="clock-o" size={16} color="#FFF" />
            <Text style={styles.infoText}>Refreshes daily</Text>
          </View>
          <View style={styles.infoItem}>
            <FontAwesome name="trophy" size={16} color="#FFF" />
            <Text style={styles.infoText}>+10 points per correct answer</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={startQuiz}
          disabled={loading}
        >
          <LinearGradient
            colors={['#66BB6A', '#43A047']}
            style={styles.buttonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.startButtonText}>START</Text>
                <FontAwesome name="arrow-right" size={20} color="#FFF" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderCompletionScreen = () => (
    <View style={styles.completedContainer}>
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.completionCard}
      >
        <View style={styles.trophyContainer}>
          <FontAwesome name="trophy" size={60} color="#FFD700" />
          <View style={styles.confetti}>
            {/* Add confetti animation elements */}
          </View>
        </View>
        
        <Text style={styles.completedTitle}>
          Quiz Complete!
        </Text>
        
        <View style={styles.resultSummary}>
          <View style={styles.resultItem}>
            <FontAwesome name="check-circle" size={24} color="#81C784" />
            <Text style={styles.resultLabel}>Correct Answers</Text>
            <Text style={styles.resultValue}>
              {Object.entries(userAnswers).filter(
                ([idx, answer]) => answer === quizzes[parseInt(idx)].correctAnswer
              ).length}/5
            </Text>
          </View>
          
          <View style={styles.resultItem}>
            <FontAwesome name="star" size={24} color="#FFD700" />
            <Text style={styles.resultLabel}>Points Earned</Text>
            <Text style={styles.resultValue}>
              +{Object.entries(userAnswers).filter(
                ([idx, answer]) => answer === quizzes[parseInt(idx)].correctAnswer
              ).length * 10}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome name="fire" size={24} color="#FF9800" />
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome name="trophy" size={24} color="#FFD700" />
            <Text style={styles.statValue}>{score}</Text>
            <Text style={styles.statLabel}>Total Score</Text>
          </View>
        </View>

        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={styles.nextQuizContainer}
        >
          <FontAwesome name="clock-o" size={20} color="#FFF" />
          <Text style={styles.nextQuizText}>
            Next quiz available tomorrow at 10:00 AM
          </Text>
        </LinearGradient>

        {/* Alt banner reklam */}
      </LinearGradient>
    </View>
  );

  // Dil seçim ekranı
  const renderLanguageSelect = () => (
    <View style={styles.languageSelectContainer}>
      <LinearGradient
        colors={['#4CAF50', '#388E3C']}
        style={styles.languageCard}
      >
        <View style={styles.languageHeader}>
          <FontAwesome name="language" size={40} color="#FFF" />
          <Text style={styles.languageTitle}>Select Quiz Language</Text>
          <Text style={styles.languageSubtitle}>Choose your preferred language</Text>
        </View>

        <View style={styles.languageGrid}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageOption,
                selectedLanguage === lang.code && styles.languageOptionSelected
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={[
                styles.languageName,
                selectedLanguage === lang.code && styles.languageNameSelected
              ]}>
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            setShowLanguageSelect(false);
            startQuiz();
          }}
        >
          <LinearGradient
            colors={['#66BB6A', '#43A047']}
            style={styles.buttonGradient}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
            <FontAwesome name="arrow-right" size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  // Ana render fonksiyonunda koşulları debug edelim
  return (
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      {/* Üst banner reklam */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={AdService.getAdUnitId('banner')}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
            keywords: ['education', 'quiz', 'learning'],
          }}
        />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContainer, { marginTop: 50 }]} // Banner için margin eklendi
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#388E3C" />
            <Text style={styles.loadingText}>Loading quiz...</Text>
          </View>
        ) : !canPlay ? (
          renderCompletionScreen()
        ) : showLanguageSelect ? (
          renderLanguageSelect()
        ) : quizzes.length === 0 ? (
          renderWelcomeScreen()
        ) : (
          renderCurrentQuestion()
        )}
      </ScrollView>

      {feedbackVisible && <FeedbackOverlay />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '40%',
    elevation: 3,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  welcomeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#388E3C',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quizContainer: {
    flex: 1,
    padding: 20,
  },
  questionText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 28,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  completedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 20,
    marginVertical: 20,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    overflow: 'hidden',
    padding: 15,
  },
  optionLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
    width: 25,
    width: 30,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#388E3C',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionButtonNew: {
    backgroundColor: '#FFF',
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  progressIndicator: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    height: 6,
    borderRadius: 3,
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#388E3C',
    borderRadius: 2,
    borderRadius: 3,
  },
  questionCount: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  optionLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#388E3C',
    width: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingVertical: 20,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  retryButton: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackOverlay: {
    position: 'absolute',
    top: '50%',
    left: '5%',
    right: '5%',
    transform: [{ translateY: -150 }],
    zIndex: 1000,
  },
  feedbackCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  feedbackHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 12,
  },
  explanationContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 20,
  },
  explanationLabel: {
    color: '#FFF',
    opacity: 0.9,
    fontSize: 14,
    marginBottom: 4,
  },
  correctAnswerText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#FFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 24,
    lineHeight: 22,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  infoContainer: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    color: '#FFF',
    fontSize: 16,
    opacity: 0.9,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  startButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  startButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  completedStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 30,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 15,
    elevation: 2,
  },
  completionCard: {
    width: '100%',
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultSummary: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 24,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  resultLabel: {
    flex: 1,
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  nextQuizContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  nextQuizText: {
    fontSize: 14,
    color: '#FFF',
    opacity: 0.9,
  },
  languageSelectContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  languageCard: {
    borderRadius: 20,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  languageHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  languageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 16,
  },
  languageSubtitle: {
    fontSize: 16,
    color: '#FFF',
    opacity: 0.9,
    marginTop: 8,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 30,
  },
  languageOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '45%',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    borderColor: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  languageFlag: {
    fontSize: 32,
    marginBottom: 8,
  },
  languageName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  languageNameSelected: {
    fontWeight: 'bold',
  },
  continueButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bannerContainer: {
    position: 'absolute',
    top: 0, // bottom yerine top
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  questionBannerContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: 'transparent',
  },
});

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Modal, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const params = useLocalSearchParams();
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // State ve animasyon değerlerini tanımla
  const [displayedGrade, setDisplayedGrade] = useState(0);
  const scoreAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;

  useEffect(() => {
    console.log("Result Screen Params:", params);
    const numericGrade = parseFloat(params.grade as string);
    console.log("Parsed Grade:", numericGrade);

    if (!isNaN(numericGrade)) {
      // Animasyonları başlat
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(scoreAnim, {
          toValue: numericGrade,
          duration: 1500,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [params.grade]);

  // Score animasyonu için listener
  useEffect(() => {
    const listener = scoreAnim.addListener(({ value }) => {
      setDisplayedGrade(value);
    });

    return () => scoreAnim.removeListener(listener);
  }, []);

  const getPredictionEmoji = (score) => {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🌟';
    if (score >= 70) return '📈';
    if (score >= 60) return '💪';
    return '📚';
  };

  const getMessage = (score) => {
    if (score >= 90) return { title: 'Excellent!', desc: 'Success is inevitable with this study pace!' };
    if (score >= 80) return { title: 'Great!', desc: "You're very close to success!" };
    if (score >= 70) return { title: 'Good!', desc: "You're on the right track, keep pushing!" };
    if (score >= 60) return { title: 'Getting Better!', desc: 'You have potential, need more practice.' };
    return { title: 'Starting Point', desc: 'Regular study will improve this!' };
  };

  const handleReset = () => {
    // Navigate back to GradePrediction with reset flag
    router.push({
      pathname: '/(tabs)/GradePrediction',
      params: { reset: true }
    });
  };

  const getFeedback = async () => {
    setLoadingFeedback(true);
    try {
      const response = await axios.post('https://gradewizard.onrender.com/generate_feedback', {
        grade: Number(params.grade),
        studyHours: Number(params.studyHours),
        motivation: Number(params.motivation),
        subjects: params.subjects?.split(',') || []
      });
      
      setFeedback(response.data.feedback);
      setShowFeedback(true);
    } catch (error) {
      console.error('Error getting feedback:', error);
      Alert.alert('Hata', 'Geri bildirim alınamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoadingFeedback(false);
    }
  };

  const FeedbackModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFeedback}
      onRequestClose={() => setShowFeedback(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.feedbackModal}>
          <ScrollView>
            <Text style={styles.feedbackTitle}>Detailed Analysis</Text>
            <Text style={styles.feedbackText}>{feedback}</Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowFeedback(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderScore = () => (
    <View style={styles.scoreContainer}>
      <Text style={styles.score}>
        {displayedGrade.toFixed(2)}
      </Text>
      <Text style={styles.scoreLabel}>/100</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#E8F5E9', '#C8E6C9']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.emojiContainer}>
          <Text style={styles.emoji}>
            {getPredictionEmoji(displayedGrade)}
          </Text>
        </View>

        {renderScore()}

        <Animated.View
          style={[
            styles.messageContainer,
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <Text style={styles.messageTitle}>
            {getMessage(displayedGrade).title}
          </Text>
          <Text style={styles.messageDesc}>
            {getMessage(displayedGrade).desc}
          </Text>
        </Animated.View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <FontAwesome5 name="clock" size={24} color="#388E3C" />
            <Text style={styles.statValue}>{Number(params.studyHours)}</Text>
            <Text style={styles.statLabel}>Study Hours</Text>
          </View>
          
          <View style={styles.statCard}>
            <FontAwesome5 name="star" size={24} color="#388E3C" />
            <Text style={styles.statValue}>{Number(params.motivation)}/10</Text>
            <Text style={styles.statLabel}>Motivation</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.button}
          onPress={handleReset}
        >
          <FontAwesome5 name="redo" size={16} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.feedbackButton}
          onPress={getFeedback}
          disabled={loadingFeedback}
        >
          {loadingFeedback ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <FontAwesome5 name="comment-dots" size={20} color="#FFF" />
              <Text style={styles.feedbackButtonText}>Get Detailed Analysis</Text>
            </>
          )}
        </TouchableOpacity>

        <FeedbackModal />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '90%',
    alignItems: 'center',
  },
  emojiContainer: {
    marginBottom: 20,
  },
  emoji: {
    fontSize: 80,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  score: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#388E3C',
    includeFontPadding: false,
    textAlignVertical: 'bottom',
  },
  scoreLabel: {
    fontSize: 24,
    color: '#666',
    marginLeft: 8,
    includeFontPadding: false,
    textAlignVertical: 'bottom',
  },
  messageContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 10,
  },
  messageDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  feedbackButton: {
    backgroundColor: '#9C27B0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 15,
    marginTop: 15,
    elevation: 3,
  },
  feedbackButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  feedbackModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    elevation: 5,
  },
  feedbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 15,
    textAlign: 'center',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: '#388E3C',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

import React, { useState, useRef, useEffect } from "react";
import { 
  View, Text, TextInput, StyleSheet, Alert, 
  ActivityIndicator, ScrollView, TouchableOpacity, Animated, Modal, Dimensions, Easing 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { ProgressBar, Card } from "react-native-paper";
import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';  // Add this import at the top

const { width } = Dimensions.get('window');

const GradePrediction = () => {
  const params = useLocalSearchParams();
  const [formData, setFormData] = useState({
    subject: "",
    topic1: "",
    topic2: "",
    topic3: "",
    previousGrade: "",
    motivation: "",
    studyHours: "",
  });

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [errors, setErrors] = useState({
    subject: '',
    topic1: '',
    topic2: '',
    topic3: '',
    previousGrade: '',
    motivation: '',
    studyHours: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputAnims = useRef([
    new Animated.Value(width),
    new Animated.Value(width),
    new Animated.Value(width),
    new Animated.Value(width),
    new Animated.Value(width),
    new Animated.Value(width),
    new Animated.Value(width),
  ]).current;

  const buttonAnim = useRef(new Animated.Value(0)).current;

  // Add new animation values
  const questionSlideAnim = useRef(new Animated.Value(width)).current;
  const questionFadeAnim = useRef(new Animated.Value(0)).current;
  const optionsAnim = useRef([
    new Animated.Value(50),
    new Animated.Value(50),
    new Animated.Value(50),
  ]).current;
  const optionsOpacity = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [currentQuestionIndex]);

  useEffect(() => {
    // Reset the form if coming back from result screen
    if (params.reset) {
      setFormData({
        subject: "",
        topic1: "",
        topic2: "",
        topic3: "",
        previousGrade: "",
        motivation: "",
        studyHours: "",
      });
      setQuestions([]);
      setAnswers([]);
      setCurrentQuestionIndex(0);
      setPrediction(null);
    }
  }, [params.reset]);

  useEffect(() => {
    // Animate form inputs sequentially
    inputAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 0,
        delay: index * 100,
        useNativeDriver: true,
        damping: 12,
        mass: 0.8,
        stiffness: 100,
      }).start();
    });

    // Fade in button
    Animated.spring(buttonAnim, {
      toValue: 1,
      delay: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateInput = (field: string, value: string): string => {
    switch (field) {
      case 'subject':
      case 'topic1':
      case 'topic2':
      case 'topic3':
        if (!value.trim()) {
          return `${field === 'subject' ? 'Subject name' : 'Topic'} is required`;
        }
        if (value.length < 2) {
          return 'Enter at least 2 characters';
        }
        break;
      case 'previousGrade':
        const grade = Number(value);
        if (isNaN(grade) || grade < 0 || grade > 100) {
          return 'Grade must be between 0-100';
        }
        break;
      case 'motivation':
        const motivation = Number(value);
        if (isNaN(motivation) || motivation < 1 || motivation > 10) {
          return 'Motivation must be between 1-10';
        }
        break;
      case 'studyHours':
        const hours = Number(value);
        if (isNaN(hours) || hours < 0 || hours > 24) {
          return 'Study hours must be between 0-24';
        }
        break;
    }
    return '';
  };

  const handleInputChange = (field: string, value: string) => {
    const error = validateInput(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    // Check for any existing errors
    if (Object.values(errors).some(error => error !== '')) {
      return false;
    }

    // Check if all required fields are filled
    const requiredFields = ['subject', 'topic1', 'previousGrade', 'motivation', 'studyHours'];
    return requiredFields.every(field => formData[field].trim() !== '');
  };

  const startTest = async () => {
    if (!isFormValid()) {
      Alert.alert('Error', 'Please fill in all fields correctly.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("https://gradewizard.onrender.com/generate_questions", formData);
      console.log("API Response:", response.data); // Debug log
      
      if (response.data?.questions && response.data.questions.length > 0) {
        setQuestions(response.data.questions);
        setAnswers([]);
        setCurrentQuestionIndex(0);
        animateNewQuestion(); // Yeni soru animasyonunu başlat
      } else {
        console.error('No questions in response:', response.data);
        Alert.alert(
          "Error",
          "Questions could not be generated. Please check the topics and try again."
        );
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      Alert.alert(
        "Error", 
        "Questions could not be generated. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const animateNewQuestion = () => {
    // Reset animations
    questionSlideAnim.setValue(width);
    questionFadeAnim.setValue(0);
    optionsAnim.forEach(anim => anim.setValue(50));
    optionsOpacity.forEach(anim => anim.setValue(0));

    // Start animations
    Animated.parallel([
      Animated.timing(questionSlideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(questionFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      ...optionsAnim.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 500,
          delay: 300 + (index * 100),
          useNativeDriver: true,
        })
      ),
      ...optionsOpacity.map((anim, index) =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          delay: 300 + (index * 100),
          useNativeDriver: true,
        })
      ),
    ]).start();
  };

  useEffect(() => {
    if (questions.length > 0) {
      animateNewQuestion();
    }
  }, [currentQuestionIndex]);

  const handleAnswer = (answer) => {
    Animated.parallel([
      Animated.timing(questionFadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      ...optionsOpacity.map(anim =>
        Animated.timing(anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ),
    ]).start(() => {
      setAnswers([...answers, answer]);
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        submitPrediction([...answers, answer]);
      }
    });
  };

  const saveGrade = async (grade) => {
    try {
      const existingGrades = await AsyncStorage.getItem('gradeHistory');
      const gradeHistory = existingGrades ? JSON.parse(existingGrades) : [];
      
      const newGrade = {
        id: Date.now().toString(),
        subject: formData.subject,
        grade: grade.toFixed(2), // Format to 2 decimal places
        date: new Date().toISOString(),
        topics: [formData.topic1, formData.topic2, formData.topic3],
        studyHours: formData.studyHours,
        motivation: formData.motivation
      };
      
      const updatedHistory = [newGrade, ...gradeHistory];
      await AsyncStorage.setItem('gradeHistory', JSON.stringify(updatedHistory));
      console.log('Grade saved successfully:', newGrade); // Debug log
    } catch (error) {
      console.error('Error saving grade:', error);
      Alert.alert("Error", "Grade could not be saved.");
    }
  };

  const submitPrediction = async (finalAnswers) => {
    setLoading(true);
    try {
      const response = await axios.post("https://192.168.1.199:8000/predict", {
        answers: finalAnswers,
        formData: formData
      });
      
      const predictedGrade = response.data.predicted_grade;
      await saveGrade(predictedGrade);
      
      // Fix the route path
      router.push({
        pathname: '../result',
        params: {
          grade: predictedGrade,
          studyHours: formData.studyHours,
          motivation: formData.motivation
        }
      });

    } catch (error) {
      console.error('Prediction error:', error);
      Alert.alert("Error", "Prediction could not be made. Please try again.");
    }
    setLoading(false);
  };

  const getPredictionEmoji = (grade) => {
    if (grade >= 90) return '🏆';
    if (grade >= 80) return '🌟';
    if (grade >= 70) return '📈';
    if (grade >= 60) return '💪';
    return '📚';
  };

  const getPredictionMessage = (grade) => {
    if (grade >= 90) return 'Excellent! You are doing great!';
    if (grade >= 80) return 'Great! You are very close to success!';
    if (grade >= 70) return 'Good! You are on the right track!';
    if (grade >= 60) return 'Not bad! You need to study a bit more.';
    return 'You need to study more.';
  };

  const PredictionResult = ({ grade }) => (
    <View style={styles.resultContainer}>
      <View style={styles.predictionCard}>
        <Text style={styles.predictionEmoji}>{getPredictionEmoji(grade)}</Text>
        <Text style={styles.predictionGrade}>{grade}</Text>
        <Text style={styles.predictionLabel}>/100</Text>
        <Text style={styles.predictionMessage}>{getPredictionMessage(grade)}</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <FontAwesome5 name="clock" size={20} color="#388E3C" />
            <Text style={styles.statLabel}>Study</Text>
            <Text style={styles.statValue}>{formData.studyHours} hours</Text>
          </View>
          <View style={styles.statItem}>
            <FontAwesome5 name="star" size={20} color="#388E3C" />
            <Text style={styles.statLabel}>Motivation</Text>
            <Text style={styles.statValue}>{formData.motivation}/10</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={() => { 
            setQuestions([]); 
            setPrediction(null); 
            setAnswers([]); 
            setCurrentQuestionIndex(0); 
          }}
        >
          <FontAwesome5 name="redo" size={16} color="#FFF" style={styles.buttonIcon} />
          <Text style={styles.retryButtonText}>Retake Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const DisclaimerModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showDisclaimer}
      onRequestClose={() => setShowDisclaimer(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => setShowDisclaimer(false)}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>About Grade Prediction</Text>
          <Text style={styles.modalText}>
            This system is an AI-based prediction tool. The results are not definitive and are for guidance purposes only. 
            Your actual grade may vary.
          </Text>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => setShowDisclaimer(false)}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderInput = (placeholder: string, field: string, index: number, keyboardType: string = 'default') => (
    <Animated.View
      style={{
        width: '90%',
        transform: [{ translateX: inputAnims[index] }],
      }}
    >
      <TextInput
        style={[
          styles.input,
          formData[field] ? styles.inputFilled : null,
          errors[field] ? styles.inputError : null
        ]}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
        value={formData[field]}
        onChangeText={(text) => handleInputChange(field, text)}
        onFocus={() => {
          Animated.spring(inputAnims[index], {
            toValue: -10,
            useNativeDriver: true,
            tension: 50,
          }).start();
        }}
        onBlur={() => {
          Animated.spring(inputAnims[index], {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }}
      />
      {errors[field] ? (
        <Text style={styles.errorText}>{errors[field]}</Text>
      ) : null}
    </Animated.View>
  );

  // Input fields
  const inputFields = [
    { placeholder: "Subject Name", field: "subject", type: "default" },
    { placeholder: "Topic 1", field: "topic1", type: "default" },
    { placeholder: "Topic 2", field: "topic2", type: "default" },
    { placeholder: "Topic 3", field: "topic3", type: "default" },
    { placeholder: "Previous Grade (0-100)", field: "previousGrade", type: "numeric" },
    { placeholder: "Motivation (1-10)", field: "motivation", type: "numeric" },
    { placeholder: "Study Hours", field: "studyHours", type: "numeric" }
  ];

  // Update the questions UI section
  const renderQuestions = () => {
    console.log("Current questions:", questions); // Debug log
    console.log("Current index:", currentQuestionIndex); // Debug log

    if (!questions || questions.length === 0) {
      return null;
    }

    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) {
      console.error("No question found for index:", currentQuestionIndex);
      return null;
    }

    return (
      <View style={styles.questionsContainer}>
        <ProgressBar 
          progress={(currentQuestionIndex + 1) / questions.length} 
          color="#4CAF50" 
          style={styles.progressBar} 
        />
        
        <Card style={styles.questionCard}>
          <LinearGradient
            colors={['#FFFFFF', '#F5F7FA']}
            style={styles.questionGradient}
          >
            <Card.Content style={styles.cardContent}>
              <View style={styles.questionHeader}>
                <View style={styles.questionProgress}>
                  <Text style={styles.questionCount}>
                    Question {currentQuestionIndex + 1}/{questions.length}
                  </Text>
                  <Text style={styles.remainingQuestions}>
                    {questions.length - currentQuestionIndex - 1} questions remaining
                  </Text>
                </View>
                <FontAwesome5 name="lightbulb" size={24} color="#FFA726" />
              </View>

              <Animated.View style={[
                styles.questionTextContainer,
                {
                  transform: [{ translateX: questionSlideAnim }],
                  opacity: questionFadeAnim,
                }
              ]}>
                <Text style={styles.questionText}>
                  {currentQuestion}
                </Text>
              </Animated.View>

              <View style={styles.answersContainer}>
                {["Yes, I Know", "Somewhat", "No, I Don't Know"].map((option, index) => (
                  <Animated.View
                    key={option}
                    style={[
                      styles.answerButtonContainer,
                      {
                        transform: [{ translateY: optionsAnim[index] }],
                        opacity: optionsOpacity[index],
                      }
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.answerButton}
                      onPress={() => handleAnswer(option)}
                      activeOpacity={0.9}
                    >
                      <LinearGradient
                        colors={
                          index === 0 ? ['#4CAF50', '#388E3C'] :
                          index === 1 ? ['#FFA726', '#F57C00'] :
                          ['#EF5350', '#D32F2F']
                        }
                        style={styles.answerGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <FontAwesome5 
                          name={
                            index === 0 ? 'check-circle' :
                            index === 1 ? 'question-circle' :
                            'times-circle'
                          } 
                          size={16} 
                          color="#FFF" 
                          style={styles.answerIcon}
                        />
                        <Text style={styles.answerText}>{option}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </View>
            </Card.Content>
          </LinearGradient>
        </Card>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#E8F5E9", "#C8E6C9"]} style={styles.container}>
      <DisclaimerModal />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>
          <FontAwesome5 name="graduation-cap" size={28} color="#388E3C" /> Grade Wizard
        </Text>

        {!questions || questions.length === 0 ? (
          // Form view
          <>
            {inputFields.map((input, index) => 
              renderInput(input.placeholder, input.field, index, input.type)
            )}
            
            <Animated.View style={{ opacity: buttonAnim, width: '90%' }}>
              <TouchableOpacity 
                style={[
                  styles.startButton,
                  loading && styles.startButtonDisabled,
                  !isFormValid() && styles.startButtonDisabled
                ]} 
                onPress={startTest} 
                disabled={loading || !isFormValid()}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <FontAwesome5 name="rocket" size={20} color="#FFF" style={styles.buttonIcon} />
                    <Text style={styles.startButtonText}>Start Test</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          </>
        ) : (
          // Questions view
          renderQuestions()
        )}

        {prediction !== null && <PredictionResult grade={prediction} />}
      </ScrollView>
    </LinearGradient>
  );
};

// Add or update these styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { padding: 15, alignItems: "center", flexGrow: 1, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: "bold", color: "#388E3C", textAlign: "center", marginBottom: 20 },
  input: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 15, 
    padding: 12, 
    marginBottom: 15, 
    width: "100%", 
    fontSize: 16, 
    color: "#333333", 
    borderWidth: 1,
    borderColor: "#C8E6C9",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  inputFilled: {
    borderColor: '#388E3C',
    borderWidth: 2,
    backgroundColor: '#F5FFF7',
  },
  inputError: {
    borderColor: '#ef4444',
    borderWidth: 1,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  progressBar: { width: "90%", height: 8, borderRadius: 10, marginTop: 10 },
  card: { 
    width: "100%", 
    backgroundColor: "#FFFFFF", 
    padding: 20, 
    borderRadius: 30, 
    elevation: 4, 
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9", 
  },
  progressText: { fontSize: 18, fontWeight: "bold", color: "#388E3C", textAlign: "center" },
  questionContainer: { alignItems: "center", marginTop: 10 },
  questionText: { fontSize: 23, color: "#333333", textAlign: "center", marginBottom: 40 },
  buttonGroup: { flexDirection: "column", alignItems: "center", marginTop: 10 },
  answerButton: { 
    backgroundColor: "#4CAF50", 
    borderRadius: 10, 
    padding: 12, 
    marginVertical: 5, 
    width: "90%", 
    alignItems: "center" 
  },
  answerText: { fontSize: 16, color: "#FFFFFF", fontWeight: "bold" },
  resultContainer: { alignItems: "center", marginTop: 30, width: "100%" },
  result: { fontSize: 22, fontWeight: "bold", color: "#388E3C", textAlign: "center" },
  startButton: { 
    backgroundColor: "#4CAF50", 
    borderRadius: 20, 
    padding: 15, 
    width: "100%", 
    alignItems: "center", 
    marginTop: 20, 
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  startButtonDisabled: {
    backgroundColor: '#A5D6A7',
    elevation: 0,
    opacity: 0.7,
  },
  startButtonText: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 25,
    width: '100%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  predictionEmoji: {
    fontSize: 50,
    marginBottom: 10,
  },
  predictionGrade: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#388E3C',
  },
  predictionLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 10,
  },
  predictionMessage: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginVertical: 15,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    marginBottom: 25,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    width: '45%',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#388E3C',
    marginTop: 3,
  },
  retryButton: {
    backgroundColor: '#388E3C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  buttonIcon: {
    marginRight: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  questionsContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 20,
  },
  questionCard: {
    marginTop: 20,
    borderRadius: 20,
    elevation: 4,
    overflow: 'hidden',
    backgroundColor: '#FFF',
  },
  questionGradient: {
    minHeight: 400,
  },
  cardContent: {
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    paddingVertical: 10,
  },
  questionProgress: {
    flex: 1,
  },
  questionCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 4,
  },
  remainingQuestions: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  questionTextContainer: {
    marginBottom: 40,
    paddingHorizontal: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  questionText: {
    fontSize: 20,
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 32,
    fontWeight: '500',
  },
  answersContainer: {
    gap: 16,
  },
  answerButtonContainer: {
    width: '100%',
  },
  answerButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  answerGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerIcon: {
    marginRight: 10,
  },
  answerText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E8F5E9',
  },
});

export default GradePrediction;
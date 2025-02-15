import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Animated, Dimensions, Easing
} from 'react-native';
import { router } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subjects, interests } from '../constants/data';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const educationLevels = [
  { id: 'university', name: 'University', icon: 'university' },
  { id: 'highschool', name: 'High School', icon: 'school' },
  { id: 'middleschool', name: 'Middle School', icon: 'book-reader' }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    padding: 20,
  },
  step: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 80,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardSelected: {
    backgroundColor: '#388E3C',
    borderColor: '#388E3C',
  },
  cardText: {
    marginTop: 8,
    color: '#388E3C',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  cardTextSelected: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#C8E6C9',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  buttonActive: {
    backgroundColor: '#388E3C',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    color: '#388E3C',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#C8E6C9',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#388E3C',
    borderRadius: 2,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  stepDotActive: {
    backgroundColor: '#388E3C',
    transform: [{ scale: 1.2 }],
  },
  stepDotCompleted: {
    backgroundColor: '#81C784',
  },
  optionCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
    elevation: 2,
  },
  optionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  interestsContainer: {
    paddingBottom: 80,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  interestCard: {
    borderRadius: 16,
    padding: 15,
    height: 120,
    justifyContent: 'space-between',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
  },
  interestTextSelected: {
    color: '#FFF',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  educationContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  educationText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    flex: 1,
  },
  educationTextSelected: {
    color: '#FFF',
  },
  selectedIndicator: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  progressContainer: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E0E0E0',
  },
  stepActive: {
    backgroundColor: '#4CAF50',
    transform: [{ scale: 1.2 }],
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    elevation: 8,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56,142,60,0.1)',
  },
  inputField: {
    fontSize: 18,
    color: '#2C3E50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(56,142,60,0.05)',
    borderRadius: 12,
    marginTop: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388E3C',
    marginBottom: 4,
  },
  educationCard: {
    width: '100%',
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    backgroundColor: 'white',
    transform: [{ scale: 1 }],
  },
  educationContent: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderRadius: 24,
  },
  iconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(56,142,60,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(56,142,60,0.2)',
  },
  interestCard: {
    borderRadius: 20,
    padding: 20,
    height: 140,
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    backgroundColor: 'white',
  },
  selectedCard: {
    transform: [{ scale: 1.05 }],
    elevation: 8,
  },
  button: {
    backgroundColor: '#388E3C',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 20,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 8,
  },
  stepDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E0E0E0',
    transform: [{ scale: 1 }],
  },
  stepDotActive: {
    backgroundColor: '#388E3C',
    transform: [{ scale: 1.2 }],
    elevation: 4,
    shadowColor: '#388E3C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

// Input alanı için özel komponent
const CustomInput = ({ label, value, onChangeText, placeholder, animations }) => (
  <Animated.View 
    style={[styles.inputContainer, {
      transform: [{ scale: animations.scale }],
      opacity: animations.fade
    }]}
  >
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.inputField}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="rgba(44,62,80,0.4)"
    />
  </Animated.View>
);

// İlgi alanı kartı için özel komponent
const InterestCard = React.memo(({ interest, isSelected, onPress }) => (
  <Animated.View
    style={[
      styles.interestCard,
      isSelected && styles.selectedCard,
      {
        transform: [{ scale: scaleAnim }],
        opacity: fadeAnim
      }
    ]}
  >
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={isSelected ? ['#388E3C', '#1B5E20'] : ['#FFFFFF', '#F5F5F5']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* ...existing card content... */}
      </LinearGradient>
    </TouchableOpacity>
  </Animated.View>
));

export default function UserSetup() {
  // Yeni animasyon değişkenleri
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(width)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  const interestAnimations = React.useRef(
    interests.reduce((acc, interest) => {
      acc[interest.id] = new Animated.Value(1);
      return acc;
    }, {})
  ).current;

  const [name, setName] = useState('');
  const [educationLevel, setEducationLevel] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Animasyon fonksiyonları
  const animateTransition = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp)
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  };

  const animateRotation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease)
        })
      ])
    ).start();
  };

  useEffect(() => {
    animateTransition();
    animateRotation();
  }, [step]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  useEffect(() => {
    // Start fade animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true
    }).start();
    
    // Verify data is available
    if (subjects && interests) {
      setIsLoading(false);
    }
  }, []);

  const handleInterestToggle = (interest) => {
    setSelectedInterests(prev => {
      if (prev.includes(interest.id)) {
        return prev.filter(id => id !== interest.id);
      }
      return [...prev, interest.id];
    });
  };

  const handleComplete = async () => {
    if (!educationLevel || selectedInterests.length === 0) {
      alert('Please select your education level and at least one interest');
      return;
    }

    try {
      const userProfile = {
        educationLevel,
        interests: selectedInterests,
        setupCompleted: true,
        createdAt: new Date().toISOString()
      };

      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
      // Değiştirilen kısım: Doğrudan Home sayfasına yönlendir
      router.replace("/(tabs)/Home");
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  };

  const handleNextStep = () => {
    if (step === 2) {
      if (educationLevel === 'university') {
        setStep(3); // Go to subject selection for university students
      } else {
        setStep(4); // Skip to interests for non-university students
      }
    } else {
      setStep(step + 1);
    }
  };

  const getStepProgress = () => {
    const totalSteps = educationLevel === 'university' ? 4 : 3;
    return `${step}/${totalSteps}`;
  };

  const handleEducationSelect = (level) => {
    setEducationLevel(level);
    if (level !== 'university') {
      setSelectedSubject(null); // Clear subject if not university
    }
    handleNextStep();
  };

  const getProgressColor = (currentStep) => {
    // Return different colors based on progress
    if (currentStep === 1) return '#4CAF50';
    if (currentStep === 2) return '#2196F3';
    if (currentStep === 3) return '#9C27B0';
    return '#388E3C';
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <Text style={styles.progressText}>Setup {getStepProgress()}</Text>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { 
              width: `${(step/(educationLevel === 'university' ? 4 : 3)) * 100}%`,
              backgroundColor: getProgressColor(step)
            }
          ]} 
        />
      </View>
      <View style={styles.stepsIndicator}>
        {Array.from({ length: educationLevel === 'university' ? 4 : 3 }).map((_, idx) => (
          <View 
            key={idx} 
            style={[
              styles.stepDot,
              idx + 1 === step && styles.stepDotActive,
              idx < step && styles.stepDotCompleted
            ]} 
          />
        ))}
      </View>
    </View>
  );

  const renderInterestCard = React.useCallback((interest) => {
    const isSelected = selectedInterests.includes(interest.id);
    const scaleAnim = interestAnimations[interest.id];

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true
        })
      ]).start();

      handleInterestToggle(interest);
    };

    return (
      <Animated.View
        key={interest.id}
        style={{
          transform: [{ scale: scaleAnim }],
          width: (width - 60) / 2,
          marginBottom: 15,
        }}
      >
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isSelected ? ['#388E3C', '#1B5E20'] : ['#FFFFFF', '#F5F5F5']}
            style={styles.interestCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={[
              styles.iconContainer,
              { backgroundColor: isSelected ? 'rgba(255,255,255,0.2)' : '#E8F5E9' }
            ]}>
              <FontAwesome5 
                name={interest.icon} 
                size={24} 
                color={isSelected ? '#FFF' : '#388E3C'} 
              />
            </View>
            <Text style={[
              styles.interestText,
              isSelected && styles.interestTextSelected
            ]}>
              {interest.name}
            </Text>
            {isSelected && (
              <View style={styles.selectedBadge}>
                <FontAwesome5 name="check" size={12} color="#FFF" />
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [selectedInterests, handleInterestToggle]);

  const renderEducationLevel = (level) => (
    <Animated.View
      style={[
        styles.educationCard,
        {
          transform: [
            { scale: scaleAnim },
            { translateX: slideAnim }
          ],
          opacity: fadeAnim
        }
      ]}
    >
      <TouchableOpacity
        onPress={() => handleEducationSelect(level.id)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={educationLevel === level.id ? 
            ['#388E3C', '#1B5E20'] : 
            ['#FFFFFF', '#F5F5F5']}
          style={styles.educationContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <View style={styles.iconBg}>
              <FontAwesome5 
                name={level.icon} 
                size={28} 
                color={educationLevel === level.id ? '#FFF' : '#388E3C'} 
              />
            </View>
          </Animated.View>
          <Text style={[
            styles.educationText,
            educationLevel === level.id && styles.educationTextSelected
          ]}>
            {level.name}
          </Text>
          {educationLevel === level.id && (
            <View style={styles.selectedIndicator}>
              <FontAwesome5 name="check-circle" size={24} color="#FFF" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );

  if (isLoading || !subjects || !interests) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#E8F5E9', '#C8E6C9']}
      style={styles.container}
    >
      {renderProgressBar()}

      <Animated.View 
        style={[
          styles.card,
          { 
            transform: [{ scale: fadeAnim }],
            opacity: fadeAnim 
          }
        ]}
      >
        {step === 1 ? (
          <View style={styles.step}>
            <Text style={styles.title}>Welcome!</Text>
            <Text style={styles.subtitle}>Let's get to know you</Text>
            <CustomInput
              label="İsminiz"
              value={name}
              onChangeText={setName}
              placeholder="İsminizi giriniz..."
              animations={{ // Pass animations as prop
                scale: scaleAnim,
                fade: fadeAnim
              }}
            />
            <TouchableOpacity 
              style={[styles.button, name.length > 0 && styles.buttonActive]}
              disabled={name.length === 0}
              onPress={() => setStep(2)}
            >
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Devam Et</Text>
                <FontAwesome5 name="arrow-right" size={16} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : step === 2 ? (
          <View style={styles.step}>
            <Text style={styles.title}>Education Level</Text>
            <View style={styles.grid}>
              {educationLevels.map(level => renderEducationLevel(level))}
            </View>
          </View>
        ) : step === 3 && educationLevel === 'university' ? (
          <View style={styles.step}>
            <Text style={styles.title}>Your Department</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.grid}>
                {subjects.map(subject => (
                  <TouchableOpacity
                    key={subject.id}
                    style={[
                      styles.card,
                      selectedSubject === subject.id && styles.cardSelected
                    ]}
                    onPress={() => {
                      setSelectedSubject(subject.id);
                    }}
                  >
                    <FontAwesome5 
                      name={subject.icon} 
                      size={24} 
                      color={selectedSubject === subject.id ? '#fff' : '#388E3C'} 
                    />
                    <Text style={[
                      styles.cardText,
                      selectedSubject === subject.id && styles.cardTextSelected
                    ]}>
                      {subject.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.button, selectedSubject && styles.buttonActive]}
              disabled={!selectedSubject}
              onPress={handleNextStep}
            >
              <Text style={styles.buttonText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.step}>
            <Text style={styles.title}>Your Interests</Text>
            <Text style={styles.subtitle}>
              {selectedInterests.length} selected
            </Text>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.interestsContainer}
            >
              <View style={styles.interestsGrid}>
                {interests.map(interest => renderInterestCard(interest))}
              </View>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.button, selectedInterests.length > 0 && styles.buttonActive]}
              disabled={selectedInterests.length === 0}
              onPress={handleComplete}
            >
              <Text style={styles.buttonText}>
                {selectedInterests.length > 0 ? 'Devam Et' : 'Lütfen seçim yapın'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
}

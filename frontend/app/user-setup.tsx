import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  TextInput,
  Animated,
  Dimensions 
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

export default function UserSetup() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
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
    try {
      const userProfileData = {
        name: name.trim(),
        educationLevel,
        subject: educationLevel === 'university' ? selectedSubject : null,
        interests: selectedInterests,
        setupComplete: true,
        avatar: null, // Default avatar will be set
        createdAt: new Date().toISOString(),
        stats: {
          examCount: 0,
          studyDays: 0,
          averageGrade: 0,
          lastActive: new Date().toISOString()
        },
        preferences: {
          dailyStudyGoal: 2, // Default 2 hours
          notifications: true,
          theme: 'light'
        }
      };
      
      console.log('Saving profile:', userProfileData); // Debug log
      
      await AsyncStorage.setItem('userProfile', JSON.stringify(userProfileData));
      router.replace('../(tabs)');
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

  if (isLoading || !subjects || !interests) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <TextInput
              style={styles.input}
              placeholder="What's your name?"
              value={name}
              onChangeText={setName}
            />
            <TouchableOpacity 
              style={[styles.button, name.length > 0 && styles.buttonActive]}
              disabled={name.length === 0}
              onPress={() => setStep(2)}
            >
              <Text style={styles.buttonText}>Devam Et</Text>
            </TouchableOpacity>
          </View>
        ) : step === 2 ? (
          <View style={styles.step}>
            <Text style={styles.title}>Education Level</Text>
            <View style={styles.grid}>
              {educationLevels.map(level => (
                <TouchableOpacity
                  key={level.id}
                  style={[
                    styles.card,
                    educationLevel === level.id && styles.cardSelected
                  ]}
                  onPress={() => handleEducationSelect(level.id)}
                >
                  <FontAwesome5 
                    name={level.icon} 
                    size={24} 
                    color={educationLevel === level.id ? '#fff' : '#388E3C'} 
                  />
                  <Text style={[
                    styles.cardText,
                    educationLevel === level.id && styles.cardTextSelected
                  ]}>
                    {level.name}
                  </Text>
                </TouchableOpacity>
              ))}
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
    </View>
  );
}

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
});

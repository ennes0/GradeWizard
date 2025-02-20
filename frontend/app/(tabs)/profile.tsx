import React, { useState, useEffect } from "react";
import { 
  View, Text, StyleSheet, Image, TouchableOpacity, 
  ScrollView, Animated, Platform, Alert 
} from "react-native";
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome5 } from '@expo/vector-icons';
import { subjects, interests } from '../../constants/data';
import { LinearGradient } from 'expo-linear-gradient';
import { AvatarPicker } from '../../components/AvatarPicker';
import { scheduleAllNotifications, cancelAllNotifications } from '../../services/NotificationService';
import { useLanguage } from '../../contexts/LanguageContext'; // Add this import
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';  // Yeni import
import AdService from '../../services/AdService';  // Yeni import

export default function Profile() {
  const { t, language, changeLanguage } = useLanguage();
  const [userData, setUserData] = useState({
    name: '',
    educationLevel: '',
    subject: null,
    interests: [],
    avatar: null,
  });
  const [stats, setStats] = useState({
    totalExams: 0,
    avgGrade: 0,
    studyDays: 0,
    completedPlans: 0
  });
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    loadUserProfile();
    loadUserStats();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true
    }).start();
  }, []);

  const loadUserStats = async () => {
    try {
      const [grades, streak, exams] = await Promise.all([
        AsyncStorage.getItem('gradeHistory'),
        AsyncStorage.getItem('study_streak'),
        AsyncStorage.getItem('exams')
      ]);

      const parsedGrades = grades ? JSON.parse(grades) : [];
      const parsedStreak = streak ? JSON.parse(streak) : [];
      const parsedExams = exams ? JSON.parse(exams) : [];

      const avgGrade = parsedGrades.length > 0 
        ? (parsedGrades.reduce((sum, g) => sum + Number(g.grade), 0) / parsedGrades.length).toFixed(1)
        : 0;

      setStats({
        totalExams: parsedGrades.length,
        avgGrade,
        studyDays: parsedStreak.filter(day => day.completed).length,
        completedPlans: parsedExams.filter(exam => exam.studyPlan?.created).length
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const userProfile = await AsyncStorage.getItem('userProfile');
      if (userProfile) {
        setUserData(JSON.parse(userProfile));
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : '';
  };

  const getInterestNames = (ids) => {
    return interests
      .filter(interest => ids.includes(interest.id))
      .map(interest => interest.name)
      .join(', ');
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('hasSeenOnboarding');
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleAvatarSelect = async (avatarUri) => {
    try {
      const updatedUserData = { ...userData, avatar: avatarUri };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
    } catch (error) {
      console.error('Error updating avatar:', error);
    }
  };

  const handleSubjectChange = async () => {
    if (userData.educationLevel === 'university') {
      router.push('/profile/subject-select');
    }
  };

  const handleRemoveAds = () => {
    Alert.alert(
      "Premium Feature",
      "This feature will be available soon!",
      [{ text: "OK", style: "default" }]
    );
  };

  const renderEducationInfo = () => {
    const getEducationLabel = () => {
      if (!userData.educationLevel) return '';
      
      switch (userData.educationLevel) {
        case 'university':
          return getSubjectName(userData.subject);
        case 'highschool':
          return 'High School Student';
        case 'middleschool':
          return 'Middle School Student';
        default:
          return '';
      }
    };

    return (
      <View style={styles.subjectContainer}>
        <FontAwesome5 name="graduation-cap" size={16} color="#FFF" />
        <Text style={styles.subjectText}>{getEducationLabel()}</Text>
      </View>
    );
  };

  const StatCard = ({ icon, value, label }) => (
    <Animated.View style={[styles.statCard, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['#F1F8E9', '#E8F5E9']}
        style={styles.statGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name={icon} size={24} color="#2E7D32" />
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </LinearGradient>
    </Animated.View>
  );

  const switchLanguage = async () => {
    const newLang = language === 'tr' ? 'en' : 'tr';
    await changeLanguage(newLang);
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.clear(); // Tüm verileri temizle
      router.replace('/onboarding');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Profil düzenleme işlevi
  const handleEditProfile = () => {
    router.push('/onboarding');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#2E7D32', '#1B5E20']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <View style={styles.profileHeader}>
          <AvatarPicker
            selectedAvatar={userData.avatar}
            onSelectAvatar={handleAvatarSelect}
          />
          <Text style={styles.userName}>{userData.name}</Text>
          {renderEducationInfo()}
        </View>
      </LinearGradient>

      <View style={styles.mainContent}>
        <View style={styles.statsGrid}>
          <StatCard icon="graduation-cap" value={stats.totalExams} label="Exams" />
          <StatCard icon="chart-line" value={`${stats.avgGrade}%`} label="Average" />
          <StatCard icon="calendar-check" value={stats.studyDays} label="Study Days" />
          <StatCard icon="tasks" value={stats.completedPlans} label="Plans" />
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <FontAwesome5 name="star" size={18} color="#388E3C" />
            <Text style={styles.sectionTitle}>Interests</Text>
          </View>
          <Text style={styles.interestText}>{getInterestNames(userData.interests)}</Text>
        </View>

        {/* Yeni banner reklam bölümü */}
        <View style={styles.adContainer}>
          <BannerAd
            unitId={AdService.getAdUnitId('banner')}
            size={BannerAdSize.MEDIUM_RECTANGLE}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
              keywords: ['education', 'study', 'exam'],
            }}
          />
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/profile/grades')}
          >
            <FontAwesome5 name="chart-bar" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Grade History</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleEditProfile}
          >
            <FontAwesome5 name="user-edit" size={20} color="#FFF" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
  

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/profile/grades')}
          >
            <View style={styles.settingLeft}>
              <FontAwesome5 name="chart-bar" size={20} color="#388E3C" />
              <Text style={styles.settingTitle}>My Grades</Text>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleRemoveAds}
          >
            <View style={styles.settingLeft}>
              <FontAwesome5 name="crown" size={20} color="#FFD700" />
              <View>
                <Text style={styles.settingTitle}>Remove Ads</Text>
                <Text style={styles.settingDescription}>
                  Go Premium - Coming Soon
                </Text>
              </View>
            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/profile/about')}
          >
            <View style={styles.settingLeft}>
              <FontAwesome5 name="info-circle" size={20} color="#388E3C" />
              <Text style={styles.settingTitle}>About</Text>
              

            </View>
            <FontAwesome5 name="chevron-right" size={16} color="#666" />
          </TouchableOpacity>
        
          
          {/* ...rest of existing buttons... */}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button}
            onPress={handleSignOut}
          >
            <FontAwesome5 name="sync" size={18} color="#FFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  headerGradient: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40, // Increased padding
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  profileHeader: {
    alignItems: "center",
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  badgeIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 3,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginVertical: 8,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  subjectText: {
    fontSize: 16,
    color: "#FFF",
    fontWeight: '500',
  },
  mainContent: {
    marginTop: -35, // Pull content up to overlap with header
    paddingHorizontal: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20, // Reduced margin
  },
  statCard: {
    width: '48%',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statGradient: {
    padding: 15,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32', // Darker green for better contrast
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#4A4A4A',
    fontWeight: '500',
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20, // Reduced margin
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  interestText: {
    fontSize: 16,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    marginVertical: 10,
  },
  actionButton: {
    backgroundColor: '#2E7D32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 2,
    flex: 0.48, // Genişlik ayarı
    justifyContent: 'center',
    gap: 8,
  },
  settingsSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: "#388E3C",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonIcon: {
    marginRight: 8,
  },
  adContainer: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default Profile;
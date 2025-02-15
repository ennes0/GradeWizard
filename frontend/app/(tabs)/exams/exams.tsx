import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Modal, TextInput, Alert, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface Exam {
  id: string;
  subject: string;
  date: string;
  examDate: string;
  topics: string[];
  studyPlan: {
    created: boolean;
    totalHours: number;
    dailyHours: number;
    topics: { [key: string]: number };
  };
  importance: 'high' | 'medium' | 'low';
  notes: string;
}

export default function ExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newExam, setNewExam] = useState({
    subject: '',
    examDate: new Date(),
    topics: '',
    importance: 'medium' as const,
    notes: '',
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateError, setDateError] = useState('');
  const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [studyPlanHours, setStudyPlanHours] = useState('2');
  const [showStudyPlanDetailsModal, setShowStudyPlanDetailsModal] = useState(false);
  const [selectedStudyPlan, setSelectedStudyPlan] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    loadExams();
    const interval = setInterval(checkAndRemoveExpiredExams, 86400000); // 24 saat
    return () => clearInterval(interval);
  }, []);

  const loadExams = async () => {
    try {
      const savedExams = await AsyncStorage.getItem('exams');
      if (savedExams) {
        setExams(JSON.parse(savedExams));
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    }
  };

  const checkAndRemoveExpiredExams = async () => {
    try {
      const currentExams = [...exams];
      const now = new Date().getTime();
      const updatedExams = currentExams.filter(exam => {
        const examDate = new Date(exam.examDate).getTime();
        return examDate > now;
      });

      if (updatedExams.length !== currentExams.length) {
        await AsyncStorage.setItem('exams', JSON.stringify(updatedExams));
        setExams(updatedExams);
      }
    } catch (error) {
      console.error('Error removing expired exams:', error);
    }
  };

  const validateExam = () => {
    if (!newExam.subject.trim()) {
      Alert.alert('Error', 'Please enter subject name');
      return false;
    }
    if (!newExam.topics.trim()) {
      Alert.alert('Error', 'Please enter topics');
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const examDate = new Date(newExam.examDate);
    examDate.setHours(0, 0, 0, 0);

    if (examDate < today) {
      Alert.alert('Error', 'Exam date cannot be before today');
      return false;
    }

    return true;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setDateError('Exam date cannot be before today');
        return;
      }
      
      setDateError('');
      setNewExam({ ...newExam, examDate: selectedDate });
    }
  };

  const saveExam = async () => {
    if (!validateExam()) return;

    const exam: Exam = {
      id: Date.now().toString(),
      subject: newExam.subject.trim(),
      date: new Date().toISOString(),
      examDate: newExam.examDate.toISOString(),
      topics: newExam.topics.split(',').map(t => t.trim()).filter(t => t),
      studyPlan: { created: false, totalHours: 0, dailyHours: 0, topics: {} },
      importance: newExam.importance,
      notes: newExam.notes.trim()
    };

    try {
      const updatedExams = [...exams, exam].sort((a, b) => 
        new Date(a.examDate).getTime() - new Date(b.examDate).getTime()
      );
      await AsyncStorage.setItem('exams', JSON.stringify(updatedExams));
      setExams(updatedExams);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving exam:', error);
      Alert.alert('Error', 'Exam could not be saved');
    }
  };

  const resetForm = () => {
    setNewExam({
      subject: '',
      examDate: new Date(),
      topics: '',
      importance: 'medium',
      notes: ''
    });
    setDateError('');
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return '#ef476f';
      case 'medium': return '#ffd166';
      case 'low': return '#06d6a0';
      default: return '#83c5be';
    }
  };

  const renderExamCard = ({ item }: { item: Exam }) => {
    const examDate = new Date(item.examDate);
    const now = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const hoursUntilExam = Math.ceil((examDate.getTime() - now.getTime()) / (1000 * 60 * 60));

    const getTimeDisplay = () => {
      if (daysUntilExam <= 0) {
        if (hoursUntilExam <= 0) return 'Today';
        return `${hoursUntilExam}h`;
      }
      return `${daysUntilExam}d`;
    };

    const getUrgencyColor = () => {
      if (daysUntilExam <= 1) return ['#FF416C', '#FF4B2B'];
      if (daysUntilExam <= 3) return ['#F6983C', '#E8781E'];
      if (daysUntilExam <= 7) return ['#3CB0F6', '#1E88E8'];
      return ['#4CAF50', '#388E3C'];
    };

    return (
      <Animated.View 
        style={[styles.examCardContainer]}
        entering={FadeInDown.duration(400)}
      >
        <LinearGradient
          colors={getUrgencyColor()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.examCard}
        >
          <View style={styles.cardHeader}>
            <View style={styles.subjectContainer}>
              <Text style={styles.subjectText}>{item.subject}</Text>
              <Text style={styles.dateText}>
                {examDate.toLocaleDateString('en-US', { 
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timeText}>{getTimeDisplay()}</Text>
              <Text style={styles.timeLabel}>remaining</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.topicsScroll}
          >
            {item.topics.map((topic, index) => (
              <View key={index} style={styles.topicChip}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                item.studyPlan.created ? styles.viewPlanButton : styles.createPlanButton
              ]}
              onPress={() => {
                if (item.studyPlan.created) {
                  setSelectedStudyPlan(item.studyPlan.plan);
                  setShowStudyPlanDetailsModal(true);
                } else {
                  setSelectedExam(item);
                  setShowStudyPlanModal(true);
                }
              }}
            >
              <FontAwesome5 
                name={item.studyPlan.created ? "book-reader" : "plus"} 
                size={16} 
                color="#FFF" 
              />
              <Text style={styles.actionButtonText}>
                {item.studyPlan.created ? "View Plan" : "Create Plan"}
              </Text>
            </TouchableOpacity>

            <View style={styles.importanceIndicator}>
              <FontAwesome5 
                name="flag" 
                size={14} 
                color="#FFF" 
                style={styles.importanceIcon}
              />
              <Text style={styles.importanceText}>
                {item.importance.charAt(0).toUpperCase() + item.importance.slice(1)} Priority
              </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderDatePicker = () => (
    <>
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={newExam.examDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}
      
      {Platform.OS === 'ios' ? (
        <View style={styles.datePickerContainer}>
          <Text style={styles.inputLabel}>Exam Date</Text>
          <DateTimePicker
            value={newExam.examDate}
            mode="date"
            display="spinner"
            onChange={handleDateChange}
            minimumDate={new Date()}
            style={styles.iosDatePicker}
          />
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.input, dateError ? styles.inputError : null]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>
            Exam Date: {newExam.examDate.toLocaleDateString('en-US')}
          </Text>
        </TouchableOpacity>
      )}
      {dateError ? <Text style={styles.errorText}>{dateError}</Text> : null}
    </>
  );

  const generateStudyPlan = async (exam: Exam) => {
    setIsGeneratingPlan(true);
    try {
      const daysUntilExam = Math.ceil(
        (new Date(exam.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
  
      const response = await fetch('https://gradewizard.onrender.com/generate_study_plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topics: exam.topics,
          totalDays: daysUntilExam,
          hoursPerDay: parseInt(studyPlanHours)
        }),
      });
  
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.detail);
  
      const updatedExam = {
        ...exam,
        studyPlan: {
          created: true,
          totalHours: daysUntilExam * parseInt(studyPlanHours),
          dailyHours: parseInt(studyPlanHours),
          topics: exam.topics.reduce((acc, topic) => ({...acc, [topic]: 0}), {}),
          plan: data.study_plan
        }
      };
  
      const updatedExams = exams.map(e => e.id === exam.id ? updatedExam : e);
      await AsyncStorage.setItem('exams', JSON.stringify(updatedExams));
      setExams(updatedExams);
      setShowStudyPlanModal(false);
      setSelectedExam(null);
      Alert.alert('Success', 'Study plan has been created successfully!');
    } catch (error) {
      console.error('Error generating study plan:', error);
      Alert.alert('Error', 'Failed to create study plan. Please try again.');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const renderAddExamModal = () => (
    <Modal
      visible={showAddModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => {
        setShowAddModal(false);
        resetForm();
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add New Exam</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter subject name"
                placeholderTextColor="#94A3B8"
                value={newExam.subject}
                onChangeText={text => setNewExam({ ...newExam, subject: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Exam Date</Text>
              {Platform.OS === 'ios' ? (
                <DateTimePicker
                  value={newExam.examDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  style={[styles.input, { height: 120 }]}
                />
              ) : (
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, !newExam.examDate && styles.datePlaceholder]}>
                    {newExam.examDate ? newExam.examDate.toLocaleDateString() : 'Select date'}
                  </Text>
                  <FontAwesome5 name="calendar-alt" size={20} color="#64748B" />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Topics</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter topics separated by commas"
                placeholderTextColor="#94A3B8"
                value={newExam.topics}
                onChangeText={text => setNewExam({ ...newExam, topics: text })}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.importanceContainer}>
              <Text style={styles.importanceTitle}>Importance Level</Text>
              <View style={styles.importanceButtons}>
                {['low', 'medium', 'high'].map((imp) => (
                  <TouchableOpacity
                    key={imp}
                    style={[
                      styles.importanceButton,
                      { backgroundColor: getImportanceColor(imp) },
                      newExam.importance === imp && { transform: [{ scale: 1.05 }] }
                    ]}
                    onPress={() => setNewExam({...newExam, importance: imp as any})}
                  >
                    <Text style={styles.importanceText}>
                      {imp.charAt(0).toUpperCase() + imp.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveExam}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Exams</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setShowAddModal(true)}
        >
          <FontAwesome5 name="plus" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {exams.length > 0 ? (
        <FlatList
          data={exams}
          renderItem={renderExamCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="book" size={50} color="#C8E6C9" />
          <Text style={styles.emptyText}>No exams added yet</Text>
          <Text style={styles.emptySubText}>Click + button to add a new exam</Text>
        </View>
      )}

      {renderAddExamModal()}

      <Modal
        visible={showStudyPlanModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowStudyPlanModal(false);
          setSelectedExam(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Study Plan</Text>
            
            <Text style={styles.inputLabel}>Daily Study Hours</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={studyPlanHours}
              onChangeText={setStudyPlanHours}
              placeholder="How many hours will you study per day?"
            />

            {isGeneratingPlan && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#388E3C" />
                <Text style={styles.loadingText}>
                  Generating your personalized study plan...{'\n'}
                  This may take a moment.
                </Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStudyPlanModal(false)}
                disabled={isGeneratingPlan}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  styles.saveButton,
                  isGeneratingPlan && styles.disabledButton
                ]}
                onPress={() => selectedExam && generateStudyPlan(selectedExam)}
                disabled={isGeneratingPlan}
              >
                {isGeneratingPlan ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showStudyPlanDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudyPlanDetailsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.studyPlanModalContent]}>
            <Text style={styles.modalTitle}>Study Plan</Text>
            <ScrollView style={styles.studyPlanScroll}>
              <Text style={styles.studyPlanText}>{selectedStudyPlan}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setShowStudyPlanDetailsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  listContainer: {
    paddingBottom: 80,
  },
  examCardContainer: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  examCard: {
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  subjectContainer: {
    flex: 1,
    marginRight: 16,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  timeContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 12,
    minWidth: 80,
  },
  timeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  timeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  topicsScroll: {
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  topicText: {
    color: '#FFF',
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
  },
  viewPlanButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  createPlanButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  importanceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  importanceIcon: {
    marginRight: 4,
  },
  importanceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3498DB',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    paddingTop: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 24,
    textAlign: 'left',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 16,
    color: '#2C3E50',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  importanceContainer: {
    marginBottom: 24,
  },
  importanceTitle: {
    fontSize: 16,
    color: '#34495E',
    marginBottom: 12,
    fontWeight: '600',
  },
  importanceButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  importanceButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  importanceText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButton: {
    backgroundColor: '#388E3C',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: 'bold',
  },
  datePickerButton: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  datePlaceholder: {
    color: '#94A3B8',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  inputError: {
    borderColor: '#ef476f',
  },
  errorText: {
    color: '#ef476f',
    fontSize: 12,
    marginTop: 4,
  },
  datePickerContainer: {
    marginBottom: 12,
  },
  iosDatePicker: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewPlanButton: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  viewPlanText: {
    color: '#388E3C',
    fontSize: 14,
    fontWeight: '600',
  },
  studyPlanModalContent: {
    maxHeight: '80%',
  },
  studyPlanScroll: {
    maxHeight: '70%',
    marginVertical: 16,
  },
  studyPlanText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: '#388E3C',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

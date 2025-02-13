import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, 
  Modal, TextInput, Alert, ScrollView, Platform, ActivityIndicator 
} from 'react-native';
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

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
    const daysUntilExam = Math.ceil(
      (new Date(item.examDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
      <View style={styles.examCard}>
        <View style={[styles.examBadge, { backgroundColor: getImportanceColor(item.importance) }]}>
          <Text style={styles.examBadgeText}>
            {daysUntilExam} DAYS
          </Text>
        </View>
        
        <View style={styles.examMainContent}>
          <View style={styles.examHeader}>
            <Text style={styles.examSubject}>{item.subject}</Text>
            <Text style={styles.examDate}>
              {new Date(item.examDate).toLocaleDateString('en-US')}
            </Text>
          </View>

          <View style={styles.topicsContainer}>
            {item.topics.map((topic, index) => (
              <View key={index} style={styles.topicChip}>
                <Text style={styles.topicText}>{topic}</Text>
              </View>
            ))}
          </View>

          <View style={styles.studyPlanSection}>
            {item.studyPlan.created ? (
              <TouchableOpacity 
                style={styles.viewPlanButton}
                onPress={() => {
                  setSelectedStudyPlan(item.studyPlan.plan);
                  setShowStudyPlanDetailsModal(true);
                }}
              >
                <FontAwesome5 name="book-reader" size={16} color="#FFF" />
                <Text style={styles.viewPlanText}>Study Plan</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.createPlanButton}
                onPress={() => {
                  setSelectedExam(item);
                  setShowStudyPlanModal(true);
                }}
              >
                <FontAwesome5 name="plus" size={16} color="#FFF" />
                <Text style={styles.createPlanText}>Create Plan</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
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
            <Text style={styles.modalTitle}>Add New Exam</Text>
            
            <Text style={styles.inputLabel}>Subject Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Mathematics"
              value={newExam.subject}
              onChangeText={text => setNewExam({ ...newExam, subject: text })}
            />

            {renderDatePicker()}

            <Text style={styles.inputLabel}>Topics</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter topics separated by commas"
              value={newExam.topics}
              onChangeText={text => setNewExam({ ...newExam, topics: text })}
              multiline
            />

            <View style={styles.importanceContainer}>
              <Text style={styles.importanceTitle}>Importance Level:</Text>
              <View style={styles.importanceButtons}>
                {['low', 'medium', 'high'].map((imp) => (
                  <TouchableOpacity
                    key={imp}
                    style={[
                      styles.importanceButton,
                      { 
                        backgroundColor: getImportanceColor(imp),
                        opacity: newExam.importance === imp ? 1 : 0.5
                      }
                    ]}
                    onPress={() => setNewExam({...newExam, importance: imp as any})}
                  >
                    <Text style={styles.importanceText}>
                      {imp === 'low' ? 'Low' : imp === 'medium' ? 'Medium' : 'High'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
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
          </View>
        </View>
      </Modal>

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
  examCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  examBadge: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  examBadgeText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  examMainContent: {
    flex: 1,
    padding: 16,
  },
  examHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  examSubject: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  examDate: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: '#F0F2F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  topicText: {
    fontSize: 12,
    color: '#34495E',
  },
  studyPlanSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  viewPlanButton: {
    backgroundColor: '#2ECC71',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  createPlanButton: {
    backgroundColor: '#3498DB',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  viewPlanText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createPlanText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#388E3C',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  importanceContainer: {
    marginBottom: 20,
  },
  importanceTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  importanceButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  importanceButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  importanceText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#388E3C',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
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
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  dateText: {
    color: '#333',
    fontSize: 16,
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

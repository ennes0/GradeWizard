import AsyncStorage from '@react-native-async-storage/async-storage';

export type StudyDay = {
  date: string;
  completed: boolean;
  studyHours?: number;
};

const STREAK_KEY = 'study_streak';

// ...existing code...

export const getStudyStreak = async (): Promise<StudyDay[]> => {
  try {
    const streak = await AsyncStorage.getItem(STREAK_KEY);
    const today = new Date().toISOString().split('T')[0];

    if (streak) {
      const existingStreak = JSON.parse(streak);
      // Check if we need to update the dates
      const lastDate = existingStreak[existingStreak.length - 1].date;
      
      if (lastDate !== today) {
        // Remove old dates and add new ones up to today
        const updatedStreak = existingStreak
          .filter(day => {
            const dayDate = new Date(day.date);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 6);
            return dayDate >= weekAgo;
          })
          .map(day => ({
            ...day,
            completed: day.date === today ? false : day.completed
          }));

        // Add any missing days up to today
        const lastDayInStreak = new Date(updatedStreak[updatedStreak.length - 1].date);
        const daysToAdd = [];
        const currentDate = new Date(today);

        while (lastDayInStreak < currentDate) {
          lastDayInStreak.setDate(lastDayInStreak.getDate() + 1);
          daysToAdd.push({
            date: lastDayInStreak.toISOString().split('T')[0],
            completed: false
          });
        }

        const finalStreak = [...updatedStreak, ...daysToAdd].slice(-7);
        await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(finalStreak));
        return finalStreak;
      }

      return existingStreak;
    }

    // Initialize with last 7 days including today
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i)); // Changed to make today the last day
      return {
        date: date.toISOString().split('T')[0],
        completed: false
      };
    });

    await AsyncStorage.setItem(STREAK_KEY, JSON.stringify(last7Days));
    return last7Days;
  } catch (error) {
    console.error('Error loading streak:', error);
    return [];
  }
};

export const markDayAsStudied = async (hours: number = 0): Promise<StudyDay[]> => {
  try {
    const streak = await getStudyStreak();
    const today = new Date().toISOString().split('T')[0];
    
    const updatedStreak = streak.map(day => 
      day.date === today 
        ? { ...day, completed: true, studyHours: hours } 
        : day
    );
    
    await AsyncStorage.setItem('study_streak', JSON.stringify(updatedStreak));
    return updatedStreak;
  } catch (error) {
    console.error('Error marking day as studied:', error);
    return [];
  }
};

export const getCurrentStreak = (streak: StudyDay[]): number => {
  let count = 0;
  for (let i = streak.length - 1; i >= 0; i--) {
    if (streak[i].completed) {
      count++;
    } else {
      break;
    }
  }
  return count;
};

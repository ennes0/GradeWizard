import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Genişletilmiş mesaj grupları
const messages = {
  motivation: [
    "📚 How about taking a test today?",
    "🎯 One step closer to your goals!",
    "💪 Success comes with discipline, let's study!",
    "🌟 Getting better every day!",
    "📝 Have you completed today's study?",
    "🚀 A great day to improve yourself!",
    "🎓 Another day on your success journey!",
    "⭐ You can do it, let's start!"
  ],
  streak: [
    "🔥 Keep your streak alive!",
    "⚡ Maintain your study streak!",
    "🌟 Continue your streak by studying today!",
    "💫 Keep up your regular study habit!"
  ],
  evening: [
    "📊 How was your day? Don't forget to log your studies!",
    "🌙 Time to evaluate your day, review your notes",
    "✨ Have you set your goals for tomorrow?",
    "📝 Don't forget to summarize today's work!"
  ],
  weekly: [
    "📈 Check your progress this week!",
    "🎯 Review your weekly goals",
    "📊 Your weekly performance report is ready!",
    "🌟 Evaluate your studies this week"
  ]
};

// Base notification function
async function scheduleNotification({
  title,
  body,
  trigger,
  data = {},
  sound = true
}: {
  title: string;
  body: string;
  trigger: any;
  data?: { type: string; [key: string]: any };
  sound?: boolean;
}) {
  try {
    const userPrefs = await AsyncStorage.getItem('userProfile');
    const { preferences = {} } = JSON.parse(userPrefs || '{}');
    if (!preferences.notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound,
        priority: 'high',
      },
      trigger,
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Helper function to get random message
function getRandomMessage(type: keyof typeof messages): string {
  const messageList = messages[type];
  return messageList[Math.floor(Math.random() * messageList.length)];
}

async function checkNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
}

// Main notification functions
const NotificationService = {
  setup: async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    if (!Device.isDevice) return false;
    
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  },

  registerForPushNotificationsAsync: async () => {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }
      
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    return token;
  },

  scheduleMotivationalNotification: async () => {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return;

    // Get user preferences
    const userPrefs = await AsyncStorage.getItem('userProfile');
    const { preferences = {} } = JSON.parse(userPrefs || '{}');
    if (!preferences.notifications) return;

    // Random message
    const message = getRandomMessage('motivation');

    // Schedule for tomorrow at user's preferred time (default 10:00)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    await scheduleNotification({
      title: "Grade Wizard",
      body: message,
      trigger: { date: tomorrow },
      data: { type: 'motivational' }
    });
  },

  scheduleStudyReminder: async (hours: number) => {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return;

    const trigger = new Date();
    trigger.setHours(trigger.getHours() + hours);

    await scheduleNotification({
      title: "Study Reminder",
      body: "Your planned study time is almost up! 📚",
      trigger: { date: trigger },
      data: { type: 'study_reminder' }
    });
  },

  scheduleExamReminder: async (examDate: string, examName: string) => {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return;

    const examDay = new Date(examDate);
    const oneDayBefore = new Date(examDay);
    oneDayBefore.setDate(examDay.getDate() - 1);
    oneDayBefore.setHours(9, 0, 0, 0);

    await scheduleNotification({
      title: "Exam Reminder",
      body: `You have ${examName} exam tomorrow! Good luck! 🎯`,
      trigger: { date: oneDayBefore },
      data: { type: 'exam_reminder', examName }
    });
  },

  scheduleAllNotifications: async () => {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return;

    await Promise.all([
      NotificationService.scheduleDailyMotivation(),
      NotificationService.scheduleStreakReminder(),
      NotificationService.scheduleEveningReminder(),
      NotificationService.scheduleWeeklyReview()
    ]);
  },

  scheduleDailyMotivation: async () => {
    const morning = new Date();
    morning.setHours(9, 0, 0, 0);
    
    if (morning.getTime() < Date.now()) {
      morning.setDate(morning.getDate() + 1);
    }

    await scheduleNotification({
      title: "Good Morning! 🌅",
      body: getRandomMessage('motivation'),
      trigger: { date: morning, repeats: true },
      data: { type: 'motivation' }
    });
  },

  scheduleStreakReminder: async () => {
    const afternoon = new Date();
    afternoon.setHours(14, 0, 0, 0);

    if (afternoon.getTime() < Date.now()) {
      afternoon.setDate(afternoon.getDate() + 1);
    }

    await scheduleNotification({
      title: "Study Reminder 📚",
      body: getRandomMessage('streak'),
      trigger: { date: afternoon, repeats: true },
      data: { type: 'streak' }
    });
  },

  scheduleEveningReminder: async () => {
    const evening = new Date();
    evening.setHours(20, 0, 0, 0);

    if (evening.getTime() < Date.now()) {
      evening.setDate(evening.getDate() + 1);
    }

    await scheduleNotification({
      title: "Review Your Day 🌙",
      body: getRandomMessage('evening'),
      trigger: { date: evening, repeats: true },
      data: { type: 'evening_review' }
    });
  },

  scheduleWeeklyReview: async () => {
    const sunday = new Date();
    sunday.setHours(18, 0, 0, 0);
    sunday.setDate(sunday.getDate() + (7 - sunday.getDay()));

    await scheduleNotification({
      title: "Weekly Review 📊",
      body: getRandomMessage('weekly'),
      trigger: { date: sunday, repeats: true },
      data: { type: 'weekly_review' }
    });
  },

  scheduleInactivityReminder: async (days: number = 2) => {
    const trigger = new Date();
    trigger.setDate(trigger.getDate() + days);
    trigger.setHours(12, 0, 0, 0);

    await scheduleNotification({
      title: "We Miss You! 👋",
      body: "It's been a while. How about getting back to your studies?",
      trigger: { date: trigger },
      data: { type: 'inactivity' }
    });
  },

  scheduleGradeImprovement: async (oldGrade: number, newGrade: number) => {
    if (newGrade > oldGrade) {
      await scheduleNotification({
        title: "Congratulations! 🎉",
        body: `Your grade improved from ${oldGrade} to ${newGrade}! Great progress!`,
        trigger: { seconds: 1 },
        data: { type: 'grade_improvement' }
      });
    }
  },

  scheduleQuizNotification: async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(10, 0, 0); // Her gün sabah 10'da

      
      await scheduleNotification({
        title: "New Quiz Ready! 🎯",
        body: "Your daily quiz is waiting. Ready to test your knowledge?",
        trigger: { date: tomorrow },
        data: { type: 'quiz' }
      });
    } catch (error) {
      console.error('Error scheduling quiz notification:', error);
    }
  },

  schedulePredictionNotification: async (predictedGrade: number) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Grade Prediction Update 📊",
          body: `Based on your recent performance, you could achieve ${predictedGrade}! Keep it up!`,
          data: { type: 'prediction' },
        },
        trigger: {
          seconds: 1,
        },
      });
    } catch (error) {
      console.error('Error scheduling prediction notification:', error);
    }
  },

  cancelAllNotifications: async () => {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }
};

export default NotificationService;

// Type definitions
export type NotificationServiceType = typeof NotificationService;

import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AnimatedTabBar from "../components/AnimatedTabBar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, scheduleMotivationalNotification } from '../services/NotificationService';

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);


  // Check if we're in onboarding or user setup
  const isInSetupFlow = segments[0] === 'onboarding' || segments[0] === 'user-setup';

  useEffect(() => {
    checkOnboarding();
  }, []);

const checkOnboarding = async () => {
  try {
    const [hasSeenOnboarding, userProfile] = await Promise.all([
      AsyncStorage.getItem('hasSeenOnboarding'),
      AsyncStorage.getItem('userProfile')
    ]);

    if (!hasSeenOnboarding) {

      return router.replace('/onboarding');
    } 
    
    if (!userProfile) {
      return router.replace('/user-setup');
    }

    return router.replace('/(tabs)/Home');

  } catch (error) {
    console.error('Error checking status:', error);
    router.replace('/onboarding');
  } finally {
    setIsLoading(false);
  }
};


  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    router.replace('/onboarding');
  };

  useEffect(() => {
    registerForPushNotificationsAsync();
    
    // Handle received notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      const { type } = notification.request.content.data;
      // Handle different notification types
      switch(type) {
        case 'motivational':
          // Maybe update stats or streak
          break;
        case 'study_reminder':
          // Maybe show study timer
          break;
        case 'exam_reminder':
          // Maybe show exam details
          break;
      }
    });

    // Handle notification response
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const { type } = response.notification.request.content.data;
      // Navigate based on notification type
      switch(type) {
        case 'motivational':
          router.push('/(tabs)/GradePrediction');
          break;
        case 'study_reminder':
          router.push('/(tabs)/Home');
          break;
        case 'exam_reminder':
          router.push('/(tabs)/exams/exams');
          break;
      }
    });

    // Schedule daily motivation
    scheduleMotivationalNotification();

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  if (isLoading) {
    return null;
  }

  const tabs = [
    { label: "Home", icon: "home", route: "../Home" },
    { label: "Gizard", icon: "magic", route: "../GradePrediction" }, // Changed from hat-wizard to magic
    { label: "Exams", icon: "calendar", route: "../exams/exams" },
    { label: "Quiz", icon: "book", route: "../quiz" },
    { label: "Profile", icon: "user", route: "../profile" },
  ];

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E8F5E9',
          },
          headerTintColor: '#388E3C',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          gestureEnabled: false, // Disable swipe gesture
          animation: 'none', // Disable animation
        }}
      >
        <Stack.Screen
          name="onboarding"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="user-setup"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Home"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
       
        <Stack.Screen
          name="quiz"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="grades"
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
      {/* Only show TabBar when not in onboarding or user setup */}
      {!isInSetupFlow && <AnimatedTabBar tabs={tabs} />}
    </>
  );
}

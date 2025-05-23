import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AnimatedTabBar from "../components/AnimatedTabBar";
import * as Notifications from "expo-notifications";

// Temel notification handler ayarı
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Layout() {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);

  const isInSetupFlow = segments[0] === "onboarding" || segments[0] === "user-setup";

  useEffect(() => {
    checkOnboarding();
    checkNotificationPermissions(); // Sadece izin kontrolü
  }, []);

  const checkNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
  };

  const checkOnboarding = async () => {
    try {
      const [hasSeenOnboarding, userProfile] = await Promise.all([
        AsyncStorage.getItem("hasSeenOnboarding"),
        AsyncStorage.getItem("userProfile"),
      ]);

      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
      } else if (!userProfile) {
        router.replace("/user-setup");
      } else {
        router.replace("/(tabs)/Home");
      }
    } catch (error) {
      console.error("Error checking status:", error);
      router.replace("/onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Slot />;
  }

  const tabs = [
    { label: "Home", icon: "home", route: "../Home" },
    { label: "Gizard", icon: "magic", route: "../GradePrediction" },
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
            backgroundColor: "#E8F5E9",
          },
          headerTintColor: "#388E3C",
          headerTitleStyle: {
            fontWeight: "bold",
          },
          headerShadowVisible: false,
          gestureEnabled: false,
          animation: "none",
        }}
      >
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="user-setup" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="Home" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="profile" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="quiz" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="grades" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="adtest" options={{ headerShown: false, gestureEnabled: false }} />
      </Stack>
      {!isInSetupFlow && <AnimatedTabBar tabs={tabs} />}
    </>
  );
}
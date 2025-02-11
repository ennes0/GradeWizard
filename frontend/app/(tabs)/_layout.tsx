import React, { Children, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import AnimatedTabBar from "../../components/AnimatedTabBar";
import { useRouter } from "expo-router";

export default function TabLayout() {
  const router = useRouter();

  function push(route: string) {
    router.push(route);
  }

  const tabs = [
    { label: "Home", icon: "home", route: "../Home" },
    { label: "Kaç Alırım", icon: "question", route: "../GradePrediction" },
    { label: "Sınavlar", icon: "calendar", route: "../exams/exams" },
    { label: "Quiz", icon: "brain", route: "../quiz" },  // Add this line
    { label: "Profil", icon: "user", route: "../profile" },
  ];

  return (
    <View style={styles.container}>
      <Tabs
      initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#E8F5E9',
            height: 80,
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
            color: '#388E3C',
          },
          headerTitleAlign: 'center',
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            title: "",
            headerLeft: () => (
              <FontAwesome5 
                name="graduation-cap" 
                size={24} 
                color="#388E3C" 
                style={{marginLeft: 15}}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="GradePrediction"
          options={{
            title: "",
            headerLeft: () => (
              <FontAwesome5 
                name="chart-line" 
                size={24} 
                color="#388E3C" 
                style={{marginLeft: 15}}
              />
            ),
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  // Use replace instead of push
                  router.replace({
                    pathname: '/(tabs)/GradePrediction/disclaimer',
                    params: { timestamp: Date.now() }
                  });
                }}
                style={{marginRight: 15}}
              >
                <FontAwesome5 
                  name="info-circle" 
                  size={24} 
                  color="#388E3C" 
                />
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "",
            headerLeft: () => (
              <FontAwesome5 
                name="user-graduate" 
                size={24} 
                color="#388E3C" 
                style={{marginLeft: 15}}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="exams"
          options={{
            title: "",
            headerLeft: () => (
              <FontAwesome5 
                name="" 
                size={24} 
                color="#388E3C" 
                style={{marginLeft: 15}}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="quiz"
          options={{
            title: "",
            headerLeft: () => (
              <FontAwesome5 
                name="lightbulb" 
                size={24} 
                color="#388E3C" 
                style={{marginLeft: 15}}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flex: 1,
  },
});

import React, { useRef } from "react";
import {
  Text,
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import { FontAwesome as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");
export const tabHeight = 104;

const AnimatedTabBar = ({ tabs }) => {
  const router = useRouter(); // Expo Router'dan yönlendirme için kullanılıyor
  const value = useRef(new Animated.Value(0)).current;
  const values = useRef(tabs.map((_, index) => new Animated.Value(index === 0 ? 1 : 0))).current;

  const handlePress = (index) => {
    const tabWidth = width / tabs.length;

    Animated.sequence([
      ...values.map((v) =>
        Animated.timing(v, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        })
      ),
      Animated.parallel([
        Animated.spring(values[index], {
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.spring(value, {
          toValue: -width + tabWidth * index,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Tab tıklamasında yönlendirme yapılır
    router.push(tabs[index].route);
  };

  const tabWidth = width / tabs.length;

  return (
    <View style={styles.container}>
      {tabs.map((tab, key) => {
        const opacity = value.interpolate({
          inputRange: [
            -width + tabWidth * (key - 1),
            -width + tabWidth * key,
            -width + tabWidth * (key + 1),
          ],
          outputRange: [1, 0, 1],
          extrapolate: "clamp",
        });

        const translateY = values[key].interpolate({
          inputRange: [0, 1],
          outputRange: [tabHeight, 0],
          extrapolate: "clamp",
        });

        const opacity1 = values[key].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 1],
          extrapolate: "clamp",
        });

        const opacity2 = values[key].interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, 0.5, 1],
          extrapolate: "clamp",
        });

        return (
          <React.Fragment key={key}>
            <TouchableWithoutFeedback onPress={() => handlePress(key)}>
              <Animated.View style={[styles.tab, { opacity }]}>
                <Icon name={tab.icon} color="black" size={25} />
                <Text>{tab.label}</Text>
              </Animated.View>
            </TouchableWithoutFeedback>
            <Animated.View
              style={{
                position: "absolute",
                top: -8,
                left: tabWidth * key,
                width: tabWidth,
                height: tabHeight,
                justifyContent: "center",
                alignItems: "center",
                opacity: opacity1,
                transform: [{ translateY }],
              }}
            >
              <Animated.View style={[styles.circle, { opacity: opacity2 }]}>
                <Icon name={tab.icon} color="black" size={20} />
              </Animated.View>
            </Animated.View>
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#f8f8f8",
    elevation: 4,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tab: {
    flex: 1,
    height: tabHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  circle: {
    backgroundColor: "#E8F5E9",
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#C8E6C9",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    transform: [{ scale: 1.1 }], // Slightly larger circle
  },
});

export default AnimatedTabBar; // Ensure default export

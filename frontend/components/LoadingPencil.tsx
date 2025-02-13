import React from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

export const LoadingPencil = () => {
  const rotateAnimation = new Animated.Value(0);
  const strokeAnimation = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rotateAnimation, {
            toValue: 1,
            duration: 3000,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(rotateAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ]),
        Animated.sequence([
          Animated.timing(strokeAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(strokeAnimation, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true
          })
        ])
      ])
    ).start();
  }, []);

  const rotate = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const strokeDash = strokeAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [351.86, 150.8]
  });

  return (
    <View style={styles.container}>
      <Svg width={100} height={100} viewBox="0 0 200 200">
        <AnimatedG style={{ transform: [{ rotate }] }}>
          {/* Pencil Body */}
          <AnimatedPath
            d="M 100 100 L 120 80 L 140 100 L 120 120 Z"
            fill="#388E3C"
            stroke="#2E7D32"
            strokeWidth={2}
            strokeDasharray={351.86}
            strokeDashoffset={strokeDash}
          />
          {/* Pencil Point */}
          <Path
            d="M 140 100 L 150 100"
            stroke="#2E7D32"
            strokeWidth={4}
            strokeLinecap="round"
          />
          {/* Pencil Eraser */}
          <Path
            d="M 100 100 L 90 100"
            stroke="#EF5350"
            strokeWidth={8}
            strokeLinecap="round"
          />
        </AnimatedG>
      </Svg>
      <Text style={styles.loadingText}>Çalışma planı hazırlanıyor...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#388E3C',
    fontWeight: '600',
  }
});

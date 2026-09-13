import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

const COLORS = ['#FF4B4B', '#58CC02', '#1CB0F6', '#FFC800', '#CE82FF', '#FF9600'];
const PARTICLE_COUNT = 26;

function ConfettiPiece({ delay }: { delay: number }) {
  const anim = useRef(new Animated.Value(0)).current;
  const color = useMemo(() => COLORS[Math.floor(Math.random() * COLORS.length)], []);
  const left = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => 6 + Math.random() * 6, []);
  const rotateStart = useMemo(() => Math.random() * 360, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 120, []);
  const fallDistance = useMemo(() => 420 + Math.random() * 200, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 1600 + Math.random() * 900,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-20, fallDistance] });
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, drift] });
  const rotate = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${rotateStart}deg`, `${rotateStart + 360}deg`],
  });
  const opacity = anim.interpolate({ inputRange: [0, 0.75, 1], outputRange: [1, 1, 0] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${left}%`,
        top: 0,
        width: size,
        height: size * 1.6,
        borderRadius: 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }, { translateX }, { rotate }],
      }}
    />
  );
}

export function ConfettiBurst() {
  const particles = useMemo(() => Array.from({ length: PARTICLE_COUNT }), []);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((_, i) => (
        <ConfettiPiece key={i} delay={i * 25} />
      ))}
    </View>
  );
}

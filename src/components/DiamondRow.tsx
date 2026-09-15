import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

const MAX_LIVES = 5;

/** The 5-diamond life display used both in a lesson's header and while recovering them. */
export function DiamondRow({ lives }: { lives: number }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const shake = useRef(new Animated.Value(0)).current;
  const prevLives = useRef(lives);

  useEffect(() => {
    if (lives < prevLives.current) {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
      ]).start();
    }
    prevLives.current = lives;
  }, [lives, shake]);

  const translateX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-4, 4] });

  return (
    <Animated.View style={[styles.row, { transform: [{ translateX }] }]}>
      {Array.from({ length: MAX_LIVES }, (_, i) => (
        <Text key={i} style={i < lives ? styles.diamondFull : styles.diamondLost}>
          💎
        </Text>
      ))}
    </Animated.View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 3 },
    diamondFull: { fontSize: 18 },
    diamondLost: { fontSize: 18, opacity: 0.2 },
  });
}

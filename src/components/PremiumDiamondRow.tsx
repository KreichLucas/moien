import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { authColors } from '../screens/authStyles';

const MAX_LIVES = 5;

/**
 * The 5-life indicator for the premium lesson header — same shake-on-loss
 * animation and 5-lives logic as `DiamondRow`, just restyled with vector
 * icons instead of emoji. Kept as its own component (not a `DiamondRow`
 * edit) because `DiamondRow` is still used as-is by `DiamondRecoveryScreen`,
 * which this redesign doesn't touch.
 */
export function PremiumDiamondRow({ lives }: { lives: number }) {
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
        <Ionicons
          key={i}
          name={i < lives ? 'diamond' : 'diamond-outline'}
          size={18}
          color={i < lives ? authColors.accentCyan : authColors.textMuted}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4 },
});

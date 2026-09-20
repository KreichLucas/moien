import React from 'react';
import { StyleSheet, View } from 'react-native';
import { authColors } from '../screens/authStyles';

/**
 * Segmented dot progress bar for the lesson screen — one dot per exercise
 * in the session, filled up to `current`. Driven entirely by the real
 * `total` (never hardcoded), so it renders correctly for any lesson
 * regardless of how many exercises it actually has.
 */
export function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={[styles.dot, i < current && styles.dotFilled]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'center' },
  dot: {
    width: 20,
    height: 6,
    borderRadius: 3,
    backgroundColor: authColors.inputBorder,
  },
  dotFilled: { backgroundColor: authColors.accentCyan },
});

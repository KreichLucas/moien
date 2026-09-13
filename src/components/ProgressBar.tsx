import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

export function ProgressBar({ current, total }: { current: number; total: number }) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    track: {
      flex: 1,
      height: 14,
      borderRadius: 7,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    fill: {
      height: '100%',
      backgroundColor: colors.primary,
      borderRadius: 7,
    },
  });
}

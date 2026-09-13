import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, useTheme } from '../theme/theme';

type NodeStatus = 'locked' | 'unlocked' | 'completed';

export function LessonNode({
  title,
  status,
  icon,
  onPress,
}: {
  title: string;
  status: NodeStatus;
  icon?: string;
  onPress: () => void;
}) {
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const backgroundColor =
    status === 'completed' ? colors.primary : status === 'unlocked' ? colors.accent : colors.locked;

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={[styles.circle, { backgroundColor }]}
        disabled={status === 'locked'}
        onPress={onPress}
      >
        <Text style={styles.icon}>
          {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : icon ?? '★'}
        </Text>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: { alignItems: 'center', marginVertical: 10 },
    circle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 5,
      borderBottomColor: 'rgba(0,0,0,0.15)',
    },
    icon: { fontSize: 28, color: '#fff' },
    title: { marginTop: 6, fontSize: 13, fontWeight: '600', color: colors.text },
  });
}

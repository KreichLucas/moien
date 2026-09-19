import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAchievementsStatus } from '../content/achievements';
import { units } from '../content/units';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AchievementsScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const achievements = useMemo(() => getAchievementsStatus(progress, units), [progress]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => pressedStyle(pressed)}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Conquistas</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Text style={styles.count}>
        {unlockedCount}/{achievements.length} desbloqueadas
      </Text>

      <View style={styles.badgeGrid}>
        {achievements.map((a) => (
          <View key={a.id} style={[styles.badge, a.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
            <Text style={styles.badgeIcon}>{a.unlocked ? a.icon : '🔒'}</Text>
            <Text style={styles.badgeTitle} numberOfLines={2}>
              {a.title}
            </Text>
            <Text style={styles.badgeDescription} numberOfLines={2}>
              {a.description}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingTop: 60, paddingBottom: 60 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    close: { fontSize: 22, color: colors.textSecondary, fontWeight: '600' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
    headerSpacer: { width: 22 },
    count: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: 16 },
    badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    badge: {
      width: '31%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    badgeUnlocked: { borderColor: colors.primary, backgroundColor: colors.correctBg, ...cardShadow(colors) },
    badgeLocked: { opacity: 0.5 },
    badgeIcon: { fontSize: 26, marginBottom: 6 },
    badgeTitle: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
    badgeDescription: { fontSize: 9, color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
  });
}

import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getAchievementsStatus } from '../content/achievements';
import { getLevelProgress } from '../content/levels';
import { units } from '../content/units';
import { computeCourseMetrics } from '../learning/metrics';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const totalLessons = units.flatMap((u) => u.lessons).length;
  const levelProgress = getLevelProgress(units, progress.completedLessonIds);
  const achievements = useMemo(() => getAchievementsStatus(progress, units), [progress]);
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const metrics = useMemo(
    () => computeCourseMetrics(units, progress.completedLessonIds, progress.itemMastery, new Date().toISOString()),
    [progress.completedLessonIds, progress.itemMastery]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable
        style={({ pressed }) => [styles.settingsButton, pressedStyle(pressed)]}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </Pressable>

      <Text style={styles.avatar}>🧑‍🎓</Text>
      <Text style={styles.title}>Seu progresso</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>⭐ {progress.xp}</Text>
          <Text style={styles.statLabel}>XP total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>🔥 {progress.streak}</Text>
          <Text style={styles.statLabel}>Dias seguidos</Text>
        </View>
      </View>

      <View style={styles.statCardFull}>
        <Text style={styles.statValue}>
          {progress.completedLessonIds.length} / {totalLessons}
        </Text>
        <Text style={styles.statLabel}>Lições completas</Text>
      </View>

      <View style={styles.statCardFull}>
        <Text style={styles.statValue}>{levelProgress.level}</Text>
        <Text style={styles.statLabel}>
          {levelProgress.isMaxLevel ? 'Nível máximo alcançado' : 'Nível atual em progresso'}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Domínio do idioma</Text>
      </View>
      <Text style={styles.sectionHint}>
        Diferente do progresso do curso — mostra o que você realmente sabe e está mantendo.
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics.vocabularyMasteryPct}%</Text>
          <Text style={styles.statLabel}>Vocabulário dominado</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{metrics.retentionHealthPct}%</Text>
          <Text style={styles.statLabel}>Saúde de retenção</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Conquistas</Text>
        <Text style={styles.sectionCount}>
          {unlockedCount}/{achievements.length}
        </Text>
      </View>
      <View style={styles.badgeGrid}>
        {achievements.map((a) => (
          <View key={a.id} style={[styles.badge, a.unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
            <Text style={styles.badgeIcon}>{a.unlocked ? a.icon : '🔒'}</Text>
            <Text style={styles.badgeTitle} numberOfLines={2}>
              {a.title}
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
    content: { padding: 20, alignItems: 'center', paddingBottom: 60 },
    settingsButton: { position: 'absolute', top: 20, right: 20, padding: 4 },
    settingsIcon: { fontSize: 22 },
    avatar: { fontSize: 64, marginTop: 20 },
    title: { fontSize: 22, fontWeight: '800', color: colors.text, marginVertical: 16 },
    statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
    statCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      ...cardShadow(colors),
    },
    statCardFull: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginTop: 12,
      ...cardShadow(colors),
    },
    statValue: { fontSize: 24, fontWeight: '800', color: colors.text },
    statLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    sectionHeader: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 28,
      marginBottom: 12,
    },
    sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
    sectionHint: { width: '100%', fontSize: 12, color: colors.textSecondary, marginTop: -8, marginBottom: 12 },
    sectionCount: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
    badgeGrid: {
      width: '100%',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    badge: {
      width: '31%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 6,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    badgeUnlocked: {
      borderColor: colors.primary,
      backgroundColor: colors.correctBg,
      ...cardShadow(colors),
    },
    badgeLocked: { opacity: 0.5 },
    badgeIcon: { fontSize: 26, marginBottom: 6 },
    badgeTitle: { fontSize: 11, fontWeight: '700', color: colors.text, textAlign: 'center' },
  });
}

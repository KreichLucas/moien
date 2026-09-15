import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LessonStartModal } from '../components/LessonStartModal';
import { buildPathUnits } from '../content/path';
import { units } from '../content/units';
import { EXERCISE_INDEX, ITEM_REGISTRY } from '../learning/registry';
import { buildDueReviewLesson, DYNAMIC_REVIEW_LESSON_ID, practiceReadyItemIds, setCachedReviewLesson } from '../learning/reviewSession';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { ThemeColors, cardShadow, pressedStyle, useTheme } from '../theme/theme';
import { Lesson } from '../types/content';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function PracticeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const colors = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const now = new Date().toISOString();
  // Outright mistakes (pendingReviewItemIds) plus whatever's due for spaced
  // reinforcement — see practiceReadyItemIds for why a mistake needs its
  // own explicit flag instead of relying on isDue alone.
  const dueCount = useMemo(
    () => practiceReadyItemIds(progress.itemMastery, progress.pendingReviewItemIds, ITEM_REGISTRY, now).length,
    [progress.itemMastery, progress.pendingReviewItemIds]
  );

  const pathUnits = useMemo(() => buildPathUnits(units), []);
  const practiceableUnits = pathUnits
    .map((unit) => ({
      ...unit,
      lessons: unit.lessons.filter((l) => progress.completedLessonIds.includes(l.id)),
    }))
    .filter((unit) => unit.lessons.length > 0);

  const startDueReview = () => {
    const lesson = buildDueReviewLesson(progress.itemMastery, progress.pendingReviewItemIds, ITEM_REGISTRY, EXERCISE_INDEX, now);
    if (!lesson) return;
    setCachedReviewLesson(lesson);
    navigation.navigate('Lesson', { lessonId: DYNAMIC_REVIEW_LESSON_ID });
  };

  const handleStart = () => {
    if (!selectedLesson) return;
    const lessonId = selectedLesson.id;
    setSelectedLesson(null);
    navigation.navigate('Lesson', { lessonId });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Revisão</Text>
      <Text style={styles.subtitle}>Pratique o que está enfraquecendo antes de aprender coisa nova.</Text>

      <View style={styles.dueCard}>
        <Text style={styles.dueIcon}>{dueCount > 0 ? '🔥' : '✅'}</Text>
        <View style={styles.dueTextWrap}>
          <Text style={styles.dueTitle}>
            {dueCount > 0 ? `${dueCount} ${dueCount === 1 ? 'item pronto' : 'itens prontos'} para revisar` : 'Tudo em dia!'}
          </Text>
          <Text style={styles.dueSubtitle}>
            {dueCount > 0
              ? 'Uma sessão rápida focada no que você está esquecendo.'
              : 'Nenhuma palavra está atrasada para revisão agora.'}
          </Text>
        </View>
      </View>

      {dueCount > 0 && (
        <Pressable style={({ pressed }) => [styles.primaryButton, pressedStyle(pressed)]} onPress={startDueReview}>
          <Text style={styles.primaryButtonText}>PRATICAR AGORA</Text>
        </Pressable>
      )}

      <Text style={styles.sectionLabel}>Rever uma lição específica</Text>

      {practiceableUnits.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🏋️</Text>
          <Text style={styles.emptyText}>Complete lições na trilha para poder praticá-las aqui.</Text>
        </View>
      ) : (
        practiceableUnits.map((unit) => (
          <View key={unit.id} style={styles.unitBlock}>
            <Text style={styles.unitTitle}>
              {unit.isReview ? '🔁 ' : ''}
              {unit.title}
            </Text>
            <View style={styles.lessonGrid}>
              {unit.lessons.map((lesson) => (
                <Pressable
                  key={lesson.id}
                  style={({ pressed }) => [styles.lessonCard, pressedStyle(pressed)]}
                  onPress={() => setSelectedLesson(lesson)}
                >
                  <Text style={styles.lessonIcon}>✓</Text>
                  <Text style={styles.lessonTitle} numberOfLines={2}>
                    {lesson.title}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}

      <LessonStartModal
        visible={!!selectedLesson}
        title={selectedLesson?.title ?? ''}
        isCompleted
        onStart={handleStart}
        onClose={() => setSelectedLesson(null)}
      />
    </ScrollView>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 20, paddingBottom: 60 },
    title: { fontSize: 24, fontWeight: '800', color: colors.text },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4, marginBottom: 20 },
    dueCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      ...cardShadow(colors),
    },
    dueIcon: { fontSize: 28 },
    dueTextWrap: { flex: 1 },
    dueTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    dueSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: 'center',
      marginBottom: 28,
      ...cardShadow(colors),
    },
    primaryButtonText: { color: colors.buttonTextOnPrimary, fontWeight: '700', fontSize: 16, letterSpacing: 0.5 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.textSecondary,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 14,
    },
    emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
    emptyIcon: { fontSize: 48, marginBottom: 12 },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
    unitBlock: { marginBottom: 24 },
    unitTitle: { fontSize: 16, fontWeight: '800', color: colors.text, marginBottom: 10 },
    lessonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    lessonCard: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      alignItems: 'flex-start',
      ...cardShadow(colors),
    },
    lessonIcon: {
      fontSize: 16,
      color: colors.buttonTextOnPrimary,
      backgroundColor: colors.primary,
      width: 26,
      height: 26,
      borderRadius: 13,
      textAlign: 'center',
      lineHeight: 26,
      overflow: 'hidden',
      marginBottom: 8,
    },
    lessonTitle: { fontSize: 13, fontWeight: '700', color: colors.text },
  });
}

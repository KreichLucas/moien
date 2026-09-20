import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { OpaqueDropdown } from '../components/OpaqueDropdown';
import { EXERCISE_INDEX, ITEM_REGISTRY } from '../learning/registry';
import { buildDueReviewLesson, DYNAMIC_REVIEW_LESSON_ID, setCachedReviewLesson } from '../learning/reviewSession';
import { RootStackParamList } from '../navigation/types';
import { useProgress } from '../state/ProgressContext';
import { MAX_DIAMONDS } from '../state/progressStorage';
import { authColors, fontFamilies } from './authStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type SortMode = 'recent' | 'alpha';

function speak(text: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'lb-LU';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

export function PracticeScreen() {
  const navigation = useNavigation<Nav>();
  const { progress } = useProgress();
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const words = useMemo(() => {
    return progress.pendingReviewItemIds
      .map((itemId) => {
        const item = ITEM_REGISTRY.items[itemId];
        if (!item) return null;
        return { id: itemId, lu: item.displayLu, pt: item.displayPt, lastSeenAt: progress.itemMastery[itemId]?.lastSeenAt ?? '' };
      })
      .filter((w): w is NonNullable<typeof w> => w !== null);
  }, [progress.pendingReviewItemIds, progress.itemMastery]);

  const sortedWords = useMemo(
    () =>
      [...words].sort((a, b) => (sortMode === 'recent' ? b.lastSeenAt.localeCompare(a.lastSeenAt) : a.lu.localeCompare(b.lu))),
    [words, sortMode]
  );

  const pendingCount = words.length;
  const hasPending = pendingCount > 0;
  const clearedInCycle = progress.diamondRecoveryCleared;
  const cycleTotal = clearedInCycle + pendingCount;
  const cyclePct = cycleTotal > 0 ? Math.round((clearedInCycle / cycleTotal) * 100) : 100;
  const showCycleProgress = progress.diamonds < MAX_DIAMONDS && cycleTotal > 0;

  const startPractice = () => {
    const lesson = buildDueReviewLesson(progress.itemMastery, progress.pendingReviewItemIds, ITEM_REGISTRY, EXERCISE_INDEX, new Date().toISOString());
    if (!lesson) return;
    setCachedReviewLesson(lesson);
    navigation.navigate('Lesson', { lessonId: DYNAMIC_REVIEW_LESSON_ID });
  };

  return (
    <View style={styles.page}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconWrap}>
            <Ionicons name="locate" size={26} color={authColors.accentCyan} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={styles.pageTitle}>Prática</Text>
            <Text style={styles.pageSubtitle}>
              Revise todas as palavras que você errou e recupere seus diamantes para continuar aprendendo!
            </Text>
          </View>
        </View>

        <View style={[styles.topCard, isNarrow && styles.topCardNarrow]}>
          <View style={styles.diamondsBlock}>
            <Text style={styles.blockLabel}>SEUS DIAMANTES</Text>
            <View style={styles.diamondsRow}>
              {Array.from({ length: MAX_DIAMONDS }, (_, i) => (
                <Ionicons
                  key={i}
                  name={i < progress.diamonds ? 'diamond' : 'diamond-outline'}
                  size={30}
                  color={i < progress.diamonds ? authColors.accentCyan : authColors.textMuted}
                />
              ))}
            </View>
            <Text style={styles.diamondsCaption}>
              {progress.diamonds} de {MAX_DIAMONDS} disponíveis
            </Text>
          </View>

          {!isNarrow && <View style={styles.topCardDivider} />}

          <View style={styles.ctaBlock}>
            <View style={styles.ctaIconWrap}>
              <Ionicons name="diamond" size={28} color={authColors.accentCyan} />
            </View>
            <View style={styles.ctaTextWrap}>
              <Text style={styles.ctaTitle}>{hasPending ? 'Complete sua prática' : 'Tudo em dia!'}</Text>
              <Text style={styles.ctaSubtitle}>
                {hasPending
                  ? `Você tem ${pendingCount} ${pendingCount === 1 ? 'palavra' : 'palavras'} para revisar. Finalize todas para recuperar seu diamante e voltar a ${MAX_DIAMONDS} diamantes.`
                  : 'Nenhuma palavra pendente no momento. Continue aprendendo e volte aqui se errar alguma coisa.'}
              </Text>
              {hasPending && (
                <Pressable style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]} onPress={startPractice}>
                  <Text style={styles.ctaButtonText}>Começar prática</Text>
                  <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {showCycleProgress && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressTitle}>Seu progresso na prática</Text>
              <Text style={styles.progressStat}>
                {clearedInCycle} de {cycleTotal} concluídos ({cyclePct}%)
              </Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${cyclePct}%` }]} />
            </View>
          </View>
        )}

        <View style={styles.listCard}>
          <View style={[styles.listHeaderRow, isNarrow && styles.listHeaderRowNarrow]}>
            <Text style={styles.listTitle}>Palavras para revisar ({pendingCount})</Text>
            {hasPending && (
              <OpaqueDropdown
                value={sortMode === 'recent' ? 'Mais recentes' : 'Ordem alfabética'}
                options={['Mais recentes', 'Ordem alfabética']}
                onChange={(v) => setSortMode(v === 'Mais recentes' ? 'recent' : 'alpha')}
              />
            )}
          </View>

          {hasPending ? (
            <View style={styles.wordGrid}>
              {sortedWords.map((w) => (
                <View key={w.id} style={styles.wordCard}>
                  <Pressable style={styles.wordAudioButton} onPress={() => speak(w.lu)} hitSlop={6}>
                    <Ionicons name="volume-medium" size={18} color={authColors.accentCyan} />
                  </Pressable>
                  <View style={styles.wordTextWrap}>
                    <Text style={styles.wordLu} numberOfLines={1}>
                      {w.lu}
                    </Text>
                    <Text style={styles.wordPt} numberOfLines={1}>
                      {w.pt}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle" size={36} color="#22C55E" />
              <Text style={styles.emptyStateText}>Nenhuma palavra pendente para revisar agora.</Text>
            </View>
          )}
        </View>

        <View style={[styles.footerRow, isNarrow && styles.footerRowNarrow]}>
          <View style={styles.footerCard}>
            <View style={styles.footerIconWrap}>
              <Ionicons name="leaf" size={22} color="#4ADE80" />
            </View>
            <View style={styles.footerTextWrap}>
              <Text style={styles.footerTitle}>Pratique e evolua!</Text>
              <Text style={styles.footerSubtitle}>
                Quanto mais você pratica, mais rápido recupera seus diamantes e fixa o conteúdo no seu dia a dia.
              </Text>
            </View>
          </View>
          {!isNarrow && <View style={styles.footerDivider} />}
          <View style={styles.footerCard}>
            <View style={styles.footerIconWrap}>
              <Ionicons name="stats-chart" size={20} color={authColors.accentCyan} />
            </View>
            <View style={styles.footerTextWrap}>
              <Text style={styles.footerTitle}>Errou hoje?</Text>
              <Text style={styles.footerSubtitle}>Revisar suas palavras é o primeiro passo para não errar de novo!</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg },
  scroll: { flex: 1 },
  content: { padding: 28, paddingBottom: 60 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  headerIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: { flex: 1 },
  pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 28, color: authColors.textPrimary },
  pageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 13.5, color: authColors.textSecondary, marginTop: 4, lineHeight: 19 },

  topCard: {
    flexDirection: 'row',
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
    gap: 24,
  },
  topCardNarrow: { flexDirection: 'column' },
  topCardDivider: { width: 1, backgroundColor: authColors.divider },

  diamondsBlock: { flex: 1, minWidth: 220 },
  blockLabel: { fontFamily: fontFamilies.displayBold, fontSize: 13, color: authColors.textPrimary, letterSpacing: 0.5, marginBottom: 16 },
  diamondsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  diamondsCaption: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },

  ctaBlock: {
    flex: 1.3,
    minWidth: 260,
    flexDirection: 'row',
    gap: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 18,
    padding: 18,
  },
  ctaIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaTextWrap: { flex: 1 },
  ctaTitle: { fontFamily: fontFamilies.displayBold, fontSize: 16, color: authColors.textPrimary },
  ctaSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 6, lineHeight: 18 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: authColors.accentCyan,
    borderRadius: 14,
    paddingVertical: 14,
  },
  ctaButtonPressed: { opacity: 0.85 },
  ctaButtonText: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: '#FFFFFF' },

  progressCard: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  progressHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 6 },
  progressTitle: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: authColors.textPrimary },
  progressStat: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.accentCyan },
  progressBarTrack: { height: 10, borderRadius: 5, backgroundColor: authColors.inputBg, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 5, backgroundColor: authColors.accentCyan },

  listCard: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  listHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 10 },
  listHeaderRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
  listTitle: { fontFamily: fontFamilies.displayBold, fontSize: 15, color: authColors.textPrimary },

  wordGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  wordCard: {
    flexBasis: 220,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 14,
    padding: 14,
  },
  wordAudioButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordTextWrap: { flex: 1 },
  wordLu: { fontFamily: fontFamilies.displayBold, fontSize: 14.5, color: authColors.textPrimary },
  wordPt: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 2 },

  emptyState: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyStateText: { fontFamily: fontFamilies.displayRegular, fontSize: 13.5, color: authColors.textSecondary },

  footerRow: { flexDirection: 'row', backgroundColor: authColors.cardBg, borderWidth: 1, borderColor: authColors.cardBorder, borderRadius: 20, padding: 22, gap: 22 },
  footerRowNarrow: { flexDirection: 'column' },
  footerCard: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  footerDivider: { width: 1, backgroundColor: authColors.divider },
  footerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: authColors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerTextWrap: { flex: 1 },
  footerTitle: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary },
  footerSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 4, lineHeight: 18 },
});

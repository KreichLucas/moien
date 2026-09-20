import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions, StyleSheet } from 'react-native';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { PhotoConsentModal } from '../components/PhotoConsentModal';
import { UserAvatar } from '../components/UserAvatar';
import { getLevelProgress } from '../content/levels';
import { units } from '../content/units';
import { computeCourseMetrics } from '../learning/metrics';
import { ITEM_REGISTRY } from '../learning/registry';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../state/AuthContext';
import { useProgress } from '../state/ProgressContext';
import { pickAndResizeProfilePhoto } from '../utils/pickProfilePhoto';
import { authColors, fontFamilies } from './authStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MODULE_PILL_COLORS = [
  { bg: 'rgba(56, 189, 248, 0.16)', text: '#7DD3FC', border: 'rgba(56, 189, 248, 0.35)' },
  { bg: 'rgba(167, 139, 250, 0.16)', text: '#C4B5FD', border: 'rgba(167, 139, 250, 0.35)' },
  { bg: 'rgba(52, 211, 153, 0.16)', text: '#6EE7B7', border: 'rgba(52, 211, 153, 0.35)' },
  { bg: 'rgba(251, 146, 60, 0.16)', text: '#FDBA74', border: 'rgba(251, 146, 60, 0.35)' },
  { bg: 'rgba(244, 114, 182, 0.16)', text: '#F9A8D4', border: 'rgba(244, 114, 182, 0.35)' },
];

const ALL_LEVELS = 'Todos os níveis';
const ALL_MODULES = 'Todos os módulos';

type SortMode = 'recent' | 'alpha';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function speak(text: string) {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'lb-LU';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}

/** Small "pick one from a list" pill — same absolute-dropdown interaction already used for the profile menu on the Dashboard. */
function Dropdown({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropdownWrap}>
      <Pressable style={styles.dropdownButton} onPress={() => setOpen((o) => !o)}>
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={authColors.textSecondary} />
      </Pressable>
      {open && (
        <View style={styles.dropdownMenu}>
          <ScrollView style={styles.dropdownMenuScroll}>
            {options.map((opt) => (
              <Pressable
                key={opt}
                style={styles.dropdownMenuItem}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
              >
                <Text style={[styles.dropdownMenuItemText, opt === value && styles.dropdownMenuItemTextActive]}>{opt}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function StatCard({ icon, color, value, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; value: string | number; label: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: `${color}22` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MasteryCard({ icon, color, pct, label }: { icon: keyof typeof Ionicons.glyphMap; color: string; pct: number; label: string }) {
  return (
    <View style={styles.masteryCard}>
      <View style={styles.masteryHeader}>
        <View style={[styles.masteryIconWrap, { borderColor: color }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View>
          <Text style={styles.masteryValue}>{pct}%</Text>
          <Text style={styles.masteryLabel}>{label}</Text>
        </View>
      </View>
      <View style={styles.masteryBarTrack}>
        <View style={[styles.masteryBarFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profilePhotoUrl, updateProfilePhoto } = useAuth();
  const { progress } = useProgress();
  const { width } = useWindowDimensions();
  const isNarrow = width < 900;

  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [consentVisible, setConsentVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState(ALL_LEVELS);
  const [moduleFilter, setModuleFilter] = useState(ALL_MODULES);
  const [sortMode, setSortMode] = useState<SortMode>('recent');

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Usuário';
  const hasPasswordProvider = user?.providerData.some((p) => p.providerId === 'password') ?? false;

  const totalLessons = units.flatMap((u) => u.lessons).length;
  const levelProgress = getLevelProgress(units, progress.completedLessonIds);
  const metrics = useMemo(
    () => computeCourseMetrics(units, progress.completedLessonIds, progress.itemMastery, new Date().toISOString()),
    [progress.completedLessonIds, progress.itemMastery]
  );

  const unitIndexById = useMemo(() => new Map(units.map((u, i) => [u.id, i])), []);

  const vocabRows = useMemo(() => {
    return Object.entries(progress.itemMastery)
      .map(([itemId, mastery]) => {
        const item = ITEM_REGISTRY.items[itemId];
        if (!item || item.kind !== 'word') return null;
        const unit = units.find((u) => u.id === item.firstSeenUnitId);
        return {
          id: itemId,
          lu: item.displayLu,
          pt: item.displayPt,
          moduleTitle: unit?.title ?? '—',
          moduleColorIndex: unit ? (unitIndexById.get(unit.id) ?? 0) % MODULE_PILL_COLORS.length : 0,
          level: unit?.level ?? levelProgress.level,
          lastSeenAt: mastery.lastSeenAt,
          isMastered: mastery.domainLevel >= 4,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }, [progress.itemMastery, unitIndexById, levelProgress.level]);

  const levelOptions = useMemo(
    () => [ALL_LEVELS, ...Array.from(new Set(vocabRows.map((r) => r.level))).sort()],
    [vocabRows]
  );
  const moduleOptions = useMemo(
    () => [ALL_MODULES, ...Array.from(new Set(vocabRows.map((r) => r.moduleTitle)))],
    [vocabRows]
  );

  const visibleRows = useMemo(() => {
    let rows = vocabRows;
    if (levelFilter !== ALL_LEVELS) rows = rows.filter((r) => r.level === levelFilter);
    if (moduleFilter !== ALL_MODULES) rows = rows.filter((r) => r.moduleTitle === moduleFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) rows = rows.filter((r) => r.lu.toLowerCase().includes(q) || r.pt.toLowerCase().includes(q));
    return [...rows].sort((a, b) =>
      sortMode === 'recent' ? b.lastSeenAt.localeCompare(a.lastSeenAt) : a.lu.localeCompare(b.lu)
    );
  }, [vocabRows, levelFilter, moduleFilter, searchQuery, sortMode]);

  const handlePickPhoto = async () => {
    setPhotoError(null);
    try {
      const dataUrl = await pickAndResizeProfilePhoto();
      if (dataUrl) {
        setPendingPhotoUri(dataUrl);
        setConsentVisible(true);
      }
    } catch {
      setPhotoError('Não foi possível abrir essa imagem. Tente outro arquivo.');
    }
  };

  const handleConfirmPhoto = async () => {
    if (!pendingPhotoUri) return;
    const newUrl = pendingPhotoUri;
    setConsentVisible(false);
    setPendingPhotoUri(null);
    try {
      await updateProfilePhoto(newUrl);
    } catch {
      setPhotoError('Não foi possível salvar sua foto agora. Tente novamente.');
    }
  };

  const handleRemovePhoto = async () => {
    try {
      await updateProfilePhoto(null);
    } catch {
      setPhotoError('Não foi possível remover sua foto agora. Tente novamente.');
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Meu perfil</Text>
        <Text style={styles.pageSubtitle}>Acompanhe seu progresso e continue evoluindo!</Text>

        <View style={[styles.topCard, isNarrow && styles.topCardNarrow]}>
          <View style={styles.profileBlock}>
            <View style={styles.avatarWrap}>
              <UserAvatar style={styles.avatarCircle}>
                <Ionicons name="person" size={38} color={authColors.accentCyan} />
              </UserAvatar>
              <Pressable style={styles.avatarEditButton} onPress={handlePickPhoto} hitSlop={6}>
                <Ionicons name="pencil" size={13} color="#FFFFFF" />
              </Pressable>
            </View>
            <View style={styles.profileNameBlock}>
              <Text style={styles.userName}>{displayName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {profilePhotoUrl && (
                <Pressable onPress={handleRemovePhoto} hitSlop={6}>
                  <Text style={styles.removePhotoLink}>Remover foto</Text>
                </Pressable>
              )}
              {photoError && <Text style={styles.photoErrorText}>{photoError}</Text>}
            </View>
          </View>

          <View style={styles.accountCard}>
            <Text style={styles.accountTitle}>Minha conta</Text>
            <View style={styles.accountRow}>
              <Ionicons name="person-outline" size={15} color={authColors.textSecondary} />
              <Text style={styles.accountRowText}>{displayName}</Text>
            </View>
            <View style={styles.accountRow}>
              <Ionicons name="mail-outline" size={15} color={authColors.textSecondary} />
              <Text style={styles.accountRowText}>{user?.email}</Text>
            </View>
            {hasPasswordProvider && (
              <View style={styles.accountRow}>
                <Ionicons name="lock-closed-outline" size={15} color={authColors.textSecondary} />
                <Text style={styles.accountRowText}>••••••••</Text>
              </View>
            )}
            {hasPasswordProvider ? (
              <Pressable style={styles.changePasswordButton} onPress={() => setChangePasswordVisible(true)}>
                <Ionicons name="lock-closed" size={14} color={authColors.accentCyan} />
                <Text style={styles.changePasswordText}>Alterar senha</Text>
              </Pressable>
            ) : (
              <Text style={styles.googleNote}>Sua conta usa login do Google — a senha é gerenciada por lá.</Text>
            )}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Seu progresso</Text>
        <View style={[styles.statsGrid, isNarrow && styles.statsGridNarrow]}>
          <StatCard icon="star" color="#FFD65A" value={progress.xp} label="XP total" />
          <StatCard icon="flame" color="#FF8A3D" value={progress.streak} label="Dias de ofensiva" />
          <StatCard icon="book" color={authColors.accentCyan} value={`${progress.completedLessonIds.length} / ${totalLessons}`} label="Lições completas" />
          <StatCard icon="stats-chart" color="#22C55E" value={levelProgress.level} label="Nível atual" />
        </View>

        <Text style={styles.sectionTitle}>Domínio do idioma</Text>
        <Text style={styles.sectionHint}>Veja como está sua evolução no Luxemburguês</Text>
        <View style={[styles.masteryRow, isNarrow && styles.masteryRowNarrow]}>
          <MasteryCard icon="book" color={authColors.accentCyan} pct={metrics.vocabularyMasteryPct} label="Vocabulário dominado" />
          <MasteryCard icon="locate" color="#22C55E" pct={metrics.retentionHealthPct} label="Saúde de retenção" />
        </View>

        <View style={styles.vocabCard}>
          <View style={[styles.vocabHeaderRow, isNarrow && styles.vocabHeaderRowNarrow]}>
            <View>
              <Text style={styles.sectionTitleInCard}>Meu vocabulário</Text>
              <Text style={styles.sectionHint}>Todas as palavras que você já aprendeu</Text>
            </View>
            <Text style={styles.vocabCount}>
              Você já aprendeu <Text style={styles.vocabCountNumber}>{vocabRows.length}</Text> palavras
            </Text>
          </View>

          <View style={[styles.vocabControlsRow, isNarrow && styles.vocabControlsRowNarrow]}>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color={authColors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Pesquisar palavra ou tradução..."
                placeholderTextColor={authColors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <Dropdown label="Nível" value={levelFilter} options={levelOptions} onChange={setLevelFilter} />
            <Dropdown label="Módulo" value={moduleFilter} options={moduleOptions} onChange={setModuleFilter} />
            <Dropdown
              label="Ordenar"
              value={sortMode === 'recent' ? 'Mais recentes' : 'Ordem alfabética'}
              options={['Mais recentes', 'Ordem alfabética']}
              onChange={(v) => setSortMode(v === 'Mais recentes' ? 'recent' : 'alpha')}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderCell, styles.colSpeaker]}> </Text>
                <Text style={[styles.tableHeaderCell, styles.colWord]}>Palavra ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colTranslation]}>Tradução ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colModule]}>Módulo ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colDate]}>Data ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colLevel]}>Nível ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colStatus]}>Status ↕</Text>
                <Text style={[styles.tableHeaderCell, styles.colChevron]}> </Text>
              </View>

              {visibleRows.length === 0 ? (
                <Text style={styles.emptyState}>
                  {vocabRows.length === 0
                    ? 'Complete uma lição para começar a ver seu vocabulário aqui.'
                    : 'Nenhuma palavra encontrada com esses filtros.'}
                </Text>
              ) : (
                visibleRows.map((row) => {
                  const color = MODULE_PILL_COLORS[row.moduleColorIndex];
                  return (
                    <View key={row.id} style={styles.tableRow}>
                      <Pressable style={styles.colSpeaker} onPress={() => speak(row.lu)} hitSlop={6}>
                        <Ionicons name="volume-medium-outline" size={16} color={authColors.accentCyan} />
                      </Pressable>
                      <Text style={[styles.wordText, styles.colWord]}>{row.lu}</Text>
                      <Text style={[styles.cellText, styles.colTranslation]}>{row.pt}</Text>
                      <View style={styles.colModule}>
                        <View style={[styles.modulePill, { backgroundColor: color.bg, borderColor: color.border }]}>
                          <Text style={[styles.modulePillText, { color: color.text }]} numberOfLines={1}>
                            {row.moduleTitle}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.cellText, styles.colDate]}>{formatDate(row.lastSeenAt)}</Text>
                      <Text style={[styles.cellText, styles.colLevel]}>{row.level}</Text>
                      <View style={styles.colStatus}>
                        {row.isMastered ? (
                          <View style={styles.statusRow}>
                            <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                            <Text style={styles.statusMastered}>Dominada</Text>
                          </View>
                        ) : (
                          <View style={styles.statusRow}>
                            <Ionicons name="time-outline" size={15} color={authColors.accentCyan} />
                            <Text style={styles.statusLearning}>Aprendendo</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.colChevron}>
                        <Ionicons name="chevron-forward" size={16} color={authColors.textMuted} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <PhotoConsentModal
        visible={consentVisible}
        previewUri={pendingPhotoUri}
        onCancel={() => {
          setConsentVisible(false);
          setPendingPhotoUri(null);
        }}
        onConfirm={handleConfirmPhoto}
        onOpenPrivacyPolicy={() => navigation.navigate('PrivacyPolicy')}
      />
      <ChangePasswordModal visible={changePasswordVisible} onClose={() => setChangePasswordVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, minHeight: '100%', backgroundColor: authColors.pageBg },
  scroll: { flex: 1 },
  content: { padding: 28, paddingBottom: 60 },

  pageTitle: { fontFamily: fontFamilies.displayExtraBold, fontSize: 30, color: authColors.textPrimary },
  pageSubtitle: { fontFamily: fontFamilies.displayRegular, fontSize: 14, color: authColors.textSecondary, marginTop: 6, marginBottom: 24 },

  topCard: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
  },
  topCardNarrow: { flexDirection: 'column' },

  profileBlock: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 18, minWidth: 260 },
  avatarWrap: { width: 92, height: 92 },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 2,
    borderColor: authColors.accentCyan,
    backgroundColor: authColors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditButton: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: authColors.accentBlue,
    borderWidth: 2,
    borderColor: authColors.pageBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileNameBlock: { flexShrink: 1 },
  userName: { fontFamily: fontFamilies.displayBold, fontSize: 21, color: authColors.textPrimary },
  userEmail: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary, marginTop: 2 },
  removePhotoLink: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12, color: authColors.danger, marginTop: 8 },
  photoErrorText: { fontFamily: fontFamilies.displayRegular, fontSize: 11, color: authColors.danger, marginTop: 6 },

  accountCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 18,
    padding: 18,
  },
  accountTitle: { fontFamily: fontFamilies.displayBold, fontSize: 14, color: authColors.textPrimary, marginBottom: 12 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  accountRowText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  changePasswordText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 13, color: authColors.accentCyan },
  googleNote: { fontFamily: fontFamilies.displayRegular, fontSize: 11.5, color: authColors.textMuted, marginTop: 6, lineHeight: 16 },

  sectionTitle: { fontFamily: fontFamilies.displayBold, fontSize: 19, color: authColors.textPrimary, marginBottom: 14 },
  sectionTitleInCard: { fontFamily: fontFamilies.displayBold, fontSize: 18, color: authColors.textPrimary },
  sectionHint: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginBottom: 14 },

  statsGrid: { flexDirection: 'row', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
  statsGridNarrow: {},
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 18,
    padding: 18,
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontFamily: fontFamilies.displayExtraBold, fontSize: 22, color: authColors.textPrimary },
  statLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 12, color: authColors.textSecondary, marginTop: 4 },

  masteryRow: { flexDirection: 'row', gap: 14, marginBottom: 28, flexWrap: 'wrap' },
  masteryRowNarrow: {},
  masteryCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 18,
    padding: 20,
  },
  masteryHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  masteryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masteryValue: { fontFamily: fontFamilies.displayExtraBold, fontSize: 22, color: authColors.textPrimary },
  masteryLabel: { fontFamily: fontFamilies.displayRegular, fontSize: 12.5, color: authColors.textSecondary, marginTop: 2 },
  masteryBarTrack: { height: 8, borderRadius: 4, backgroundColor: authColors.inputBg, overflow: 'hidden' },
  masteryBarFill: { height: '100%', borderRadius: 4 },

  vocabCard: {
    backgroundColor: authColors.cardBg,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 24,
    padding: 24,
  },
  vocabHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, gap: 12 },
  vocabHeaderRowNarrow: { flexDirection: 'column' },
  vocabCount: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },
  vocabCountNumber: { fontFamily: fontFamilies.displayBold, color: authColors.accentCyan, fontSize: 15 },

  vocabControlsRow: { flexDirection: 'row', gap: 10, marginBottom: 18, flexWrap: 'wrap' },
  vocabControlsRowNarrow: { flexDirection: 'column' },
  searchWrap: {
    flex: 1,
    minWidth: 200,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: { flex: 1, fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textPrimary, height: '100%' },

  dropdownWrap: { position: 'relative' },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: authColors.inputBg,
    borderWidth: 1,
    borderColor: authColors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    minWidth: 150,
  },
  dropdownButtonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: authColors.textPrimary, flexShrink: 1 },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    minWidth: 180,
    maxHeight: 220,
    backgroundColor: authColors.pageBgTop,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 14,
    paddingVertical: 6,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownMenuScroll: { maxHeight: 220 },
  dropdownMenuItem: { paddingVertical: 9, paddingHorizontal: 14 },
  dropdownMenuItemText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },
  dropdownMenuItemTextActive: { color: authColors.accentCyan, fontFamily: fontFamilies.displaySemiBold },

  table: { minWidth: 760 },
  tableHeaderRow: { flexDirection: 'row', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: authColors.divider },
  tableHeaderCell: { fontFamily: fontFamilies.displaySemiBold, fontSize: 11.5, color: authColors.textSecondary, letterSpacing: 0.3 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: authColors.divider,
  },
  emptyState: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textMuted, paddingVertical: 24, textAlign: 'center' },

  colSpeaker: { width: 40 },
  colWord: { width: 120 },
  colTranslation: { width: 140 },
  colModule: { width: 140 },
  colDate: { width: 100 },
  colLevel: { width: 70 },
  colStatus: { width: 120 },
  colChevron: { width: 30, alignItems: 'flex-end' },

  wordText: { fontFamily: fontFamilies.displayBold, fontSize: 13.5, color: authColors.textPrimary },
  cellText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },
  modulePill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  modulePillText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 11.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusMastered: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: '#22C55E' },
  statusLearning: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: authColors.accentCyan },
});

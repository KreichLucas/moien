import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { getLevelProgress } from '../content/levels';
import { units } from '../content/units';
import { authColors, liftStyle, makeDashboardStyles } from '../screens/dashboardStyles';
import { useProgress } from '../state/ProgressContext';

export interface SidebarItem {
  id: string;
  /** Base Ionicons name, e.g. "home" — the outline variant is used when inactive, the filled one when active. */
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
}

interface Props {
  items: SidebarItem[];
}

const styles = makeDashboardStyles();

export function Sidebar({ items }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const { progress } = useProgress();
  const levelProgress = useMemo(() => getLevelProgress(units, progress.completedLessonIds), [progress.completedLessonIds]);
  const levelPct = levelProgress.total > 0 ? Math.min(100, Math.round((levelProgress.completed / levelProgress.total) * 100)) : 0;

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarTop}>
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        <Image source={require('../../assets/moien-logo-3d.png')} style={styles.sidebarLogo} resizeMode="contain" />
        <Text style={styles.sidebarTagline}>Aprenda Luxemburguês{'\n'}de um jeito real</Text>

        {items.map((item) => (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            onHoverIn={() => setHoveredId(item.id)}
            onHoverOut={() => setHoveredId((id) => (id === item.id ? null : id))}
            style={({ pressed }) => [
              styles.navItem,
              item.active && styles.navItemActive,
              liftStyle(hoveredId === item.id, 14, pressed),
            ]}
          >
            <Ionicons
              name={item.active ? item.icon : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)}
              size={19}
              color={item.active ? authColors.accentCyan : authColors.textSecondary}
            />
            <Text style={[styles.navItemLabel, item.active && styles.navItemLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}

        <View style={styles.sidebarProgressCard}>
          <View style={styles.sidebarProgressHeader}>
            <Text style={styles.sidebarProgressLevel}>{levelProgress.level}</Text>
            <Text style={styles.sidebarProgressPct}>{levelPct}%</Text>
          </View>
          <View style={styles.sidebarProgressBarTrack}>
            <View style={[styles.sidebarProgressBarFill, { width: `${levelPct}%` }]} />
          </View>
          <Text style={styles.sidebarProgressCaption}>
            {levelProgress.completed} de {levelProgress.total} lições concluídas
          </Text>
          <View style={styles.sidebarStatsRow}>
            <View style={styles.sidebarStatChip}>
              <Ionicons name="flame" size={14} color="#FF8A3D" />
              <Text style={styles.sidebarStatChipText}>{progress.streak} dias</Text>
            </View>
            <View style={styles.sidebarStatChip}>
              <Ionicons name="star" size={14} color="#FFD65A" />
              <Text style={styles.sidebarStatChipText}>{progress.xp} XP</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sidebarBottom}>
        <View style={styles.sidebarQuoteCard}>
          <Text style={styles.sidebarQuoteFlag}>🇱🇺</Text>
          <Text style={styles.sidebarQuoteLu}>Kleng Schrëtt,{'\n'}grouss Ziler!</Text>
          <Text style={styles.sidebarQuotePt}>Pequenos passos, grandes objetivos!</Text>
        </View>
        <Text style={styles.sidebarCopyright}>© {new Date().getFullYear()} Moien{'\n'}Todos os direitos reservados.</Text>
      </View>
    </View>
  );
}

export { authColors };

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { authColors, makeDashboardStyles } from '../screens/dashboardStyles';
import { pressedStyle } from '../theme/theme';

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
            style={({ pressed }) => [styles.navItem, item.active && styles.navItemActive, pressedStyle(pressed)]}
          >
            <Ionicons
              name={item.active ? item.icon : (`${item.icon}-outline` as keyof typeof Ionicons.glyphMap)}
              size={19}
              color={item.active ? authColors.accentCyan : authColors.textSecondary}
            />
            <Text style={[styles.navItemLabel, item.active && styles.navItemLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
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

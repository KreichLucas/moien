import React from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useAuth } from '../state/AuthContext';

interface Props {
  /** The caller's existing avatar circle style (size, background, border) — kept exactly as-is; this only decides what fills it. */
  style: StyleProp<ViewStyle>;
  /** What to render when there's no saved photo (initials text, a placeholder icon...) — each screen keeps its own fallback look. */
  children: React.ReactNode;
}

/**
 * The one place that decides "photo or fallback" for a user avatar —
 * reused everywhere an avatar appears (dashboard header, module pages,
 * Perfil) instead of each screen loading/holding its own copy of the
 * photo, so every avatar updates together the instant it changes in
 * AuthContext (single source of truth: `useAuth().profilePhotoUrl`).
 */
export function UserAvatar({ style, children }: Props) {
  const { profilePhotoUrl } = useAuth();

  return (
    <View style={[style, styles.clip]}>
      {profilePhotoUrl ? <Image source={{ uri: profilePhotoUrl }} style={styles.image} resizeMode="cover" /> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  image: { width: '100%', height: '100%' },
});

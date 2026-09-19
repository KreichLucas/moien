import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { authColors, makeAuthStyles } from './authStyles';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const showSidePanels = width >= 1100;
  const isNarrow = width < 480;
  const styles = useMemo(() => makeAuthStyles(), []);

  return (
    <View style={[styles.page, isNarrow && styles.pageNarrow]}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeftOuter]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeftInner]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomRightOuter]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomRightInner]} />

      <View style={styles.langSelector}>
        <Ionicons name="globe-outline" size={16} color={authColors.textSecondary} />
        <Text style={styles.langSelectorText}>Português (BR)</Text>
        <Ionicons name="chevron-down" size={14} color={authColors.textSecondary} />
      </View>

      <View style={[styles.contentRow, !showSidePanels && styles.contentRowCentered]}>
        {showSidePanels && (
          <View style={styles.leftPanel}>
            <Text style={styles.leftHeadline}>
              Mais que{'\n'}
              <Text style={styles.leftHeadlineAccent}>um idioma</Text>
            </Text>
            <View style={styles.leftDivider} />
            <Text style={styles.leftParagraph}>Abra novas oportunidades{'\n'}com o luxemburguês.</Text>
          </View>
        )}

        <View style={[styles.card, isNarrow && styles.cardNarrow]}>{children}</View>

        {showSidePanels && (
          <View style={styles.rightPanel}>
            <Text style={styles.rightScript}>Moien</Text>
            <Text style={[styles.rightScript, styles.rightScriptSecond]}>Nei Méiglechkeeten</Text>
            <View style={styles.rightUnderline} />
          </View>
        )}
      </View>
    </View>
  );
}

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, Text, View, useWindowDimensions } from 'react-native';
import { authColors, makeAuthStyles } from './authStyles';

const EDGE_MARGIN = 20;

type Size = { width: number; height: number };
const emptySize: Size = { width: 0, height: 0 };

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { width } = useWindowDimensions();
  const showSidePanels = width >= 1100;
  const isNarrow = width < 480;
  const styles = useMemo(() => makeAuthStyles(), []);

  // `stage` is the flex:1 area left below the language selector — its own
  // onLayout reports the space we have available to fit into.
  const [stageSize, setStageSize] = useState<Size>(emptySize);
  // The scale transform lives on an INNER view; `naturalSize` is measured on
  // the plain OUTER wrapper around it instead. A transformed element still
  // occupies its untransformed box for layout purposes, so the outer
  // wrapper's own size always hugs the content's true natural size — measuring
  // the transformed node directly is unreliable, since re-layouts triggered
  // by the transform itself can report the already-scaled size back, which
  // then feeds a smaller-than-correct scale into the next render.
  const [naturalSize, setNaturalSize] = useState<Size>(emptySize);

  const onLayoutInto = (setter: (size: Size) => void) => (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setter({ width: w, height: h });
  };

  const scale =
    naturalSize.width > 0 && naturalSize.height > 0 && stageSize.width > 0 && stageSize.height > 0
      ? Math.min(
          1,
          (stageSize.width - EDGE_MARGIN * 2) / naturalSize.width,
          (stageSize.height - EDGE_MARGIN * 2) / naturalSize.height
        )
      : 1;

  return (
    <View style={styles.page}>
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeftOuter]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobTopLeftInner]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomRightOuter]} />
      <View pointerEvents="none" style={[styles.blob, styles.blobBottomRightInner]} />

      <View style={styles.langSelectorRow}>
        <View style={styles.langSelector}>
          <Ionicons name="globe-outline" size={16} color={authColors.textSecondary} />
          <Text style={styles.langSelectorText}>Português (BR)</Text>
          <Ionicons name="chevron-down" size={14} color={authColors.textSecondary} />
        </View>
      </View>

      <View style={styles.stage} onLayout={onLayoutInto(setStageSize)}>
        <View onLayout={onLayoutInto(setNaturalSize)}>
          <View
            style={[styles.contentRow, !showSidePanels && styles.contentRowCentered, { transform: [{ scale }] }]}
          >
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
      </View>
    </View>
  );
}

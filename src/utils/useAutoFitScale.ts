import { useState } from 'react';
import { LayoutChangeEvent } from 'react-native';

type Size = { width: number; height: number };
const emptySize: Size = { width: 0, height: 0 };

/**
 * Measures an outer "stage" (the available space) against an inner
 * "natural" content size, and returns a `scale` (never above 1) that
 * shrinks the content just enough to fit inside the stage without
 * scrolling or clipping. Same no-scroll auto-fit technique already used by
 * the auth screens (`AuthLayout`), extracted here so other screens (like
 * the lesson screen) can reuse it without duplicating the math.
 */
export function useAutoFitScale(edgeMargin = 20) {
  const [stageSize, setStageSize] = useState<Size>(emptySize);
  const [naturalSize, setNaturalSize] = useState<Size>(emptySize);

  const onLayoutInto = (setter: (size: Size) => void) => (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setter({ width, height });
  };

  const scale =
    naturalSize.width > 0 && naturalSize.height > 0 && stageSize.width > 0 && stageSize.height > 0
      ? Math.min(
          1,
          (stageSize.width - edgeMargin * 2) / naturalSize.width,
          (stageSize.height - edgeMargin * 2) / naturalSize.height
        )
      : 1;

  return {
    onStageLayout: onLayoutInto(setStageSize),
    onNaturalLayout: onLayoutInto(setNaturalSize),
    scale,
  };
}

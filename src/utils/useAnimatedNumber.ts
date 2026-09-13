import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

export function useAnimatedNumber(
  value: number,
  duration = 700,
  options?: { animateFrom?: number }
): number {
  const animateFrom = options?.animateFrom;
  const [display, setDisplay] = useState(animateFrom ?? value);
  const anim = useRef(new Animated.Value(animateFrom ?? value)).current;
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (animateFrom === undefined) {
        setDisplay(value);
        anim.setValue(value);
        return;
      }
    }
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, { toValue: value, duration, useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [value]);

  return display;
}

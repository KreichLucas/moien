import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef } from 'react';

/**
 * Guards against a false "hover" right after navigating to a screen: if the
 * mouse is already sitting still over whatever new element renders at that
 * spot, the browser fires a real mouseover for it even though the user
 * never actually moved the cursor — e.g. click "Criar conta", the page
 * swaps to the Dashboard underneath the stationary pointer, and a module
 * card that happens to render at that exact spot lights up as "hovered"
 * with no way to un-hover it short of an actual mouse move. Resetting
 * hover state on focus doesn't help, since that same phantom mouseover
 * re-fires right after. This instead makes hover-in handlers no-ops for a
 * brief window after the screen gains focus, which is enough time for any
 * such phantom event to fire and be ignored, while real hovers (which
 * happen well after the user has actually moved the mouse) go through
 * untouched.
 */
export function useHoverGuard(graceMs = 350) {
  const readyRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      readyRef.current = false;
      const timer = setTimeout(() => {
        readyRef.current = true;
      }, graceMs);
      return () => clearTimeout(timer);
    }, [graceMs])
  );

  return useCallback(() => readyRef.current, []);
}

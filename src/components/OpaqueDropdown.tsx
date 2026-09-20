import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authColors, fontFamilies } from '../screens/authStyles';

interface Props {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}

/**
 * A "pick one from a list" pill whose open menu renders through a `Modal`
 * (same top-layer pattern as PhotoConsentModal/ChangePasswordModal) instead
 * of a plain absolutely-positioned sibling View. A menu positioned that way
 * ends up sharing a stacking context with whatever scrollable content sits
 * near it on web — e.g. Perfil's vocabulary table used to paint its rows
 * right through the menu's background no matter how high its zIndex was
 * set. A Modal always paints in its own top-level layer, so this is opaque
 * and above everything, positioned via the button's real on-screen
 * coordinates (measureInWindow) instead of a CSS-relative offset.
 */
export function OpaqueDropdown({ value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [menuLayout, setMenuLayout] = useState({ x: 0, y: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const openMenu = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuLayout({ x, y: y + height + 6, width });
      setOpen(true);
    });
  };

  return (
    <View style={styles.wrap}>
      <Pressable ref={buttonRef} style={styles.button} onPress={openMenu}>
        <Text style={styles.buttonText} numberOfLines={1}>
          {value}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={14} color={authColors.textSecondary} />
      </Pressable>
      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.menu, { top: menuLayout.y, left: menuLayout.x, minWidth: Math.max(menuLayout.width, 150) }]}
            onPress={() => {}}
          >
            <ScrollView style={styles.menuScroll}>
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.menuItem}
                  onPress={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.menuItemText, opt === value && styles.menuItemTextActive]}>{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative' },
  button: {
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
  buttonText: { fontFamily: fontFamilies.displaySemiBold, fontSize: 12.5, color: authColors.textPrimary, flexShrink: 1 },
  menu: {
    position: 'absolute',
    maxHeight: 220,
    backgroundColor: authColors.pageBgTop,
    borderWidth: 1,
    borderColor: authColors.cardBorder,
    borderRadius: 14,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  menuScroll: { maxHeight: 220 },
  menuItem: { paddingVertical: 9, paddingHorizontal: 14 },
  menuItemText: { fontFamily: fontFamilies.displayRegular, fontSize: 13, color: authColors.textSecondary },
  menuItemTextActive: { color: authColors.accentCyan, fontFamily: fontFamilies.displaySemiBold },
});

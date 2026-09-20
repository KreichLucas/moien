import { Ionicons } from '@expo/vector-icons';

/**
 * The 20-module A1 curriculum plan. Only a few of these already have real
 * lesson content authored (`unitId` set, pointing at a real `Unit` in
 * `units.ts`) — the rest are placeholders for modules not written yet, shown
 * locked on the "Todos os módulos" page so the full planned curriculum is
 * visible without pretending unwritten content already exists.
 */
export interface ModuleCatalogEntry {
  order: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  unitId?: string;
}

export const MODULE_CATALOG_A1: ModuleCatalogEntry[] = [
  { order: 1, title: 'Saudações', icon: 'hand-right', unitId: 'a1-obj1' },
  { order: 2, title: 'Eu e Você', icon: 'people', unitId: 'a1-obj2' },
  { order: 3, title: 'Números', icon: 'calculator', unitId: 'a1-obj3' },
  { order: 4, title: 'Cores e Formas', icon: 'color-palette', unitId: 'a1-obj4' },
  { order: 5, title: 'Família', icon: 'people-circle' },
  { order: 6, title: 'Casa', icon: 'home' },
  { order: 7, title: 'Comida e Bebida', icon: 'restaurant', unitId: 'u4' },
  { order: 8, title: 'Compras', icon: 'bag-handle' },
  { order: 9, title: 'Horas e Datas', icon: 'calendar' },
  { order: 10, title: 'Rotina', icon: 'walk' },
  { order: 11, title: 'Cidade', icon: 'business' },
  { order: 12, title: 'Transportes', icon: 'bus' },
  { order: 13, title: 'Trabalho', icon: 'briefcase' },
  { order: 14, title: 'Estudos', icon: 'school' },
  { order: 15, title: 'Gostos e Hobbies', icon: 'game-controller' },
  { order: 16, title: 'Clima', icon: 'partly-sunny' },
  { order: 17, title: 'Roupas e Corpo', icon: 'shirt' },
  { order: 18, title: 'Saúde Básica', icon: 'medkit' },
  { order: 19, title: 'Restaurante', icon: 'cafe' },
  { order: 20, title: 'Situações do Dia a Dia', icon: 'chatbubbles' },
];

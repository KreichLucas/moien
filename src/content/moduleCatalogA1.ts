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
  icon: string;
  unitId?: string;
}

export const MODULE_CATALOG_A1: ModuleCatalogEntry[] = [
  { order: 1, title: 'Saudações', icon: '👋', unitId: 'a1-obj1' },
  { order: 2, title: 'Eu e Você', icon: '👫', unitId: 'a1-obj2' },
  { order: 3, title: 'Números', icon: '🔢', unitId: 'a1-obj3' },
  { order: 4, title: 'Cores e Formas', icon: '🎨', unitId: 'a1-obj4' },
  { order: 5, title: 'Família', icon: '👪' },
  { order: 6, title: 'Casa', icon: '🏠' },
  { order: 7, title: 'Comida e Bebida', icon: '🍴', unitId: 'u4' },
  { order: 8, title: 'Compras', icon: '🛍️' },
  { order: 9, title: 'Horas e Datas', icon: '📅' },
  { order: 10, title: 'Rotina', icon: '🏃' },
  { order: 11, title: 'Cidade', icon: '🏙️' },
  { order: 12, title: 'Transportes', icon: '🚌' },
  { order: 13, title: 'Trabalho', icon: '💼' },
  { order: 14, title: 'Estudos', icon: '🎓' },
  { order: 15, title: 'Gostos e Hobbies', icon: '🎮' },
  { order: 16, title: 'Clima', icon: '☀️' },
  { order: 17, title: 'Roupas e Corpo', icon: '👕' },
  { order: 18, title: 'Saúde Básica', icon: '🩹' },
  { order: 19, title: 'Restaurante', icon: '☕' },
  { order: 20, title: 'Situações do Dia a Dia', icon: '💬' },
];

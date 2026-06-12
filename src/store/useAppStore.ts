import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { cancelReminder, scheduleRoutineReminder } from '@/lib/notifications';

const DAY_MS = 24 * 60 * 60 * 1000;

export interface AnalysisRecord {
  id: string;
  type: 'eau' | 'bandelette';
  date: number;
  /** Résumé court affiché dans l'historique */
  summary: string;
  severity: 'ok' | 'warning' | 'danger';
  /** Détails affichables (diagnostic, valeurs mesurées…) */
  details: string[];
}

export interface Routine {
  id: string;
  name: string;
  emoji: string;
  frequencyDays: number;
  lastDoneAt: number | null;
  nextDueAt: number;
  notificationId: string | null;
}

export interface StockItem {
  id: string;
  /** Référence au catalogue boutique si le produit en vient */
  productId: string | null;
  name: string;
  quantity: number;
  unit: string;
  lowThreshold: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface Order {
  id: string;
  date: number;
  lines: { productId: string; name: string; quantity: number; price: number }[];
  total: number;
  status: 'en cours' | 'reçue';
}

interface AppState {
  seeded: boolean;
  analyses: AnalysisRecord[];
  routines: Routine[];
  stock: StockItem[];
  cart: CartLine[];
  orders: Order[];

  seedIfNeeded: () => void;
  addAnalysis: (record: Omit<AnalysisRecord, 'id' | 'date'>) => void;

  addRoutine: (name: string, emoji: string, frequencyDays: number) => Promise<void>;
  completeRoutine: (id: string) => Promise<void>;
  removeRoutine: (id: string) => Promise<void>;

  addStockItem: (item: Omit<StockItem, 'id'>) => void;
  adjustStock: (id: string, delta: number) => void;
  removeStockItem: (id: string) => void;

  addToCart: (productId: string) => void;
  removeFromCart: (productId: string) => void;
  placeOrder: (lines: Order['lines']) => void;
  markOrderReceived: (orderId: string) => void;
}

function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const DEFAULT_ROUTINES: { name: string; emoji: string; frequencyDays: number }[] = [
  { name: "Tester l'eau (bandelette)", emoji: '🧪', frequencyDays: 3 },
  { name: 'Vérifier et vider les skimmers', emoji: '🧺', frequencyDays: 2 },
  { name: 'Brosser parois et ligne d’eau', emoji: '🧹', frequencyDays: 7 },
  { name: 'Contre-lavage du filtre', emoji: '🔄', frequencyDays: 14 },
  { name: 'Ajouter un galet de chlore', emoji: '🧼', frequencyDays: 7 },
];

const DEFAULT_STOCK: Omit<StockItem, 'id'>[] = [
  { productId: 'chlore-galets', name: 'Chlore lent — galets', quantity: 12, unit: 'galets', lowThreshold: 4 },
  { productId: 'ph-moins', name: 'pH Moins', quantity: 3, unit: 'kg', lowThreshold: 1 },
  { productId: 'bandelettes', name: 'Bandelettes de test', quantity: 30, unit: 'bandelettes', lowThreshold: 10 },
];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      seeded: false,
      analyses: [],
      routines: [],
      stock: [],
      cart: [],
      orders: [],

      seedIfNeeded: () => {
        if (get().seeded) return;
        const now = Date.now();
        set({
          seeded: true,
          routines: DEFAULT_ROUTINES.map((r) => ({
            ...r,
            id: makeId(),
            lastDoneAt: null,
            nextDueAt: now + r.frequencyDays * DAY_MS,
            notificationId: null,
          })),
          stock: DEFAULT_STOCK.map((s) => ({ ...s, id: makeId() })),
        });
      },

      addAnalysis: (record) =>
        set((state) => ({
          analyses: [{ ...record, id: makeId(), date: Date.now() }, ...state.analyses].slice(0, 100),
        })),

      addRoutine: async (name, emoji, frequencyDays) => {
        const nextDueAt = Date.now() + frequencyDays * DAY_MS;
        const notificationId = await scheduleRoutineReminder(name, nextDueAt);
        set((state) => ({
          routines: [
            ...state.routines,
            { id: makeId(), name, emoji, frequencyDays, lastDoneAt: null, nextDueAt, notificationId },
          ],
        }));
      },

      completeRoutine: async (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;
        await cancelReminder(routine.notificationId);
        const now = Date.now();
        const nextDueAt = now + routine.frequencyDays * DAY_MS;
        const notificationId = await scheduleRoutineReminder(routine.name, nextDueAt);
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, lastDoneAt: now, nextDueAt, notificationId } : r
          ),
        }));
      },

      removeRoutine: async (id) => {
        const routine = get().routines.find((r) => r.id === id);
        await cancelReminder(routine?.notificationId);
        set((state) => ({ routines: state.routines.filter((r) => r.id !== id) }));
      },

      addStockItem: (item) =>
        set((state) => ({ stock: [...state.stock, { ...item, id: makeId() }] })),

      adjustStock: (id, delta) =>
        set((state) => ({
          stock: state.stock.map((s) =>
            s.id === id ? { ...s, quantity: Math.max(0, s.quantity + delta) } : s
          ),
        })),

      removeStockItem: (id) =>
        set((state) => ({ stock: state.stock.filter((s) => s.id !== id) })),

      addToCart: (productId) =>
        set((state) => {
          const existing = state.cart.find((l) => l.productId === productId);
          return {
            cart: existing
              ? state.cart.map((l) =>
                  l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l
                )
              : [...state.cart, { productId, quantity: 1 }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cart: state.cart
            .map((l) => (l.productId === productId ? { ...l, quantity: l.quantity - 1 } : l))
            .filter((l) => l.quantity > 0),
        })),

      placeOrder: (lines) =>
        set((state) => ({
          cart: [],
          orders: [
            {
              id: makeId(),
              date: Date.now(),
              lines,
              total: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
              status: 'en cours',
            },
            ...state.orders,
          ],
        })),

      markOrderReceived: (orderId) =>
        set((state) => {
          const order = state.orders.find((o) => o.id === orderId);
          if (!order || order.status === 'reçue') return state;
          // À réception, on incrémente le stock des produits correspondants
          let stock = [...state.stock];
          for (const line of order.lines) {
            const existing = stock.find((s) => s.productId === line.productId);
            if (existing) {
              stock = stock.map((s) =>
                s.id === existing.id ? { ...s, quantity: s.quantity + line.quantity } : s
              );
            } else {
              stock.push({
                id: makeId(),
                productId: line.productId,
                name: line.name,
                quantity: line.quantity,
                unit: 'unité(s)',
                lowThreshold: 1,
              });
            }
          }
          return {
            stock,
            orders: state.orders.map((o) => (o.id === orderId ? { ...o, status: 'reçue' } : o)),
          };
        }),
    }),
    {
      name: 'poolcare-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function lowStockItems(stock: StockItem[]): StockItem[] {
  return stock.filter((s) => s.quantity <= s.lowThreshold);
}

export function dueRoutines(routines: Routine[], horizonDays = 0): Routine[] {
  const limit = Date.now() + horizonDays * DAY_MS;
  return routines.filter((r) => r.nextDueAt <= limit).sort((a, b) => a.nextDueAt - b.nextDueAt);
}

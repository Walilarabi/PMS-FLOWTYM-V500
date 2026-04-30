import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hotel } from '@/shared/types/common';

export type ModuleId =
  | 'planning'
  | 'reservations'
  | 'today'
  | 'clients'
  | 'revenue'
  | 'facturation'
  | 'rapports'
  | 'configuration'
  | 'conformite';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// Hotel Folkestone Opéra — injecté par défaut depuis .env
const DEFAULT_HOTEL: Hotel = {
  id: import.meta.env.VITE_HOTEL_ID ?? '02b9eb0e-89ef-45de-ba8e-20d4b41c500c',
  name: 'Folkestone Opéra',
  city: 'Paris',
  address: '9 rue de Castellane',
  zip: '75008',
  country: 'France',
  phone: '+33142657309',
  email: 'reservation@hotelfolkestoneopera.com',
  siret: '57219354800011',
  tva_number: 'FR 77572193548',
  logo_url: 'https://folkestone-paris-hotel.com/fr/',
  timezone: 'Europe/Paris',
  currency: 'EUR',
  city_tax_rate: 5.53,
  active: true,
  created_at: '2026-04-30T21:04:41+00:00',
};

interface AppState {
  currentModule: ModuleId;
  setCurrentModule: (module: ModuleId) => void;

  currentHotel: Hotel;
  setCurrentHotel: (hotel: Hotel) => void;

  userId: string | null;
  userEmail: string | null;
  setUser: (userId: string, email: string) => void;
  clearUser: () => void;

  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;

  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  alertCount: number;
  setAlertCount: (n: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentModule: 'planning',
      setCurrentModule: (module) => set({ currentModule: module }),

      currentHotel: DEFAULT_HOTEL,
      setCurrentHotel: (hotel) => set({ currentHotel: hotel }),

      userId: null,
      userEmail: null,
      setUser: (userId, userEmail) => set({ userId, userEmail }),
      clearUser: () => set({ userId: null, userEmail: null }),

      toasts: [],
      addToast: (message, type) => {
        const id = `t_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        set(state => ({ toasts: [...state.toasts, { id, message, type }] }));
        setTimeout(() => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })), 4000);
      },
      removeToast: (id) => set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

      sidebarCollapsed: false,
      toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      alertCount: 0,
      setAlertCount: (n) => set({ alertCount: n }),
    }),
    {
      name: 'flowtym-app-store',
      partialize: (state) => ({
        currentModule: state.currentModule,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// Helper hook — hotel_id toujours disponible
export const useHotelId = () => useAppStore(state => state.currentHotel.id);

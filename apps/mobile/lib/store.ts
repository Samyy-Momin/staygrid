import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  token: string | null;
  user: { name?: string; email?: string } | null;
  setAuth: (token: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  setAuth: (token, user) => set({ token, user }),
  logout: () => set({ token: null, user: null }),
}));

interface AppState {
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

export const useAppStore = create<AppState>((set) => ({
  themeMode: 'system',
  setThemeMode: (mode) => set({ themeMode: mode }),
}));

interface FavoriteState {
  favorites: string[];
  toggleFavorite: (id: string | number) => void;
  isFavorite: (id: string | number) => boolean;
}

export const useFavoriteStore = create<FavoriteState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (id: string | number) => {
        set((state) => {
          const stringId = String(id);
          const isFav = state.favorites.includes(stringId);
          return {
            favorites: isFav 
              ? state.favorites.filter((favId) => favId !== stringId)
              : [...state.favorites, stringId]
          };
        });
      },
      isFavorite: (id: string | number) => get().favorites.includes(String(id)),
    }),
    {
      name: 'staygrid-favorites',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

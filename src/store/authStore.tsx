import { createMMKV } from 'react-native-mmkv';
export const storage = createMMKV();

export const authStore = {
  getToken: (): string | undefined => storage.getString('token'),
  setToken: (token: string): void => storage.set('token', token),
  removeToken: (): boolean => storage.remove('token'),
  isLoggedIn: (): boolean => !!storage.getString('token'),
  setUser: (user: object): void => storage.set('user', JSON.stringify(user)),
  getUser: () => {
    const raw = storage.getString('user');
    return raw ? JSON.parse(raw) : null;
  },
  removeUser: (): boolean => storage.remove('user'),
  clear: (): void => {
    storage.remove('token');
    storage.remove('user');
  },

  // ── Tour state ─────────────────────────────────────────────────────────────
  hasTourCompleted: (key: string): boolean =>
    storage.getString(key) === 'true',
  completeTour: (key: string): void => storage.set(key, 'true'),
  getDailyTourDate: (): string | undefined =>
    storage.getString('tour_daily_date'),
  setDailyTourDate: (date: string): void =>
    storage.set('tour_daily_date', date),
};

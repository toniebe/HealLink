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
};

export function createMMKV() {
  return {
    getString: (key) => localStorage.getItem(key) ?? undefined,
    set: (key, value) => localStorage.setItem(key, String(value)),
    getBoolean: (key) => {
      const val = localStorage.getItem(key);
      return val === null ? undefined : val === 'true';
    },
    getNumber: (key) => {
      const val = localStorage.getItem(key);
      return val === null ? undefined : Number(val);
    },
    remove: (key) => {
      localStorage.removeItem(key);
      return true;
    },
    clearAll: () => localStorage.clear(),
    getAllKeys: () => Object.keys(localStorage),
    contains: (key) => localStorage.getItem(key) !== null,
  };
}

export class MMKV {
  constructor() {
    this._impl = createMMKV();
  }
  getString(key) { return this._impl.getString(key); }
  set(key, value) { return this._impl.set(key, value); }
  getBoolean(key) { return this._impl.getBoolean(key); }
  getNumber(key) { return this._impl.getNumber(key); }
  remove(key) { return this._impl.remove(key); }
  clearAll() { return this._impl.clearAll(); }
  getAllKeys() { return this._impl.getAllKeys(); }
  contains(key) { return this._impl.contains(key); }
}

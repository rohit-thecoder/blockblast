import AsyncStorage from '@react-native-async-storage/async-storage';

/** TypeScript/Jest fallback; Metro resolves the native or web implementation. */
export const getStoredItem = (key: string) => AsyncStorage.getItem(key);
export const setStoredItem = (key: string, value: string) => AsyncStorage.setItem(key, value);

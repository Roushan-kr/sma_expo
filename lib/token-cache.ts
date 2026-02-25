import * as SecureStore from 'expo-secure-store';
import { tokenCache as TokenCache } from '@clerk/clerk-expo/token-cache';

export const tokenCache: typeof TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // silently fail
    }
  },
  async clearToken(key: string) {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // silently fail
    }
  },
};

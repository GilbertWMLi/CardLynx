import { User } from '../types';
import { api } from './api';

export const StorageService = {
  // --- Auth Methods (Via Local Server API) ---

  async register(username: string, password: string): Promise<User> {
    const user = await api.register(username, password);
    // FIX: Persist session ID on register so the user is considered logged in immediately
    localStorage.setItem('lexideck:session_user', JSON.stringify(user));
    return user;
  },

  async login(username: string, password: string): Promise<User> {
    const user = await api.login(username, password);
    // Persist session ID
    localStorage.setItem('lexideck:session_user', JSON.stringify(user));
    return user;
  },

  async logout() {
    localStorage.removeItem('lexideck:session_user');
  },

  async getCurrentUser(): Promise<User | null> {
    const userStr = localStorage.getItem('lexideck:session_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
import { Flashcard, User } from '../types';

// Default to localhost, but allow overriding via localStorage
export const getBaseUrl = () => {
  return localStorage.getItem('lexideck_server_url') || 'http://localhost:3001';
};

const getApiUrl = () => `${getBaseUrl()}/api`;

export const api = {
  async register(username: string, password: string): Promise<User> {
    const res = await fetch(`${getApiUrl()}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async login(username: string, password: string): Promise<User> {
    const res = await fetch(`${getApiUrl()}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!res.ok) throw new Error('Invalid credentials');
    return res.json();
  },

  async getCards(userId: string): Promise<Flashcard[]> {
    try {
      const res = await fetch(`${getApiUrl()}/cards?userId=${userId}`);
      if (!res.ok) return [];
      return res.json();
    } catch (e) {
      console.error("Connection failed", e);
      return [];
    }
  },

  async saveCard(userId: string, card: Flashcard): Promise<void> {
    await fetch(`${getApiUrl()}/cards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, card })
    });
  },

  async deleteCard(userId: string, cardId: string): Promise<void> {
    await fetch(`${getApiUrl()}/cards/${cardId}?userId=${userId}`, {
      method: 'DELETE'
    });
  },

  async uploadImage(userId: string, file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const res = await fetch(`${getApiUrl()}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              imageBase64: reader.result,
              filename: file.name
            })
          });
          
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          resolve(data.url);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  }
};
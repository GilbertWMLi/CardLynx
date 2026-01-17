import { Flashcard, User, Language } from '../types';

// Default to localhost, but allow overriding via localStorage
export const getBaseUrl = () => {
  const stored = localStorage.getItem('lexideck_server_url');
  if (stored) return stored.trim(); // Safety trim to prevent "Failed to parse URL" errors
  
  // Dynamic default: use the same hostname as the browser page
  // This fixes issues where accessing via 192.168.x.x fails because API tries localhost
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3001`;
  }
  
  return 'http://localhost:3001';
};

const getApiUrl = () => `${getBaseUrl()}/api`;

// Helper to handle response errors gracefully
const handleResponse = async (res: Response) => {
  const contentType = res.headers.get("content-type");
  
  // If we get HTML back (like from Vite dev server), the user used the wrong port
  if (contentType && contentType.includes("text/html")) {
    throw new Error(`Connection Error: You are connected to the Web Port (e.g. 5173). Please change Settings to use the Server Port (3001). Target: ${getBaseUrl()}`);
  }

  if (!res.ok) {
    // Try to parse JSON error message, fallback to text
    try {
      const errorJson = await res.json();
      throw new Error(errorJson.error || 'Request failed');
    } catch (e: any) {
      // If parsing failed (and we already checked for HTML above), throw raw text or default
      if (e.message.includes('Web Port')) throw e;
      throw new Error(await res.text() || 'Unknown server error');
    }
  }
  
  return res.json();
};

export const api = {
  async register(username: string, password: string): Promise<User> {
    const targetUrl = `${getApiUrl()}/register`;
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return handleResponse(res);
    } catch (e: any) {
      // Handle network errors (connection refused)
      if (e.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to server at ${getBaseUrl()}. Check IP/Port.`);
      }
      // Handle URL parse errors
      if (e.message.includes('Failed to parse URL')) {
         throw new Error('Invalid Server URL format. Please go to settings and save again.');
      }
      throw e;
    }
  },

  async login(username: string, password: string): Promise<User> {
    const targetUrl = `${getApiUrl()}/login`;
    try {
      const res = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      return handleResponse(res);
    } catch (e: any) {
      if (e.message.includes('Failed to fetch')) {
        throw new Error(`Could not connect to server at ${getBaseUrl()}. Check IP/Port.`);
      }
      throw e;
    }
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
  },

  async generateAudio(userId: string, text: string, language: Language): Promise<string> {
    const targetUrl = `${getApiUrl()}/generate-audio`;
    console.log(`[API] Sending Audio Request to: ${targetUrl}`);
    console.log(`[API] Payload:`, { userId, text, language });

    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, text, language })
    });
    const data = await handleResponse(res);
    return data.url;
  }
};
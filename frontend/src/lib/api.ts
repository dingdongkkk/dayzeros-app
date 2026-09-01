import { Task, SoundVolumes, Scene } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function fetchWithCredentials(url: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}

export interface BackendTask {
  id: string;
  t: string;
  done: boolean;
}

export interface BackendStats {
  todayMinutes: number;
  streak: number;
  scene: Scene;
  volumes: SoundVolumes;
}

export const api = {
  // Tasks API
  async getTasks(): Promise<BackendTask[]> {
    return fetchWithCredentials('/api/tasks');
  },

  async createTask(text: string): Promise<BackendTask> {
    return fetchWithCredentials('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({ t: text }),
    });
  },

  async updateTask(id: string, data: { t?: string; done?: boolean }): Promise<void> {
    return fetchWithCredentials(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTask(id: string): Promise<void> {
    return fetchWithCredentials(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats & Settings API
  async getStats(): Promise<BackendStats> {
    return fetchWithCredentials('/api/stats');
  },

  async bankSession(minutes: number = 25): Promise<void> {
    return fetchWithCredentials('/api/stats/session', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  async saveSettings(settings: {
    scene?: Scene;
    volRain?: number;
    volCrickets?: number;
    volWind?: number;
  }): Promise<void> {
    return fetchWithCredentials('/api/stats/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },
};

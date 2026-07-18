import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDevotionsForMonth, getTodayDevotional, months } from "../data/DevotionalData";
import { cleanDevotional, cleanText } from "../utils/textCleanup";

const configuredBaseUrl = (process.env.EXPO_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
export const API_BASE_URL = `${configuredBaseUrl}/api/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 3000,
});

// Attach Authorization header from AsyncStorage (if present) on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: on 401 try silent refresh once, then retry
let isRefreshing = false;
let refreshQueue = [];

async function processQueue(error, token = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((e) => Promise.reject(e));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshRes = await api.post('/auth/refresh');
        const newToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        if (newToken) {
          await AsyncStorage.setItem('accessToken', newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

const monthKeys = ["JAN", "FEB", "MAR", "APRIL", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];

function normalizeDevotional(item, index = 0, month = "") {
  if (!item) return null;
  const body = item.body || item.fullBody || "";
  return {
    id: item.id || `${month || item.date || "devotional"}-${index + 1}`,
    day: item.day || index + 1,
    date: item.date || `${month} ${index + 1}`,
    title: cleanText(item.title || "Daily Devotional", { compact: true }),
    verse: cleanText(item.verse || ""),
    body: cleanText(body),
    fullBody: cleanText(item.fullBody || body),
    confession: item.confession ? cleanText(item.confession) : null,
    prayer: item.prayer ? cleanText(item.prayer) : null,
    readTime: item.readTime || Math.max(2, Math.ceil(body.split(/\s+/).length / 180)),
  };
}

async function getUserId() {
  let userId = await AsyncStorage.getItem("userId");
  if (!userId) {
    userId = `user_${Date.now()}`;
    await AsyncStorage.setItem("userId", userId);
  }
  return userId;
}

async function tryRemote(path, fallback) {
  try {
    const response = await api.get(path);
    return response.data?.data ?? response.data;
  } catch (error) {
    return fallback();
  }
}

export const devotionalAPI = {
  getTodayDevotional: async () =>
    tryRemote("/devotionals/today", () => normalizeDevotional(getTodayDevotional())).then(cleanDevotional),

  getWeeklyDevotionals: async () =>
    tryRemote("/devotionals/weekly", () => {
      const today = new Date();
      const month = monthKeys[today.getMonth()];
      const day = today.getDate() - 1;
      const data = months[month] || [];
      return data.slice(day, day + 7).map((item, index) => normalizeDevotional(item, day + index, month));
    }).then((items) => items.map(cleanDevotional)),

  getDevotionalsByMonth: async (month) =>
    tryRemote(`/devotionals/month/${month}`, () =>
      (getDevotionsForMonth(month) || []).map((item, index) => normalizeDevotional(item, index, month))
    ).then((items) => items.map(cleanDevotional)),

  getDevotionalById: async (id) =>
    tryRemote(`/devotionals/${id}`, () => {
      const all = Object.entries(months).flatMap(([month, items]) =>
        items.map((item, index) => normalizeDevotional(item, index, month))
      );
      return all.find((item) => item.id === id) || all[0];
    }).then(cleanDevotional),

  shareDevotion: async (id, platform) => ({ id, platform, shared: true }),
};

export const bibleAPI = {
  getVersions: async () =>
    tryRemote('/bible/versions', () => []),

  getBooksForVersion: async (versionId) =>
    tryRemote(`/bible/versions/${versionId}/books`, () => []),

  getChaptersForBook: async (bookId) =>
    tryRemote(`/bible/books/${bookId}/chapters`, () => []),

  getVersesForChapter: async (chapterId) =>
    tryRemote(`/bible/chapters/${chapterId}/verses`, () => []),
};

export const dictionaryAPI = {
  getWord: async (word) => tryRemote(`/dictionary/${encodeURIComponent(word)}`, () => null),
  getCrossReferences: async (word) => tryRemote(`/dictionary/${encodeURIComponent(word)}/crossrefs`, () => []),
};

export const notesAPI = {
  saveVerseNote: async (payload) => {
    try {
      const res = await api.post('/verse-notes', payload);
      return res.data?.data ?? null;
    } catch (e) {
      return null;
    }
  },
  listVerseNotes: async (userId) => {
    try {
      const res = await api.get('/verse-notes', { params: userId ? { userId } : {} });
      return res.data?.data ?? [];
    } catch (e) {
      return [];
    }
  },
};

export const appAPI = {
  getVersion: async () => {
    try {
      const res = await api.get('/app/version');
      return res.data?.data ?? res.data;
    } catch (e) {
      return null;
    }
  },
};

export const audioAPI = {
  getLibrary: async () => {
    try {
      const res = await api.get('/audio');
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.items)) return data.items;
      return [];
    } catch (e) {
      return [];
    }
  },
};

export const userAPI = {
  getUserData: async () => {
    const userId = await getUserId();
    const readingHistory = JSON.parse((await AsyncStorage.getItem(`${userId}.readingHistory`)) || "[]");
    return {
      id: userId,
      readingHistory,
      progressPercentage: Math.min(100, Math.round((readingHistory.length / 365) * 100)),
    };
  },

  // Server login: returns user and stores accessToken in AsyncStorage
  login: async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data?.data || res.data;
      if (data?.accessToken) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        if (data?.refreshToken) {
          try { await AsyncStorage.setItem('refreshToken', data.refreshToken); } catch (e) {}
        }
      }
      return data;
    } catch (e) {
      return null;
    }
  },

  register: async (name, email, password) => {
    try {
      const res = await api.post('/auth/register', { name, email, password });
      const data = res.data?.data || res.data;
      if (data?.accessToken) {
        await AsyncStorage.setItem('accessToken', data.accessToken);
        if (data?.refreshToken) {
          try { await AsyncStorage.setItem('refreshToken', data.refreshToken); } catch (e) {}
        }
      }
      return data;
    } catch (e) {
      return null;
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await api.post('/auth/forgot-password', { email });
      return res.data?.data || res.data;
    } catch (e) {
      return null;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('accessToken');
      return true;
    } catch (e) {
      return false;
    }
  },

  addBookmark: async (devotionalId) => ({ devotionalId, saved: true }),
  removeBookmark: async (devotionalId) => ({ devotionalId, saved: false }),

  recordReading: async (devotionalId) => {
    const userId = await getUserId();
    const key = `${userId}.readingHistory`;
    const readingHistory = JSON.parse((await AsyncStorage.getItem(key)) || "[]");
    const next = [devotionalId, ...readingHistory.filter((item) => item !== devotionalId)].slice(0, 365);
    await AsyncStorage.setItem(key, JSON.stringify(next));
    return { devotionalId, readingHistory: next };
  },

  updatePreferences: async (theme, fontSize) => ({ theme, fontSize }),
};

export const contactAPI = {
  sendMessage: async (payload) => {
    try {
      const res = await api.post('/contact', payload);
      return res.data?.data ?? res.data;
    } catch (e) {
      return null;
    }
  },
};

export const supportAPI = {
  getFaq: async () => {
    try {
      const res = await api.get('/support/faq');
      return res.data?.data || null;
    } catch (e) {
      return null;
    }
  },
  sendLog: async (payload) => {
    try {
      const res = await api.post('/support/logs', payload);
      return res.data?.data || null;
    } catch (e) {
      return null;
    }
  },
};

export default api;

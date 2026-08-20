import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { notesAPI, userAPI } from "../services/api";

const AppContext = createContext(null);

const STORAGE_KEYS = {
  session: "h2h.session",
  subscription: "h2h.subscription",
  bible: "h2h.bible",
  audio: "h2h.audio",
  navigation: "h2h.navigation",
  profile: "h2h.profile",
  devotional: "h2h.devotional",
};

const defaultSubscription = {
  tier: "free",
  status: "guest",
  trialEligible: true,
  renewsAt: null,
};

const defaultBibleState = {
  bookmarks: [],
  downloads: [],
  highlights: [],
  notes: [],
  history: [],
  fontScale: 1,
  theme: "paper",
  translation: "KJV",
  selectedBibleVersionId: null,
};

const defaultAudioState = {
  currentTrack: null,
  isPlaying: false,
  position: 0,
  duration: 1800,
  queue: [],
  downloaded: [],
  recentlyPlayed: [],
  speed: 1,
  sleepTimer: null,
};

const defaultProfileState = {
  displayName: "",
  language: "en",
  screenOrientation: "any",
  prayerJournal: [],
  savedNotes: [],
  notificationPrefs: {
    morningDevotional: true,
    prayerReminder: true,
    readingReminder: true,
    announcements: true,
  },
};

const defaultDevotionalState = {
  readIds: [],
  bookmarks: [],
  downloads: [],
};

export function AppStateProvider({ children }) {
  const [booted, setBooted] = useState(false);
  const [session, setSession] = useState({ mode: "guest", user: null });
  const [subscription, setSubscription] = useState(defaultSubscription);
  const [bibleState, setBibleState] = useState(defaultBibleState);
  const [audioState, setAudioState] = useState(defaultAudioState);
  const [navigationState, setNavigationState] = useState(null);
  const [profileState, setProfileState] = useState(defaultProfileState);
  const [devotionalState, setDevotionalState] = useState(defaultDevotionalState);

  useEffect(() => {
    async function load() {
      try {
        const [savedSession, savedSubscription, savedBible, savedAudio, savedNavigation, savedProfile, savedDevotional] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.session),
          AsyncStorage.getItem(STORAGE_KEYS.subscription),
          AsyncStorage.getItem(STORAGE_KEYS.bible),
          AsyncStorage.getItem(STORAGE_KEYS.audio),
          AsyncStorage.getItem(STORAGE_KEYS.navigation),
          AsyncStorage.getItem(STORAGE_KEYS.profile),
          AsyncStorage.getItem(STORAGE_KEYS.devotional),
        ]);

        if (savedSession) setSession(JSON.parse(savedSession));
        if (savedSubscription) setSubscription(JSON.parse(savedSubscription));
        if (savedBible) setBibleState({ ...defaultBibleState, ...JSON.parse(savedBible) });
        if (savedAudio) setAudioState({ ...defaultAudioState, ...JSON.parse(savedAudio) });
        if (savedNavigation) setNavigationState(JSON.parse(savedNavigation));
        if (savedProfile) setProfileState({ ...defaultProfileState, ...JSON.parse(savedProfile) });
        if (savedDevotional) setDevotionalState({ ...defaultDevotionalState, ...JSON.parse(savedDevotional) });
      } catch (error) {
        console.warn("Unable to restore app state", error);
      } finally {
        setBooted(true);
      }
    }

    load();
  }, []);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
  }, [booted, session]);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.subscription, JSON.stringify(subscription));
  }, [booted, subscription]);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.bible, JSON.stringify(bibleState));
  }, [booted, bibleState]);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.audio, JSON.stringify(audioState));
  }, [booted, audioState]);

  useEffect(() => {
    if (!audioState.isPlaying || !audioState.duration) return undefined;

    const timer = setInterval(() => {
      setAudioState((current) => {
        const nextPosition = Math.min(current.duration, current.position + 1);
        return nextPosition >= current.duration
          ? { ...current, position: nextPosition, isPlaying: false }
          : { ...current, position: nextPosition };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [audioState.isPlaying, audioState.duration]);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profileState));
  }, [booted, profileState]);

  useEffect(() => {
    if (booted) AsyncStorage.setItem(STORAGE_KEYS.devotional, JSON.stringify(devotionalState));
  }, [booted, devotionalState]);

  const isPremium = subscription.tier === "premium" && subscription.status !== "expired";

  const signIn = async ({ email, name, premium = false }) => {
    const profile = {
      id: premium ? "demo_premium_user" : `user_${Date.now()}`,
      name: name || email?.split("@")[0] || "Friend",
      email: email || "guest@hearttoheart.app",
      verified: true,
    };
    setSession({ mode: "authenticated", user: profile });
    setProfileState((current) => ({ ...current, displayName: profile.name }));
    if (premium) {
      const renewsAt = new Date();
      renewsAt.setFullYear(renewsAt.getFullYear() + 1);
      setSubscription({
        tier: "premium",
        status: "active",
        plan: "yearly-demo",
        trialEligible: false,
        renewsAt: renewsAt.toISOString(),
        providers: ["Apple IAP", "Google Play Billing", "Stripe", "Flutterwave"],
      });
    } else {
      setSubscription((current) => ({ ...current, status: current.tier === "premium" ? "active" : "free" }));
    }
    return profile;
  };

  const signInServer = async ({ email, password }) => {
    try {
      const res = await userAPI.login(email, password);
      if (!res) return null;
      // backend returns { accessToken, user }
      const user = res.user || res.data?.user || res.data || res;
      const profile = {
        id: user._id || user.id || user.id,
        name: user.name || user.displayName || email?.split('@')[0],
        email: user.email || email,
        verified: true,
      };
      setSession({ mode: 'authenticated', user: profile });
      setProfileState((current) => ({ ...current, displayName: profile.name }));
      return profile;
    } catch (e) {
      return null;
    }
  };

  const continueAsGuest = () => {
    setSession({ mode: "guest", user: null });
    setSubscription((current) => ({ ...current, tier: "free", status: "guest" }));
  };

  const logout = () => {
    setSession({ mode: "guest", user: null });
    setSubscription(defaultSubscription);
    try {
      userAPI.logout();
    } catch (e) {}
  };

  const persistNavigationState = (state) => {
    setNavigationState(state);
    AsyncStorage.setItem(STORAGE_KEYS.navigation, JSON.stringify(state));
  };

  const activatePremium = (plan = "monthly") => {
    const renewsAt = new Date();
    renewsAt.setMonth(renewsAt.getMonth() + (plan === "yearly" ? 12 : 1));
    setSubscription({
      tier: "premium",
      status: "active",
      plan,
      trialEligible: false,
      renewsAt: renewsAt.toISOString(),
      providers: ["Apple IAP", "Google Play Billing", "Stripe", "Flutterwave"],
    });
  };

  const addReadingHistory = (entry) => {
    setBibleState((current) => ({
      ...current,
      history: [
        { ...entry, readAt: new Date().toISOString() },
        ...current.history.filter((item) => item.key !== entry.key),
      ].slice(0, 20),
    }));
  };

  const saveBibleNote = (verse, note) => {
    setBibleState((current) => ({
      ...current,
      notes: [
        { ...verse, note, updatedAt: new Date().toISOString() },
        ...current.notes.filter((item) => item.key !== verse.key),
      ].slice(0, 100),
    }));
    // try to sync to backend (best-effort)
    try {
      const userId = session?.user?.id || null;
      notesAPI.saveVerseNote({ userId, key: verse.key, book: verse.book, chapter: verse.chapter, verse: verse.verse, content: note });
    } catch (e) {
      // ignore sync errors
    }
  };

  const toggleVerseBookmark = (verse) => {
    setBibleState((current) => {
      const exists = current.bookmarks.some((item) => item.key === verse.key);
      return {
        ...current,
        bookmarks: exists
          ? current.bookmarks.filter((item) => item.key !== verse.key)
          : [verse, ...current.bookmarks],
      };
    });
  };

  const toggleVerseHighlight = (verse) => {
    setBibleState((current) => {
      const exists = current.highlights.some((item) => item.key === verse.key);
      return {
        ...current,
        highlights: exists
          ? current.highlights.filter((item) => item.key !== verse.key)
          : [verse, ...current.highlights],
      };
    });
  };

  const updateBiblePreferences = (patch) => {
    setBibleState((current) => ({ ...current, ...patch }));
  };

  const playTrack = (track, queue = []) => {
    setAudioState((current) => ({
      ...current,
      currentTrack: track,
      queue,
      isPlaying: false,
      position: 0,
      duration: track?.durationSeconds || current.duration,
      recentlyPlayed: track ? [track, ...current.recentlyPlayed.filter((item) => item.id !== track.id)].slice(0, 20) : current.recentlyPlayed,
    }));
  };

  const togglePlayback = () => {
    setAudioState((current) => ({ ...current, isPlaying: !current.isPlaying }));
  };

  const stopPlayback = () => {
    setAudioState((current) => ({ ...current, isPlaying: false, position: 0 }));
  };

  const seekAudio = (position) => {
    setAudioState((current) => ({
      ...current,
      position: Math.max(0, Math.min(position, current.duration)),
    }));
  };

  const toggleDownload = (track) => {
    setAudioState((current) => {
      const exists = current.downloaded.some((item) => item.id === track.id);
      return {
        ...current,
        downloaded: exists
          ? current.downloaded.filter((item) => item.id !== track.id)
          : [track, ...current.downloaded],
      };
    });
  };

  const toggleBibleDownload = (passage) => {
    if (!passage?.key) return;
    setBibleState((current) => {
      const exists = current.downloads.some((item) => item.key === passage.key);
      return {
        ...current,
        downloads: exists ? current.downloads.filter((item) => item.key !== passage.key) : [passage, ...current.downloads],
      };
    });
  };

  const toggleDevotionalDownload = (item) => {
    if (!item?.id) return;
    setDevotionalState((current) => {
      const exists = current.downloads.some((saved) => saved.id === item.id);
      return {
        ...current,
        downloads: exists ? current.downloads.filter((saved) => saved.id !== item.id) : [item, ...current.downloads],
      };
    });
  };

  const setAudioSpeed = (speed) => {
    setAudioState((current) => ({ ...current, speed }));
  };

  const clearTrack = () => {
    setAudioState((current) => ({
      ...current,
      currentTrack: null,
      isPlaying: false,
      position: 0,
    }));
  };

  const addPrayerEntry = (body) => {
    if (!body?.trim()) return;
    setProfileState((current) => ({
      ...current,
      prayerJournal: [
        { id: `prayer_${Date.now()}`, body: body.trim(), createdAt: new Date().toISOString(), answered: false },
        ...current.prayerJournal,
      ].slice(0, 100),
    }));
  };

  const updateProfile = (patch) => {
    setProfileState((current) => ({ ...current, ...patch }));
    if (patch.displayName) {
      setSession((current) => ({
        ...current,
        user: current.user ? { ...current.user, name: patch.displayName } : current.user,
      }));
    }
  };

  const recordDevotionalRead = (devotionalId) => {
    if (!devotionalId) return;
    setDevotionalState((current) => ({
      ...current,
      readIds: [devotionalId, ...current.readIds.filter((item) => item !== devotionalId)].slice(0, 365),
    }));
  };

  const toggleDevotionalBookmark = (item) => {
    if (!item?.id) return;
    setDevotionalState((current) => {
      const exists = current.bookmarks.some((saved) => saved.id === item.id);
      return {
        ...current,
        bookmarks: exists ? current.bookmarks.filter((saved) => saved.id !== item.id) : [item, ...current.bookmarks],
      };
    });
  };

  const value = useMemo(
    () => ({
      booted,
      session,
      subscription,
      isPremium,
      bibleState,
      audioState,
      navigationState,
      profileState,
      devotionalState,
      signIn,
      signInServer,
      continueAsGuest,
      logout,
      activatePremium,
      persistNavigationState,
      addReadingHistory,
      saveBibleNote,
      toggleVerseBookmark,
      toggleVerseHighlight,
      updateBiblePreferences,
      playTrack,
      togglePlayback,
      stopPlayback,
      seekAudio,
      toggleDownload,
      toggleBibleDownload,
      toggleDevotionalDownload,
      setAudioSpeed,
      clearTrack,
      addPrayerEntry,
      updateProfile,
      recordDevotionalRead,
      toggleDevotionalBookmark,
    }),
    [booted, session, subscription, isPremium, bibleState, audioState, navigationState, profileState, devotionalState]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const value = useContext(AppContext);
  if (!value) throw new Error("useAppState must be used inside AppStateProvider");
  return value;
}

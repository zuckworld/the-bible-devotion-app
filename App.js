import React, { useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { NavigationContainer, useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  List,
  Modal,
  PaperProvider,
  Portal,
  Searchbar,
  Snackbar,
  Switch,
  Text,
  TextInput,
} from "react-native-paper";
import { WebView } from 'react-native-webview';
import BookmarkProvider from "./bookmarks/BookmarkContext";
import { AppStateProvider, useAppState } from "./contexts/AppContext";
import { PaperThemeProvider, PaperThemeContext } from "./components/PaperThemeContext";
import { API_BASE_URL, devotionalAPI, bibleAPI, userAPI, appAPI } from "./services/api";
import { cleanText } from "./utils/textCleanup";
import { findMatchingLocalBook } from "./utils/bibleFallback";
import kjv from "./assets/bible/kjv.json";
import hymnData from "./assets/hymns.json";
import ConnectWithUs from "./screens/ConnectWithUs";
import ExternalAuthScreen from "./screens/AuthScreen";
import FAQScreen from "./screens/FAQScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const premiumFeatures = {
  Devotionals: "Daily devotionals, prayers, confessions, and reflection notes.",
  Audio: "Audio devotionals, sermons, podcasts, worship playlists, and background playback.",
  Plans: "Guided reading plans with streaks, milestones, and offline access.",
  Prayer: "Prayer guides, private journal prompts, and AI devotional assistance.",
  Downloads: "Save devotionals, audio, plans, and playlists for offline use.",
  Assistant: "Personalized devotional recommendations and AI faith companion.",
};

const audioTracks = [
  { id: "daily-audio", title: "Today's Audio Devotional", host: "Heart to Heart", duration: "12:40", durationSeconds: 760, type: "Devotional" },
  { id: "sermon-grace", title: "Grace for the Quiet Place", host: "P. Olawoyin", duration: "34:15", durationSeconds: 2055, type: "Sermon" },
  { id: "podcast-prayer", title: "Prayer That Shapes the Morning", host: "H2H Podcast", duration: "22:08", durationSeconds: 1328, type: "Podcast" },
  { id: "worship-still", title: "Still Waters Worship", host: "Premium Worship", duration: "18:02", durationSeconds: 1082, type: "Playlist" },
];

const planItems = [
  { id: "fasting", title: "21 Days of Consecration", progress: 35, days: 21 },
  { id: "peace", title: "Finding Peace in Scripture", progress: 12, days: 14 },
  { id: "purpose", title: "Purpose, Calling, and Courage", progress: 0, days: 30 },
];

const weekDays = ["M", "T", "W", "T", "F", "S", "S"];
const hymnLibrary = hymnData?.hymns || [];

const premiumRows = [
  ["book-open-variant", "Prayerful courses, readings, audio", "Prepare your heart before the day starts."],
  ["fire", "Daily streaks and guided spiritual growth", "Build a rhythm of Scripture, prayer, and reflection."],
  ["download-circle", "Offline devotionals and premium downloads", "Keep your library available without a connection."],
  ["robot-outline", "AI Bible and prayer companions", "Provider-ready architecture for Gemini or another AI service."],
];

function todayLabel() {
  return new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" }).toUpperCase();
}

function firstName(session, profileState) {
  return profileState.displayName || session.user?.name || "Friend";
}

function normalizeBooks() {
  if (Array.isArray(kjv)) return kjv;
  return Object.keys(kjv || {}).map((key) => ({
    name: key,
    abbrev: kjv[key].abbrev || key.slice(0, 3).toLowerCase(),
    chapters: kjv[key].chapters || kjv[key],
  }));
}

function useBooks() {
  return useMemo(() => normalizeBooks(), []);
}

function Screen({ children, padded = true, scroll = true, style }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const content = (
    <View style={[padded && styles.screenPadding, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView edges={["top", "left", "right"]} style={[styles.flex, { backgroundColor: currentTheme.colors.background }]}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

function Header({ title, subtitle, action, back }) {
  const navigation = useNavigation();
  const { currentTheme } = useContext(PaperThemeContext);

  return (
    <View style={styles.header}>
      <View style={styles.headerTitleWrap}>
        {back && (
          <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={currentTheme.colors.primary} />
          </Pressable>
        )}
        <View style={styles.flex}>
          <Text variant="headlineSmall" style={[styles.bold, { color: currentTheme.colors.onBackground }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text variant="bodySmall" style={{ color: currentTheme.colors.outline, marginTop: 3 }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      {action}
    </View>
  );
}

function SkeletonCard() {
  const { currentTheme } = useContext(PaperThemeContext);
  return (
    <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
      <Card.Content>
        <View style={[styles.skeletonLine, { width: "45%", backgroundColor: currentTheme.colors.surfaceVariant }]} />
        <View style={[styles.skeletonLine, { width: "90%", backgroundColor: currentTheme.colors.surfaceVariant }]} />
        <View style={[styles.skeletonLine, { width: "72%", backgroundColor: currentTheme.colors.surfaceVariant }]} />
      </Card.Content>
    </Card>
  );
}

function EmptyState({ icon = "inbox-outline", title, body, action }) {
  const { currentTheme } = useContext(PaperThemeContext);
  return (
    <View style={[styles.emptyState, { backgroundColor: currentTheme.colors.surface }]}>
      <MaterialCommunityIcons name={icon} size={38} color={currentTheme.colors.primary} />
      <Text variant="titleMedium" style={[styles.bold, styles.centerText, { color: currentTheme.colors.onSurface, marginTop: 10 }]}>
        {title}
      </Text>
      <Text variant="bodySmall" style={[styles.centerText, { color: currentTheme.colors.outline, marginTop: 6 }]}>
        {body}
      </Text>
      {action}
    </View>
  );
}

function LockedCard({ title, body, icon = "lock-outline", onUpgrade }) {
  const { currentTheme } = useContext(PaperThemeContext);
  return (
    <Card style={[styles.card, styles.lockedCard, { backgroundColor: currentTheme.colors.surface }]}>
      <Card.Content style={styles.row}>
        <View style={[styles.iconTile, { backgroundColor: currentTheme.colors.primaryContainer }]}>
          <MaterialCommunityIcons name={icon} size={24} color={currentTheme.colors.primary} />
        </View>
        <View style={styles.flex}>
          <Text variant="titleSmall" style={[styles.bold, { color: currentTheme.colors.onSurface }]}>{title}</Text>
          <Text variant="bodySmall" style={{ color: currentTheme.colors.outline, marginTop: 4 }}>{body}</Text>
        </View>
        <Button mode="contained" onPress={onUpgrade} compact>Upgrade</Button>
      </Card.Content>
    </Card>
  );
}

function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => navigation.replace("Onboarding"), 850);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <LinearGradient colors={["#fff7f0", "#f9eef3", "#edf7f1"]} style={styles.splash}>
      <Image source={require("./assets/icon.png")} style={styles.splashLogo} />
      <Text variant="headlineMedium" style={[styles.bold, { color: "#7a2e44" }]}>Heart to Heart</Text>
      <ActivityIndicator style={{ marginTop: 18 }} color="#E94E77" />
    </LinearGradient>
  );
}

function OnboardingScreen({ navigation }) {
  const { continueAsGuest } = useAppState();
  const slides = [
    { icon: "book-open-variant", title: "Read freely", body: "The full KJV Bible, chapter navigation, search, bookmarks, highlights, and history stay free." },
    { icon: "heart-pulse", title: "Grow daily", body: "Premium unlocks devotionals, study plans, prayer guides, offline downloads, and recommendations." },
    { icon: "headphones", title: "Listen anywhere", body: "Audio devotionals, sermons, podcasts, worship playlists, and background playback are ready for subscription wiring." },
  ];

  return (
    <Screen>
      <Header title="Welcome" subtitle="A devotional rhythm designed for mobile." />
      {slides.map((slide) => (
        <Card key={slide.title} style={styles.card}>
          <Card.Content style={styles.row}>
            <View style={styles.iconTile}>
              <MaterialCommunityIcons name={slide.icon} size={26} color="#E94E77" />
            </View>
            <View style={styles.flex}>
              <Text variant="titleMedium" style={styles.bold}>{slide.title}</Text>
              <Text variant="bodyMedium" style={styles.muted}>{slide.body}</Text>
            </View>
          </Card.Content>
        </Card>
      ))}
      <Button mode="contained" onPress={() => navigation.replace("Auth")} style={styles.primaryButton}>Login or create account</Button>
      <Button
        mode="text"
        onPress={() => {
          continueAsGuest();
          navigation.replace("MainTabs");
        }}
      >
        Continue as guest
      </Button>
    </Screen>
  );
}

function AuthScreen({ navigation }) {
  const { signInServer, continueAsGuest } = useAppState();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const submit = async () => {
    if (loading) return; // prevent double submit
    if (!email.includes("@")) {
      setSnackbar("Enter a valid email address.");
      return;
    }
    if (mode === "forgot") {
      setLoading(true);
      const result = await userAPI.forgotPassword(email.trim());
      setLoading(false);
      setSnackbar(result?.message || "If the email exists, a reset link was sent.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        setSnackbar("Enter your name.");
        return;
      }
      if (!password) {
        setSnackbar("Enter a password.");
        return;
      }
      setLoading(true);
      const result = await userAPI.register(name.trim(), email.trim(), password);
      setLoading(false);
      if (!result) {
        setSnackbar("Unable to create account. Try again.");
        return;
      }
      try { await AsyncStorage.setItem('rememberMe', rememberMe ? '1' : '0'); } catch(e){}
      navigation.replace("MainTabs");
      return;
    }
    if (!password) {
      setSnackbar("Enter your password.");
      return;
    }
    setLoading(true);
    const profile = await signInServer({ email: email.trim(), password });
    setLoading(false);
    if (!profile) {
      setSnackbar("Login failed. Check your email and password.");
      return;
    }
    try { await AsyncStorage.setItem('rememberMe', rememberMe ? '1' : '0'); } catch(e){}
    navigation.replace("MainTabs");
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Screen>
        <Header title={mode === "signup" ? "Create account" : mode === "forgot" ? "Reset password" : "Welcome back"} subtitle="Sign in to sync your notes, bookmarks, and devotional progress." />
        {mode === "signup" && (
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="Jane Doe"
          />
        )}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          mode="outlined"
          style={styles.input}
          placeholder="you@example.com"
        />
        {mode !== "forgot" && (
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword((s) => !s)} />}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your password"
          />
        )}
        {mode !== 'forgot' && (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Switch value={rememberMe} onValueChange={setRememberMe} />
            <Text style={{ marginLeft: 8 }}>Remember me</Text>
          </View>
        )}
        <Button mode="contained" onPress={submit} loading={loading} style={styles.primaryButton}>
          {mode === "forgot" ? "Send reset link" : mode === "signup" ? "Create account" : "Login"}
        </Button>
        <Button mode="text" onPress={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "I already have an account" : "Create a new account"}</Button>
        <Button mode="text" onPress={() => setMode(mode === "forgot" ? "login" : "forgot")}>{mode === "forgot" ? "Back to login" : "Forgot password?"}</Button>
        <Divider style={{ marginVertical: 16 }} />
        <Button mode="outlined" onPress={() => { continueAsGuest(); navigation.replace("MainTabs"); }}>
          Continue as guest
        </Button>
        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar("")}>{snackbar}</Snackbar>
      </Screen>
    </KeyboardAvoidingView>
  );
}

function HomeScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const { isPremium, bibleState, session, profileState, devotionalState, audioState } = useAppState();
  const [today, setToday] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    devotionalAPI.getTodayDevotional().then(setToday).finally(() => setLoading(false));
  }, []);

  const lastRead = bibleState.history[0];
  const streak = Math.max(1, Math.min(100, bibleState.history.length + devotionalState.readIds.length));
  const completion = Math.min(100, Math.round((streak / 30) * 100));
  const activeDayIndex = (new Date().getDay() + 6) % 7;

  return (
    <Screen>
      <Header
        title={`Hi, ${firstName(session, profileState)}`}
        subtitle="Grow with God"
        action={<Pressable onPress={() => navigation.navigate("Notifications")} style={styles.iconButton}><MaterialCommunityIcons name="bell-outline" size={24} color={currentTheme.colors.primary} /></Pressable>}
      />
      <View style={styles.weekRail}>
        {weekDays.map((day, index) => (
          <View key={`${day}-${index}`} style={[styles.dayDot, index === activeDayIndex && { backgroundColor: currentTheme.colors.primary }]}>
            <Text variant="labelSmall" style={{ color: index === activeDayIndex ? "#fff" : currentTheme.colors.onSurface }}>{day}</Text>
          </View>
        ))}
      </View>
      <LinearGradient colors={["#FFF5E8", "#F1E8D8"]} style={styles.todayHero}>
        <View style={styles.between}>
          <View>
            <Text variant="labelMedium" style={{ color: "#7C6D5C" }}>{todayLabel()}</Text>
            <Text variant="headlineSmall" style={[styles.bold, { color: "#191714", marginTop: 4 }]}>Investing in heavenly treasure</Text>
          </View>
          <Pressable onPress={() => navigation.navigate("Favorites")} style={styles.iconButton}>
            <MaterialCommunityIcons name="heart-outline" size={24} color="#191714" />
          </Pressable>
        </View>
        <Text variant="labelLarge" style={{ color: "#7C6D5C", marginTop: 18 }}>Daily devotional</Text>
        {loading ? (
          <View style={[styles.skeletonLine, { width: "90%", backgroundColor: "#E6DCCB", marginTop: 14 }]} />
        ) : (
          <Pressable onPress={() => navigation.navigate("DevotionalDetail", { item: today })} style={styles.devotionalPreview}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="feather" size={20} color={currentTheme.colors.primary} />
              <View style={styles.flex}>
                <Text variant="labelLarge" style={styles.bold}>{today?.title || "Today's Devotional"}</Text>
                <Text variant="bodySmall" style={styles.muted} numberOfLines={2}>{today?.verse || today?.body}</Text>
              </View>
              <Text variant="labelSmall" style={styles.muted}>{today?.readTime || 2} min</Text>
            </View>
          </Pressable>
        )}
        <View style={styles.dualActions}>
          <Button mode="contained" icon="headphones" onPress={() => navigation.navigate("Audio")} style={styles.flex}>Listen</Button>
          <Button mode="contained" buttonColor="#191714" icon="book-open-page-variant" onPress={() => navigation.navigate("DevotionalDetail", { item: today })} style={styles.flex}>Read</Button>
        </View>
      </LinearGradient>
      <View style={styles.gridTwo}>
        <Pressable onPress={() => navigation.navigate(lastRead ? "Reading" : "Bible", lastRead || undefined)} style={[styles.quickCard, { backgroundColor: currentTheme.colors.surface }]}>
          <MaterialCommunityIcons name="book-open-variant" size={26} color={currentTheme.colors.primary} />
          <Text variant="titleSmall" style={[styles.bold, { marginTop: 8 }]}>Continue</Text>
          <Text variant="bodySmall" style={styles.muted}>{lastRead ? `${lastRead.book} ${lastRead.chapter}` : "Genesis 1"}</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Plans")} style={[styles.quickCard, { backgroundColor: currentTheme.colors.surface }]}>
          <MaterialCommunityIcons name="fire" size={26} color={currentTheme.colors.primary} />
          <Text variant="titleSmall" style={[styles.bold, { marginTop: 8 }]}>Streak</Text>
          <Text variant="bodySmall" style={styles.muted}>{streak} spiritual actions</Text>
          <View style={styles.miniProgress}><View style={[styles.miniProgressFill, { width: `${completion}%` }]} /></View>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("Prayer")} style={[styles.quickCard, { backgroundColor: currentTheme.colors.surface }]}>
          <MaterialCommunityIcons name="hands-pray" size={26} color={currentTheme.colors.primary} />
          <Text variant="titleSmall" style={[styles.bold, { marginTop: 8 }]}>Prayer focus</Text>
          <Text variant="bodySmall" style={styles.muted}>Wisdom, purity, and courage</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate("AudioPlayer")} style={[styles.quickCard, { backgroundColor: currentTheme.colors.surface }]}>
          <MaterialCommunityIcons name="history" size={26} color={currentTheme.colors.primary} />
          <Text variant="titleSmall" style={[styles.bold, { marginTop: 8 }]}>Recent</Text>
          <Text variant="bodySmall" style={styles.muted}>{audioState.currentTrack?.title || "No audio yet"}</Text>
        </Pressable>
      </View>
      <Button mode="outlined" icon="magnify" onPress={() => navigation.navigate("Search")}>Search Bible, devotionals, audio, and notes</Button>
      {loading ? <SkeletonCard /> : (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content>
            <View style={styles.between}>
              <Chip icon="book-heart">Today</Chip>
              <Button compact onPress={() => navigation.navigate("Devotionals")}>Explore</Button>
            </View>
            <Text variant="titleLarge" style={[styles.bold, { marginTop: 14 }]}>Verse of the day</Text>
            <Text variant="bodyMedium" style={styles.muted}>{today?.verse || "Your daily devotional library is ready."}</Text>
          </Card.Content>
        </Card>
      )}
      <Button mode="outlined" icon="wifi-off" onPress={() => navigation.navigate("Offline")}>Offline mode and downloads</Button>
    </Screen>
  );
}

function BibleScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const { bibleState, updateBiblePreferences } = useAppState();
  const localBooks = useBooks();
  const [query, setQuery] = useState("");
  const [versions, setVersions] = useState([]);
  const [backendBooks, setBackendBooks] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState(bibleState.selectedBibleVersionId);
  const [versionDialogVisible, setVersionDialogVisible] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadVersions() {
      setLoadingVersions(true);
      const remoteVersions = await bibleAPI.getVersions();
      if (!active) return;
      setVersions(remoteVersions || []);
      const preferred =
        remoteVersions.find((version) => version._id === bibleState.selectedBibleVersionId) ||
        remoteVersions.find((version) => version.code === bibleState.translation) ||
        remoteVersions[0];
      if (preferred) {
        setSelectedVersionId(preferred._id);
        if (
          bibleState.selectedBibleVersionId !== preferred._id ||
          bibleState.translation !== preferred.code
        ) {
          updateBiblePreferences({
            selectedBibleVersionId: preferred._id,
            translation: preferred.code,
          });
        }
      }
      setLoadingVersions(false);
    }

    loadVersions();
    return () => {
      active = false;
    };
  }, [bibleState.selectedBibleVersionId, bibleState.translation, updateBiblePreferences]);

  useEffect(() => {
    if (!selectedVersionId) return;
    let active = true;
    async function loadBooks() {
      setLoadingBooks(true);
      const remoteBooks = await bibleAPI.getBooksForVersion(selectedVersionId);
      if (!active) return;
      setBackendBooks(remoteBooks || []);
      setLoadingBooks(false);
    }

    loadBooks();
    return () => {
      active = false;
    };
  }, [selectedVersionId]);

  const selectedVersion = versions.find((version) => version._id === selectedVersionId);
  const translationLabel = selectedVersion?.code || bibleState.translation || "KJV";
  const books = backendBooks.length ? backendBooks : localBooks;
  const filtered = books.filter((book) => (book.name || "").toLowerCase().includes(query.toLowerCase()));

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.screenPadding}>
        <Header title="Bible" subtitle={`Free ${translationLabel} access with search, history, bookmarks, and highlights.`} />
        <Card style={[styles.card, { marginBottom: 10 }]}> 
          <Card.Content style={styles.between}>
            <View style={styles.flex}>
              <Text variant="labelLarge" style={[styles.bold, { color: currentTheme.colors.onSurface }]}>Current translation</Text>
              <Text variant="titleMedium" style={[styles.bold, { marginTop: 4 }]}>{loadingVersions ? "Loading..." : translationLabel}</Text>
              <Text variant="bodySmall" style={styles.muted}>
                {loadingVersions ? "Connecting to available translations..." : selectedVersion?.description || "Read the selected Scripture text in a familiar layout."}
              </Text>
            </View>
            <Button mode="outlined" onPress={() => setVersionDialogVisible(true)}>Change</Button>
          </Card.Content>
        </Card>
        <Text variant="bodySmall" style={[styles.muted, { marginBottom: 10 }]}> 
          {loadingVersions ? "Connecting to available translations..." : versions.length ? "Live translation content is ready for this selection." : "Using the local KJV library for now."}
        </Text>
        <Searchbar placeholder="Search books" value={query} onChangeText={setQuery} style={{ backgroundColor: currentTheme.colors.surface }} />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item.abbrev || item._id || `${item.name}-${index}`}
        contentContainerStyle={[styles.listContent, { paddingBottom: 150 }]}
        renderItem={({ item }) => (
          <Card
            style={styles.listCard}
            onPress={() =>
              navigation.navigate("Reading", {
                bookItem: item,
                bookTitle: item.name,
                chapterIndex: 0,
                versionId: selectedVersionId,
              })
            }
          >
            <Card.Content style={styles.between}>
              <View>
                <Text variant="titleMedium" style={styles.bold}>{item.name}</Text>
                <Text variant="bodySmall" style={styles.muted}>{item.chapters?.length || item.chapterCount || 0} chapters</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={currentTheme.colors.primary} />
            </Card.Content>
          </Card>
        )}
      />
      <Portal>
        <Modal visible={versionDialogVisible} onDismiss={() => setVersionDialogVisible(false)} contentContainerStyle={[styles.modalContent, { backgroundColor: currentTheme.colors.surface }]}>
          <Text variant="titleLarge" style={[styles.bold, { marginBottom: 14 }]}>Choose translation</Text>
          {versions.length === 0 ? (
            <ActivityIndicator animating size="small" />
          ) : (
            versions.map((version) => (
              <List.Item
                key={version._id}
                title={`${version.code} · ${version.name}`}
                description={version.description}
                left={(props) => <List.Icon {...props} icon={selectedVersionId === version._id ? "check-circle" : "book-open-variant"} />}
                onPress={() => {
                  setVersionDialogVisible(false);
                  setSelectedVersionId(version._id);
                  updateBiblePreferences({
                    selectedBibleVersionId: version._id,
                    translation: version.code,
                  });
                }}
              />
            ))
          )}
          <Button onPress={() => setVersionDialogVisible(false)} style={{ marginTop: 16 }}>
            Close
          </Button>
        </Modal>
      </Portal>
    </Screen>
  );
}

function HymnsScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const [query, setQuery] = useState("");
  const [selectedHymn, setSelectedHymn] = useState(hymnLibrary[0] || null);

  const filteredHymns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return hymnLibrary;
    return hymnLibrary.filter((hymn) => `${hymn.title} ${hymn.author_composer} ${hymn.story || ""}`.toLowerCase().includes(needle));
  }, [query]);

  useEffect(() => {
    if (!filteredHymns.length) {
      setSelectedHymn(null);
      return;
    }
    if (!selectedHymn || !filteredHymns.some((item) => item.title === selectedHymn.title)) {
      setSelectedHymn(filteredHymns[0]);
    }
  }, [filteredHymns, selectedHymn]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.screenPadding}>
        <Header title="Hymns" subtitle="Classic worship songs, prayerful choruses, and devotional favorites." />
        <Searchbar placeholder="Search hymns" value={query} onChangeText={setQuery} style={{ backgroundColor: currentTheme.colors.surface }} />
        <Card style={[styles.card, { marginTop: 10 }]}> 
          <Card.Content>
            <Text variant="labelLarge" style={[styles.bold, { color: currentTheme.colors.primary }]}>Featured hymn</Text>
            <Text variant="titleMedium" style={[styles.bold, { marginTop: 6 }]}>{selectedHymn?.title || "No hymn found"}</Text>
            <Text variant="bodySmall" style={styles.muted}>{selectedHymn?.author_composer || "Try another search term."}</Text>
          </Card.Content>
        </Card>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140 }}>
        {filteredHymns.map((hymn) => (
          <Card key={hymn.title} style={[styles.listCard, selectedHymn?.title === hymn.title && { borderColor: currentTheme.colors.primary, borderWidth: 1.2 }]} onPress={() => setSelectedHymn(hymn)}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.bold}>{hymn.title}</Text>
              <Text variant="bodySmall" style={styles.muted}>{hymn.author_composer}</Text>
              <Text variant="bodySmall" style={[styles.muted, { marginTop: 8 }]} numberOfLines={2}>{hymn.story}</Text>
            </Card.Content>
          </Card>
        ))}
        {selectedHymn && (
          <Card style={[styles.card, styles.hymnDetailCard]}> 
            <Card.Content>
              <Text variant="titleLarge" style={[styles.bold, { marginBottom: 6 }]}>{selectedHymn.title}</Text>
              <Text variant="bodyMedium" style={styles.muted}>{selectedHymn.author_composer}</Text>
              {selectedHymn.lyrics ? (
                <Text variant="bodyMedium" style={{ marginTop: 12, lineHeight: 24 }}>{selectedHymn.lyrics}</Text>
              ) : (
                <Text variant="bodyMedium" style={{ marginTop: 12, lineHeight: 24 }}>{selectedHymn.note || "Full lyrics will be added as more hymn content is curated for this module."}</Text>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </Screen>
  );
}

function SearchScreen({ navigation }) {
  const books = useBooks();
  const { isPremium, bibleState, audioState } = useAppState();
  const [query, setQuery] = useState("");
  const [devotionals, setDevotionals] = useState([]);

  useEffect(() => {
    devotionalAPI.getWeeklyDevotionals().then(setDevotionals).catch(() => setDevotionals([]));
  }, []);

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const needle = query.toLowerCase();
    const found = [];
    books.forEach((book) => {
      book.chapters?.forEach((chapter, chapterIndex) => {
        chapter.forEach((text, verseIndex) => {
          const cleanVerse = cleanText(text, { stripBibleNotes: true });
          if (cleanVerse.toLowerCase().includes(needle) && found.length < 60) {
            found.push({ key: `${book.name}-${chapterIndex + 1}-${verseIndex + 1}`, book: book.name, bookItem: book, chapter: chapterIndex + 1, verse: verseIndex + 1, text: cleanVerse });
          }
        });
      });
    });
    devotionals.forEach((item) => {
      const haystack = `${item.title} ${item.verse} ${item.body}`.toLowerCase();
      if (haystack.includes(needle) && found.length < 80) {
        found.push({ key: `devotional-${item.id}`, type: "Devotional", title: item.title, text: item.body, item });
      }
    });
    audioTracks.concat(audioState.recentlyPlayed || []).forEach((track) => {
      const haystack = `${track.title} ${track.host} ${track.type}`.toLowerCase();
      if (haystack.includes(needle) && found.length < 90) {
        found.push({ key: `audio-${track.id}`, type: "Audio", title: track.title, text: `${track.type} - ${track.duration}`, track });
      }
    });
    bibleState.notes.forEach((note) => {
      const haystack = `${note.book} ${note.text} ${note.note}`.toLowerCase();
      if (haystack.includes(needle) && found.length < 100) {
        found.push({ key: `note-${note.key}`, type: "Note", title: `${note.book} ${note.chapter}:${note.verse}`, text: note.note, note });
      }
    });
    return found;
  }, [books, query, devotionals, isPremium, bibleState.notes, audioState.recentlyPlayed]);

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.screenPadding}>
        <Header title="Search" subtitle="Verse search is free and local." />
        <Searchbar placeholder="Search a verse or phrase" value={query} onChangeText={setQuery} />
      </View>
      {query.length < 2 ? (
        <View style={styles.screenPadding}><EmptyState icon="magnify" title="Search scripture" body="Type at least two characters to search across the Bible." /></View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContent, { paddingBottom: 150 }]}
          ListEmptyComponent={<EmptyState title="No verses found" body="Try a different word or phrase." />}
          renderItem={({ item }) => (
            <Card
              style={styles.listCard}
              onPress={() => {
                  if (item.type === "Devotional") navigation.navigate("DevotionalDetail", { item: item.item });
                  else if (item.type === "Audio") navigation.navigate("AudioPlayer", { track: item.track });
                  else navigation.navigate("Reading", { bookItem: item.bookItem || item.note?.bookItem, bookTitle: item.book || item.note?.bookTitle, chapterIndex: (item.chapter || item.note?.chapter || 1) - 1 });
                }
              }
            >
              <Card.Content>
                <Text variant="labelMedium" style={styles.bold}>{item.type ? `${item.type}: ${item.title}` : `${item.book} ${item.chapter}:${item.verse}`}</Text>
                <Text variant="bodyMedium" style={styles.muted}>{item.text}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

function PremiumHubScreen({ navigation }) {
  const { isPremium } = useAppState();
  const [today, setToday] = useState(null);

  useEffect(() => {
    devotionalAPI.getTodayDevotional().then(setToday);
  }, []);

  return (
    <Screen>
      <Header title="Premium" subtitle={"Your devotional library is unlocked."} />
      <Card style={styles.card} onPress={() => navigation.navigate("DevotionalDetail", { item: today })}>
        <Card.Content>
          <Chip icon="book-heart">Today</Chip>
          <Text variant="titleLarge" style={[styles.bold, { marginTop: 12 }]}>{today?.title || "Today's Devotional"}</Text>
          <Text variant="bodyMedium" style={styles.muted} numberOfLines={8}>{today?.body || "Loading devotional..."}</Text>
        </Card.Content>
      </Card>
      {Object.entries(premiumFeatures).map(([title, body]) => (
        <List.Item
          key={title}
          title={title}
          description={body}
          onPress={() => navigation.navigate(title)}
          left={() => <MaterialCommunityIcons name={"check-circle"} size={24} color="#E94E77" />}
          right={() => <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />}
        />
      ))}
    </Screen>
  );
}

function AudioScreen({ navigation }) {
  const { playTrack } = useAppState();
  return (
    <Screen>
      <Header title="Audio" subtitle="Devotionals, sermons, podcasts, and worship playlists." />
      {audioTracks.map((track) => (
        <Card key={track.id} style={styles.card} onPress={() => playTrack(track, audioTracks)}>
          <Card.Content style={styles.row}>
            <View style={styles.iconTile}><MaterialCommunityIcons name={"play-circle"} size={26} color="#E94E77" /></View>
            <View style={styles.flex}>
              <Text variant="titleSmall" style={styles.bold}>{track.title}</Text>
              <Text variant="bodySmall" style={styles.muted}>{track.type} • {track.host} • {track.duration}</Text>
            </View>
            <Button compact onPress={() => navigation.navigate("AudioPlayer", { track })}>Open</Button>
          </Card.Content>
        </Card>
      ))}
    </Screen>
  );
}

function ProfileScreen({ navigation }) {
  const { session, subscription, isPremium, logout, bibleState, audioState, devotionalState, profileState } = useAppState();
  const stats = [
    ["Streak", `${Math.max(1, bibleState.history.length + devotionalState.readIds.length)}`],
    ["Bookmarks", `${bibleState.bookmarks.length + devotionalState.bookmarks.length}`],
    ["Downloads", `${audioState.downloaded.length + devotionalState.downloads.length}`],
  ];

  return (
    <Screen>
      <Header title="Profile" subtitle={session.mode === "guest" ? "Guest mode: Bible access enabled." : session.user?.email} />
      <Card style={styles.card}>
        <Card.Content style={styles.row}>
          <View style={styles.avatar}><Text variant="titleLarge" style={styles.bold}>{firstName(session, profileState)?.[0]?.toUpperCase() || "G"}</Text></View>
          <View style={styles.flex}>
            <Text variant="titleMedium" style={styles.bold}>{firstName(session, profileState) || "Guest Reader"}</Text>
            <Text variant="bodySmall" style={styles.muted}>{isPremium ? `Premium ${subscription.plan || "monthly"}` : "Free Bible plan"}</Text>
          </View>
          {!isPremium && <Button mode="contained" onPress={() => navigation.navigate("Paywall")} compact>Upgrade</Button>}
        </Card.Content>
      </Card>
      <View style={styles.statsRow}>
        {stats.map(([label, value]) => (
          <View key={label} style={styles.statCard}>
            <Text variant="titleMedium" style={styles.bold}>{value}</Text>
            <Text variant="labelSmall" style={styles.muted}>{label}</Text>
          </View>
        ))}
      </View>
      {[
        ["Edit Profile", "account-edit-outline"],
        ["Change Password", "lock-reset"],
        ["Subscription", "crown-outline"],
        ["Favorites", "bookmark-multiple-outline"],
        ["Downloads", "download-outline"],
        ["Reading Stats", "chart-line"],
        ["Prayer Journal", "notebook-heart-outline"],
        ["Saved Notes", "note-text-outline"],
        ["Notifications", "bell-outline"],
        ["Settings", "cog-outline"],
        ["Support / Donate", "hand-coin"],
        ["Manage Gifts", "calendar-repeat"],
      ].map(([title, icon]) => (
        <List.Item
          key={title}
          title={title}
          onPress={() => {
            if (title === "Subscription") navigation.navigate("Paywall");
            else if (title.includes("Support")) navigation.navigate("Donate");
            else if (title.includes("Manage Gifts")) navigation.navigate("ManageGifts");
            else navigation.navigate(title);
          }}
          left={() => <MaterialCommunityIcons name={icon} size={24} color="#F15A24" />}
          right={() => <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />}
        />
      ))}
      <Button mode="outlined" icon="logout" onPress={() => { logout(); navigation.replace("Auth"); }} style={{ marginTop: 12 }}>Logout</Button>
    </Screen>
  );
}

function DevotionalDetailScreen({ route, navigation }) {
  const { recordDevotionalRead, toggleDevotionalBookmark, devotionalState } = useAppState();
  const item = route.params?.item;
  const bookmarked = item?.id ? devotionalState.bookmarks.some((saved) => saved.id === item.id) : false;

  useEffect(() => {
    if (item?.id) recordDevotionalRead(item.id);
  }, [item?.id]);

  if (!item) {
    return <Screen><Header back title="Devotional" /><EmptyState title="Devotional unavailable" body="Open a devotional from the Premium tab." /></Screen>;
  }
  const share = () => Share.share({ title: item.title, message: `${item.title}\n\n${item.verse}\n\n${item.body}` });

  return (
    <Screen>
      <Header
        back
        title={item.date || "Devotional"}
        action={
          <View style={styles.row}>
            <Pressable onPress={() => toggleDevotionalBookmark(item)} style={styles.iconButton}>
              <MaterialCommunityIcons name={bookmarked ? "heart" : "heart-outline"} size={22} color="#F15A24" />
            </Pressable>
            <Pressable onPress={share} style={styles.iconButton}>
              <MaterialCommunityIcons name="share-variant" size={22} color="#F15A24" />
            </Pressable>
          </View>
        }
      />
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.bold}>{item.title}</Text>
          <Chip icon="clock-outline" style={{ alignSelf: "flex-start", marginTop: 12 }}>{item.readTime || 2} min read</Chip>
          <View style={styles.verseBox}><Text variant="bodyMedium" style={{ fontStyle: "italic" }}>{item.verse}</Text></View>
          <Text variant="bodyLarge" style={{ lineHeight: 26 }}>{item.fullBody || item.body}</Text>
        </Card.Content>
      </Card>
      {item.confession && <Card style={styles.card}><Card.Content><Text variant="titleMedium" style={styles.bold}>Confession</Text><Text style={styles.muted}>{item.confession}</Text></Card.Content></Card>}
      {item.prayer && <Card style={styles.card}><Card.Content><Text variant="titleMedium" style={styles.bold}>Prayer</Text><Text style={styles.muted}>{item.prayer}</Text></Card.Content></Card>}
      <Button mode="contained" icon="headphones" onPress={() => navigation.navigate("Audio")}>Listen to devotional audio</Button>
    </Screen>
  );
}

function DonateScreen({ navigation }) {
  const { session } = useAppState();
  const { currentTheme } = useContext(PaperThemeContext);
  const [amount, setAmount] = useState('1000');
  const [email, setEmail] = useState(session.user?.email || '');
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');
  const [showWebview, setShowWebview] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [mode, setMode] = useState('one_time'); // 'one_time' | 'recurring'
  const [interval, setInterval] = useState('monthly');
  const [providers, setProviders] = useState(['paystack']);
  const [selectedProvider, setSelectedProvider] = useState('paystack');
  const [presets, setPresets] = useState([500, 1000, 2000, 5000]);
  const [note, setNote] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/payments/options`);
        const json = await res.json();
        if (mounted && json && json.success && json.data) {
          setProviders(json.data.providers || ['paystack']);
          setPresets(json.data.presets || [500, 1000, 2000, 5000]);
          setInterval((prev) => (json.data.intervals && json.data.intervals.includes(prev) ? prev : (json.data.intervals && json.data.intervals[0]) || prev));
          setSelectedProvider((p) => (json.data.providers && json.data.providers.includes(p) ? p : (json.data.providers && json.data.providers[0]) || p));
        }
      } catch (e) {
        console.warn('Failed fetching payment options', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const donate = async () => {
    if (!amount || Number(amount) <= 0) { setSnack('Enter a valid amount'); return; }
    if (!email || !email.includes('@')) { setSnack('Enter a valid email'); return; }
    setLoading(true);
    try {
      if (mode === 'recurring') {
        // create a plan first
        const planRes = await fetch(`${API_BASE_URL}/payments/paystack/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), interval, name: `Seed (${interval})` }),
        });
        const planData = await planRes.json();
        if (!planData.success || !planData.data) {
          setSnack('Failed creating plan for recurring gift');
          return;
        }
        const planCode = planData.data.data?.plan_code || planData.data.plan_code || planData.data.id;
        if (!planCode) { setSnack('Could not determine plan id'); return; }

        const providerPath = selectedProvider === 'flutterwave' ? 'flutterwave/initialize' : 'paystack/initialize';
        const res = await fetch(`${API_BASE_URL}/payments/${providerPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), email, metadata: { recurrent: true, planId: planCode, interval, note } }),
        });
        const data = await res.json();
        if (!data.success || !data.data) { setSnack('Payment initialization failed'); return; }
        const url = data.data.data?.authorization_url || data.data.authorization_url;
        if (url) { setAuthUrl(url); setShowWebview(true); } else { setSnack('No authorization URL returned'); }
      } else {
        const providerPath = selectedProvider === 'flutterwave' ? 'flutterwave/initialize' : 'paystack/initialize';
        const res = await fetch(`${API_BASE_URL}/payments/${providerPath}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: Number(amount), email, metadata: { note } }),
        });
        const data = await res.json();
        if (!data.success || !data.data) { setSnack('Payment initialization failed'); return; }
        const url = data.data.data?.authorization_url || data.data.authorization_url;
        if (url) { setAuthUrl(url); setShowWebview(true); } else { setSnack('No authorization URL returned'); }
      }
    } catch (err) {
      console.error(err);
      setSnack('Network error while initiating payment');
    } finally {
      setLoading(false);
    }
  };

  const extractQueryParam = (url, key) => {
    try {
      const parts = url.split('?');
      if (parts.length < 2) return null;
      const params = new URLSearchParams(parts[1]);
      return params.get(key);
    } catch (e) {
      return null;
    }
  };

  const handleNavigationStateChange = async (navState) => {
    const { url } = navState;
    // Paystack commonly returns a reference query param on redirect
    const reference = extractQueryParam(url, 'reference');
    if (reference) {
      // verify with backend
      setVerifying(true);
      try {
        const res = await fetch(`${API_BASE_URL}/payments/paystack/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reference }),
        });
        const result = await res.json();
        if (result.success) {
          setSnack('Thank you — donation received.');
        } else {
          setSnack('Payment not verified yet.');
        }
      } catch (err) {
        console.error(err);
        setSnack('Verification network error');
      } finally {
        setVerifying(false);
        setShowWebview(false);
      }
    }
  };

  return (
    <Screen>
      <Header back title="Support / Donate" subtitle="One-time gift (Sow a seed)" />
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="bodyMedium" style={styles.muted}>Support this ministry — choose one-time or a recurring seed.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 8 }}>
            <Button mode={mode === 'one_time' ? 'contained' : 'outlined'} onPress={() => setMode('one_time')}>One-time</Button>
            <Button mode={mode === 'recurring' ? 'contained' : 'outlined'} onPress={() => setMode('recurring')}>Recurrent</Button>
          </View>
          {mode === 'recurring' && (
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
              <Button mode={interval === 'monthly' ? 'contained' : 'outlined'} onPress={() => setInterval('monthly')}>Monthly</Button>
              <Button mode={interval === 'quarterly' ? 'contained' : 'outlined'} onPress={() => setInterval('quarterly')}>Quarterly</Button>
              <Button mode={interval === 'yearly' ? 'contained' : 'outlined'} onPress={() => setInterval('yearly')}>Yearly</Button>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {providers.map((p) => (
              <Button key={p} mode={selectedProvider === p ? 'contained' : 'outlined'} onPress={() => setSelectedProvider(p)}>{p}</Button>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {presets.map((v) => (
              <Button key={v} mode={Number(amount) === v ? 'contained' : 'outlined'} onPress={() => setAmount(String(v))}>{v}</Button>
            ))}
          </View>
          <TextInput placeholder="Add a note (optional)" value={note} onChangeText={setNote} mode="outlined" style={styles.input} />
          <TextInput placeholder="Amount (e.g. 1000)" value={String(amount)} onChangeText={setAmount} keyboardType="numeric" style={styles.input} />
          <TextInput placeholder="Email for receipt" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
          <Button mode="contained" onPress={donate} loading={loading} style={styles.primaryButton}>{mode === 'recurring' ? 'Start recurring gift' : 'Donate'}</Button>
        </Card.Content>
      </Card>

      <Modal visible={showWebview} onDismiss={() => setShowWebview(false)} contentContainerStyle={{ flex: 1, margin: 16 }}>
        {authUrl ? (
          <WebView
            source={{ uri: authUrl }}
            onNavigationStateChange={handleNavigationStateChange}
            startInLoadingState
            javaScriptEnabled
          />
        ) : (
          <View style={{ padding: 20 }}><ActivityIndicator /></View>
        )}
      </Modal>

      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>{snack}</Snackbar>
    </Screen>
  );
}

function ManageGiftsScreen({ navigation }) {
  const { session } = useAppState();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const email = session.user?.email;
      if (!email) { setSnack('Sign in to manage gifts'); setGifts([]); return; }
      const res = await fetch(`${API_BASE_URL}/payments/paystack/my?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.success) setGifts(data.data || []);
      else setSnack('Failed loading gifts');
    } catch (err) {
      console.error(err);
      setSnack('Network error');
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      const email = session.user?.email;
      const res = await fetch(`${API_BASE_URL}/payments/paystack/my/cancel`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, email }),
      });
      const data = await res.json();
      if (data.success) { setSnack('Cancelled'); load(); }
      else setSnack('Cancel failed');
    } catch (err) { console.error(err); setSnack('Network error'); }
  };

  return (
    <Screen>
      <Header back title="Manage Gifts" />
      {loading ? <ActivityIndicator style={{ marginTop: 20 }} /> : (
        gifts.length === 0 ? <EmptyState title="No recurring gifts" body="Start a recurring seed from the Donate screen." /> : (
          <ScrollView style={{ paddingHorizontal: 16 }}>
            {gifts.map((g) => (
              <Card key={g._id} style={styles.card}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.bold}>{g.type === 'recurring' ? `${g.interval || 'Recurring'}` : 'One-time'}</Text>
                  <Text style={styles.muted}>{g.amount} {g.currency} • {g.status}</Text>
                  {g.subscriptionCode && g.status !== 'cancelled' && (
                    <Button mode="outlined" onPress={() => cancel(g._id)} style={{ marginTop: 8 }}>Cancel</Button>
                  )}
                </Card.Content>
              </Card>
            ))}
          </ScrollView>
        )
      )}
      <Snackbar visible={!!snack} onDismiss={() => setSnack('')}>{snack}</Snackbar>
    </Screen>
  );
}

function ReadingScreen({ route, navigation }) {
  const { bibleState, addReadingHistory, toggleVerseBookmark, toggleVerseHighlight, updateBiblePreferences } = useAppState();
  const { currentTheme } = useContext(PaperThemeContext);
  const { bookItem, bookTitle, versionId } = route.params || {};
  const localBooks = useBooks();
  const localChapters = bookItem?.chapters || [];
  const [loadedChapters, setLoadedChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chapterIndex, setChapterIndex] = useState(route.params?.chapterIndex || 0);
  const [statusMessage, setStatusMessage] = useState("Showing the built-in text for this chapter.");
  const chapters = localChapters.length ? localChapters : loadedChapters;
  const currentVerses = chapters[chapterIndex] || [];
  const currentBookHighlights = useMemo(() => bibleState.highlights.filter((saved) => saved.book === bookTitle), [bibleState.highlights, bookTitle]);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const fontSize = 17 * bibleState.fontScale;
  const fontScaleLabel = `${Math.round(bibleState.fontScale * 100)}%`;
  const readerBg = bibleState.theme === "night" ? "#161616" : bibleState.theme === "sepia" ? "#f5ecd8" : currentTheme.colors.background;
  const readerText = bibleState.theme === "night" ? "#f6f0e8" : "#25201d";

  useEffect(() => {
    if (!bookItem) navigation.goBack();
  }, [bookItem, navigation]);

  useEffect(() => {
    let active = true;

    async function loadRemoteChapters() {
      if (localChapters.length || !bookItem?._id) {
        setLoadedChapters([]);
        setStatusMessage(localChapters.length ? "Showing the built-in text for this chapter." : "No live Bible data was available yet.");
        return;
      }

      setLoadingChapters(true);
      setStatusMessage("Connecting to the live Bible library...");
      try {
        const remoteChapters = await bibleAPI.getChaptersForBook(bookItem._id || bookItem.id);
        if (!active) return;

        const fallbackBook = findMatchingLocalBook(bookItem, localBooks);
        const chapterVerseArrays = [];
        let hasLiveVerses = false;

        for (const [index, chapter] of (remoteChapters || []).entries()) {
          const chapterId = chapter._id || chapter.id;
          const verses = await bibleAPI.getVersesForChapter(chapterId);
          const normalizedVerses = (verses || []).map((verse) => (typeof verse === "string" ? verse : verse.text || "")).filter(Boolean);

          if (normalizedVerses.length > 0) {
            hasLiveVerses = true;
            chapterVerseArrays.push(normalizedVerses);
          } else if (fallbackBook?.chapters?.[index]) {
            chapterVerseArrays.push(
              (fallbackBook.chapters[index] || []).map((verse) => (typeof verse === "string" ? verse : verse.text || "")).filter(Boolean)
            );
          } else {
            chapterVerseArrays.push([]);
          }
        }

        const resolvedChapters = chapterVerseArrays.length > 0 ? chapterVerseArrays : (fallbackBook?.chapters || []);
        setLoadedChapters(resolvedChapters);
        setStatusMessage(hasLiveVerses ? "Showing the live translation text for this chapter." : "Live content was unavailable, so the built-in text is being shown.");
        setChapterIndex(0);
      } catch (error) {
        console.warn("Unable to load remote Bible chapter data", error);
        if (active) {
          const fallbackBook = findMatchingLocalBook(bookItem, localBooks);
          setLoadedChapters(fallbackBook?.chapters || []);
          setStatusMessage("The live connection was unavailable, so the built-in text is being shown.");
        }
      } finally {
        if (active) setLoadingChapters(false);
      }
    }

    loadRemoteChapters();
    return () => {
      active = false;
    };
  }, [bookItem?._id, bookItem?.id, localChapters.length, versionId]);

  useEffect(() => {
    if (bookTitle) {
      addReadingHistory({ key: `${bookTitle}-${chapterIndex + 1}`, book: bookTitle, chapter: chapterIndex + 1, bookItem, bookTitle, chapterIndex, versionId });
    }
  }, [bookTitle, chapterIndex]);

  return (
    <SafeAreaView style={[styles.flex, { backgroundColor: readerBg }]}>
      <View style={[styles.readerHeader, { borderBottomColor: currentTheme.colors.outline }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.iconButton}><MaterialCommunityIcons name="arrow-left" size={24} color={currentTheme.colors.primary} /></Pressable>
        <View style={styles.readerTitleBlock}>
          <Text variant="titleMedium" style={[styles.bold, { color: readerText }]} numberOfLines={1}>{bookTitle} {chapterIndex + 1}</Text>
          <View style={styles.readerMetaRow}>
            <Chip compact style={[styles.readerMetaChip, { backgroundColor: currentTheme.colors.primaryContainer }]}> {bibleState.translation || "KJV"}</Chip>
            <Chip compact style={styles.readerMetaChip}>{fontScaleLabel}</Chip>
            <Chip compact style={styles.readerMetaChip}>{currentBookHighlights.length ? `${currentBookHighlights.length} highlights` : "Tap and hold"}</Chip>
          </View>
        </View>
        <View style={styles.readingControls}>
          <Pressable onPress={() => updateBiblePreferences({ fontScale: Math.max(0.85, bibleState.fontScale - 0.1) })} style={styles.iconButton}><Text>A-</Text></Pressable>
          <Pressable onPress={() => updateBiblePreferences({ fontScale: Math.min(1.35, bibleState.fontScale + 0.1) })} style={styles.iconButton}><Text>A+</Text></Pressable>
          <Pressable onPress={() => updateBiblePreferences({ fontScale: 1 })} style={styles.iconButton}><Text>↺</Text></Pressable>
        </View>
      </View>
      <View style={styles.chapterRail}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
          {chapters.map((_, index) => (
            <Chip key={index} selected={chapterIndex === index} onPress={() => setChapterIndex(index)} style={{ marginRight: 8 }}>{index + 1}</Chip>
          ))}
        </ScrollView>
      </View>
      {statusMessage ? (
        <View style={[styles.verseBox, { marginHorizontal: 18, marginTop: 2 }]}> 
          <Text variant="bodySmall" style={{ color: currentTheme.colors.primary }}>{statusMessage}</Text>
        </View>
      ) : null}
      {currentBookHighlights.length > 0 ? (
        <View style={[styles.verseBox, { marginHorizontal: 18, marginTop: 6 }]}> 
          <Text variant="bodySmall" style={{ color: currentTheme.colors.primary }}>{currentBookHighlights.length} saved highlight{currentBookHighlights.length === 1 ? "" : "s"} stay available here.</Text>
        </View>
      ) : null}
      {loadingChapters ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator />
          <Text variant="bodyMedium" style={{ marginTop: 8, color: readerText }}>Loading chapters…</Text>
        </View>
      ) : (
        <FlatList
          data={currentVerses}
          keyExtractor={(_, index) => `${bookTitle}-${chapterIndex}-${index}`}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 130, paddingTop: 8 }}
          renderItem={({ item, index }) => {
            const cleanedVerseText = cleanText(item, { stripBibleNotes: true });
            const verse = { key: `${bookTitle}-${chapterIndex + 1}-${index + 1}`, book: bookTitle, chapter: chapterIndex + 1, verse: index + 1, text: cleanedVerseText, bookItem, bookTitle, chapterIndex, versionId };
            const highlighted = bibleState.highlights.some((saved) => saved.key === verse.key);
            const bookmarked = bibleState.bookmarks.some((saved) => saved.key === verse.key);
            return (
              <Pressable onLongPress={() => toggleVerseHighlight(verse)} onPress={() => setSelectedVerse(verse)} style={[styles.verseRow, highlighted && styles.highlightedVerse]}>
                <Text style={[styles.verseNum, { color: currentTheme.colors.primary }]}>{index + 1}</Text>
                <Text style={[styles.verseText, { color: readerText, fontSize }]}>{cleanedVerseText}</Text>
                <Pressable onPress={() => toggleVerseBookmark(verse)} style={styles.iconButton}>
                  <MaterialCommunityIcons name={bookmarked ? "bookmark" : "bookmark-outline"} size={20} color={currentTheme.colors.primary} />
                </Pressable>
              </Pressable>
            );
          }}
        />
      )}
      <View style={[styles.readerBottom, { backgroundColor: readerBg }]}>
        <Button disabled={chapterIndex === 0} onPress={() => setChapterIndex((value) => Math.max(0, value - 1))}>Previous</Button>
        <Button mode="outlined" onPress={() => updateBiblePreferences({ theme: bibleState.theme === "paper" ? "sepia" : bibleState.theme === "sepia" ? "night" : "paper" })}>{bibleState.theme}</Button>
        <Button disabled={chapterIndex >= chapters.length - 1} onPress={() => setChapterIndex((value) => Math.min(chapters.length - 1, value + 1))}>Next</Button>
      </View>
    </SafeAreaView>
  );
}

function PaywallScreen({ navigation }) {
  const { activatePremium, subscription } = useAppState();
  const [plan, setPlan] = useState("monthly");
  const subscribe = () => {
    activatePremium(plan);
    navigation.goBack();
  };

  return (
    <Screen padded={false}>
      <View style={styles.paywallHeader}>
        <Image source={require("./assets/header-hero.jpg")} style={styles.paywallImage} />
        <Pressable onPress={() => navigation.goBack()} style={styles.paywallClose}>
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </Pressable>
      </View>
      <View style={styles.paywallSheet}>
        <Text variant="headlineSmall" style={[styles.bold, styles.centerText, { color: "#191714" }]}>Unlock all content with Glory Plus</Text>
        <Text variant="bodyMedium" style={[styles.centerText, { color: "#4E463B", marginTop: 8 }]}>
          Every subscription supports this ministry and prepares the app for Google Play Billing verification.
        </Text>
        <Pressable style={styles.sponsorshipRow}>
          <MaterialCommunityIcons name="plus" size={18} color="#191714" />
          <Text variant="labelLarge" style={[styles.bold, styles.flex]}>About our sponsorship program</Text>
          <MaterialCommunityIcons name="chevron-down" size={20} color="#191714" />
        </Pressable>
        {premiumRows.map(([icon, title, body]) => (
          <View key={title} style={styles.paywallFeature}>
            <MaterialCommunityIcons name={icon} size={22} color="#F15A24" />
            <View style={styles.flex}>
              <Text variant="labelLarge" style={styles.bold}>{title}</Text>
              <Text variant="bodySmall" style={styles.muted}>{body}</Text>
            </View>
          </View>
        ))}
        <View style={styles.segment}>
          <Pressable onPress={() => setPlan("monthly")} style={[styles.planCard, plan === "monthly" && styles.planSelected]}>
            <Text variant="labelLarge" style={styles.bold}>Monthly</Text>
            <Text variant="titleMedium" style={styles.bold}>$2.99</Text>
          </Pressable>
          <Pressable onPress={() => setPlan("yearly")} style={[styles.planCard, plan === "yearly" && styles.planSelected]}>
            <Text variant="labelLarge" style={styles.bold}>Yearly Special</Text>
            <Text variant="titleMedium" style={styles.bold}>$29.99</Text>
          </Pressable>
        </View>
        {subscription.trialEligible && <Chip icon="gift" style={{ alignSelf: "center", marginBottom: 10 }}>7-day free trial</Chip>}
        <Button mode="contained" buttonColor="#111" textColor="#fff" onPress={subscribe} style={styles.primaryButton}>Start my 7-day free trial</Button>
        <Button mode="text" onPress={() => activatePremium("restored-demo")}>Restore purchases</Button>
        <Text variant="labelSmall" style={[styles.centerText, styles.muted]}>Prepared for Google Play Billing purchase, verification, restore, and graceful failure states.</Text>
      </View>
    </Screen>
  );
}

function AudioPlayerScreen({ route }) {
  const { audioState, playTrack, togglePlayback, seekAudio, isPremium, toggleDownload, setAudioSpeed } = useAppState();
  const track = route.params?.track || audioState.currentTrack || audioTracks[0];

  useEffect(() => {
    if (isPremium && track && audioState.currentTrack?.id !== track.id) playTrack(track, audioTracks);
  }, [track?.id]);

  const percent = audioState.duration ? audioState.position / audioState.duration : 0;

  return (
    <Screen>
      <Header back title="Now Playing" subtitle="Background playback hooks are ready for native audio integration." />
      <View style={styles.playerArt}><MaterialCommunityIcons name="headphones" size={76} color="#E94E77" /></View>
      <Text variant="headlineSmall" style={[styles.bold, styles.centerText]}>{track.title}</Text>
      <Text variant="bodyMedium" style={[styles.muted, styles.centerText]}>{track.host} • {track.duration}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.max(4, percent * 100)}%` }]} /></View>
      <View style={styles.playerControls}>
        <Pressable onPress={() => seekAudio(audioState.position - 15)} style={styles.roundButton}><MaterialCommunityIcons name="rewind-15" size={26} /></Pressable>
        <Pressable onPress={togglePlayback} style={styles.playButton}><MaterialCommunityIcons name={audioState.isPlaying ? "pause" : "play"} size={34} color="#fff" /></Pressable>
        <Pressable onPress={() => seekAudio(audioState.position + 30)} style={styles.roundButton}><MaterialCommunityIcons name="fast-forward-30" size={26} /></Pressable>
      </View>
      <View style={styles.segment}>
        {[0.75, 1, 1.25, 1.5].map((speed) => (
          <Button key={speed} mode={audioState.speed === speed ? "contained" : "outlined"} onPress={() => setAudioSpeed(speed)} style={styles.flex}>{speed}x</Button>
        ))}
      </View>
      <Button mode="outlined" icon="download" onPress={() => toggleDownload(track)}>Toggle offline download</Button>
    </Screen>
  );
}

function UtilityScreen({ route, navigation }) {
  const { isPremium, bibleState, audioState, devotionalState, profileState, addPrayerEntry, updateProfile, session } = useAppState();
  const name = route.name;
  const premium = ["Downloads", "Plans", "Prayer", "Assistant", "Prayer Journal"].includes(name);
  const locked = false; // App is now fully free: disable premium locking
  const [draft, setDraft] = useState("");
  const [displayName, setDisplayName] = useState(firstName(session, profileState));

  const contentMap = {
    Bookmarks: bibleState.bookmarks.concat(devotionalState.bookmarks),
    Favorites: bibleState.bookmarks.concat(devotionalState.bookmarks),
    Downloads: audioState.downloaded,
    Plans: planItems,
    Notifications: Object.entries(profileState.notificationPrefs).map(([key, value]) => ({ id: key, title: key.replace(/([A-Z])/g, " $1"), body: value ? "Enabled" : "Disabled" })),
    Support: [{ id: "help", title: "Help & support", body: "FAQ, contact, privacy, and feedback channels are wired as app screens." }],
    Offline: [{ id: "offline", title: "Offline mode", body: "Bible content and downloaded media are available offline when saved." }],
    Prayer: [{ id: "journal", title: "Prayer focus", body: "Wisdom, purity, courage, and daily obedience." }],
    "Prayer Journal": profileState.prayerJournal,
    "Saved Notes": bibleState.notes,
    "Reading Stats": [
      { id: "history", title: "Bible chapters opened", body: `${bibleState.history.length}` },
      { id: "devotional", title: "Devotionals read", body: `${devotionalState.readIds.length}` },
      { id: "audio", title: "Recently played audio", body: `${audioState.recentlyPlayed.length}` },
    ],
    "Change Password": [{ id: "password", title: "Password security", body: "Current password, new password, and reset-token backend hooks are ready for API wiring." }],
    "Edit Profile": [],
    Devotionals: devotionalState.bookmarks,
    Sermons: audioTracks,
    Assistant: [{ id: "ai", title: "AI devotional assistant", body: "Personalized recommendations and guided reflection placeholder." }],
  };

  if (locked) {
    return <Screen><Header back title={name} /><LockedCard title={`${name} is Premium`} body="Upgrade to unlock this experience." onUpgrade={() => navigation.navigate("Paywall")} /></Screen>;
  }

  const items = contentMap[name] || [];
  return (
    <Screen>
      <Header back title={name} subtitle={name === "Downloads" ? "Offline-ready premium content." : undefined} />
      {name === "Edit Profile" && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>Display name</Text>
            <TextInput value={displayName} onChangeText={setDisplayName} style={styles.input} />
            <Button mode="contained" onPress={() => updateProfile({ displayName })}>Save profile</Button>
          </Card.Content>
        </Card>
      )}
      {name === "Prayer Journal" && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.bold}>New prayer note</Text>
            <TextInput value={draft} onChangeText={setDraft} multiline placeholder="Write a private prayer..." style={[styles.input, { minHeight: 90, textAlignVertical: "top" }]} />
            <Button mode="contained" onPress={() => { addPrayerEntry(draft); setDraft(""); }}>Save prayer</Button>
          </Card.Content>
        </Card>
      )}
      {items.length === 0 && name !== "Edit Profile" ? (
        <EmptyState title={`No ${name.toLowerCase()} yet`} body="Your saved content will appear here as you use the app." />
      ) : (
        items.map((item) => (
          <Card key={item.key || item.id || item.title} style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.bold}>{item.title || `${item.book} ${item.chapter}:${item.verse}`}</Text>
              <Text variant="bodyMedium" style={styles.muted}>{item.body || item.note || item.text || `${item.type || ""} ${item.duration || ""}`}</Text>
            </Card.Content>
          </Card>
        ))
      )}
    </Screen>
  );
}

function SettingsScreen() {
  const { currentTheme, isDarkMode, setIsDarkMode } = useContext(PaperThemeContext);
  const { bibleState, profileState, updateBiblePreferences, updateProfile, logout } = useAppState();
  const [notifications, setNotifications] = useState(profileState.notificationPrefs?.morningDevotional ?? true);
  const [offline, setOffline] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [displayName, setDisplayName] = useState(profileState.displayName || "");
  const [language, setLanguage] = useState(profileState.language || "en");
  const [orientation, setOrientation] = useState(profileState.screenOrientation || "any");
  const [statusMessage, setStatusMessage] = useState("");
  const [versionInfo, setVersionInfo] = useState(null);
  const fontScaleLabel = `${Math.round(bibleState.fontScale * 100)}%`;

  useEffect(() => {
    appAPI.getVersion().then((info) => {
      if (info) setVersionInfo(info);
    });
  }, []);

  const saveSettings = () => {
    updateProfile({
      displayName,
      language,
      screenOrientation: orientation,
      notificationPrefs: {
        ...profileState.notificationPrefs,
        morningDevotional: notifications,
      },
    });
    setStatusMessage("Settings saved.");
  };

  const handleCheckForUpdates = async () => {
    const info = await appAPI.getVersion();
    if (info?.version) {
      setVersionInfo(info);
      setStatusMessage(`App is on version ${info.version}. ${info.releaseNotes || ""}`);
    } else {
      setStatusMessage("Unable to verify updates. Please try again later.");
    }
  };

  const handleShareApp = async () => {
    const url = Platform.OS === "ios"
      ? "https://apps.apple.com/app/id000000000"
      : "https://play.google.com/store/apps/details?id=com.hearttoheart.app";
    try {
      await Share.share({
        message: `Check out Heart to Heart devotional app: ${url}`,
      });
    } catch (error) {
      setStatusMessage("Unable to share right now.");
    }
  };

  return (
    <Screen>
      <Header back title="Settings" />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.bold}>Profile</Text>
          <TextInput
            label="Display Name"
            value={displayName}
            onChangeText={setDisplayName}
            style={styles.input}
            mode="outlined"
          />
          <List.Item
            title="Language"
            description={language.toUpperCase()}
            left={() => <MaterialCommunityIcons name="translate" size={24} color={currentTheme.colors.primary} />}
            onPress={() => {
              const next = language === "en" ? "es" : language === "es" ? "fr" : "en";
              setLanguage(next);
              setStatusMessage(`Language switched to ${next.toUpperCase()}.`);
            }}
          />
          <List.Item
            title="Orientation"
            description={orientation === "any" ? "Automatic" : orientation === "portrait" ? "Portrait" : "Landscape"}
            left={() => <MaterialCommunityIcons name="screen-rotation" size={24} color={currentTheme.colors.primary} />}
            onPress={() => {
              const next = orientation === "any" ? "portrait" : orientation === "portrait" ? "landscape" : "any";
              setOrientation(next);
            }}
          />
          <Button mode="contained" onPress={saveSettings} style={styles.actionButton}>
            Save profile settings
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.bold}>Display</Text>
          <List.Item title="Dark mode" left={() => <MaterialCommunityIcons name="theme-light-dark" size={24} color={currentTheme.colors.primary} />} right={() => <Switch value={isDarkMode} onValueChange={setIsDarkMode} />} />
          <List.Item title="Daily reminders" left={() => <MaterialCommunityIcons name="bell-outline" size={24} color={currentTheme.colors.primary} />} right={() => <Switch value={notifications} onValueChange={setNotifications} />} />
          <List.Item title="Offline fallback" description="Show cached content when connection is lost." left={() => <MaterialCommunityIcons name="wifi-off" size={24} color={currentTheme.colors.primary} />} right={() => <Switch value={offline} onValueChange={setOffline} />} />
          <Text variant="bodySmall" style={styles.muted}>Font size: {fontScaleLabel}</Text>
          <View style={styles.fontControlRow}>
            <Button mode="outlined" onPress={() => updateBiblePreferences({ fontScale: Math.max(0.85, bibleState.fontScale - 0.1) })}>A-</Button>
            <Button mode="outlined" onPress={() => updateBiblePreferences({ fontScale: 1 })}>Default</Button>
            <Button mode="outlined" onPress={() => updateBiblePreferences({ fontScale: Math.min(1.35, bibleState.fontScale + 0.1) })}>A+</Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.bold}>App Actions</Text>
          <List.Item
            title="Check for updates"
            description={versionInfo?.version ? `Current: ${versionInfo.version}` : "Tap to verify version"}
            left={() => <MaterialCommunityIcons name="cloud-download-outline" size={24} color={currentTheme.colors.primary} />}
            onPress={handleCheckForUpdates}
          />
          <List.Item
            title="Share app"
            description="Invite friends to download Heart to Heart"
            left={() => <MaterialCommunityIcons name="share-variant" size={24} color={currentTheme.colors.primary} />}
            onPress={handleShareApp}
          />
          <List.Item
            title="Connect With Us"
            description="Send feedback, questions, or prayer requests"
            left={() => <MaterialCommunityIcons name="account-group-outline" size={24} color={currentTheme.colors.primary} />}
            onPress={() => navigation.navigate('Connect')}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.bold}>Account</Text>
          <List.Item
            title="Logout"
            description={profileState.displayName ? `Signed in as ${profileState.displayName}` : "Sign out of your account"}
            left={() => <MaterialCommunityIcons name="logout" size={24} color={currentTheme.colors.primary} />}
            onPress={() => {
              logout();
              setStatusMessage('You have been signed out.');
            }}
          />
        </Card.Content>
      </Card>

      <Portal>
        <Dialog visible={dialog} onDismiss={() => setDialog(false)}>
          <Dialog.Title>Policy placeholder</Dialog.Title>
          <Dialog.Content><Text>Production legal copy can be connected here before store submission.</Text></Dialog.Content>
          <Dialog.Actions><Button onPress={() => setDialog(false)}>Done</Button></Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!statusMessage} onDismiss={() => setStatusMessage('')}>
        {statusMessage}
      </Snackbar>
    </Screen>
  );
}

function MiniPlayer() {
  const { audioState, togglePlayback } = useAppState();
  const { currentTheme } = useContext(PaperThemeContext);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  if (!audioState.currentTrack) return null;

  return (
    <Pressable onPress={() => navigation.navigate("AudioPlayer")} style={[styles.miniPlayer, { bottom: 76 + insets.bottom, backgroundColor: currentTheme.colors.surface }]}>
      <MaterialCommunityIcons name="headphones" size={22} color={currentTheme.colors.primary} />
      <View style={styles.flex}>
        <Text variant="labelLarge" numberOfLines={1}>{audioState.currentTrack.title}</Text>
        <Text variant="labelSmall" style={styles.muted}>{audioState.isPlaying ? "Playing" : "Paused"}</Text>
      </View>
      <Pressable onPress={togglePlayback} style={styles.iconButton}><MaterialCommunityIcons name={audioState.isPlaying ? "pause" : "play"} size={22} color={currentTheme.colors.primary} /></Pressable>
    </Pressable>
  );
}

function TabIcon({ name, color }) {
  return <MaterialCommunityIcons name={name} size={24} color={color} />;
}

function MainTabs() {
  const { currentTheme } = useContext(PaperThemeContext);
  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: currentTheme.colors.primary,
          tabBarInactiveTintColor: currentTheme.colors.outline,
          tabBarStyle: {
            height: 70,
            paddingTop: 8,
            paddingBottom: 10,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            position: "absolute",
          },
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarIcon: (props) => <TabIcon name="home-variant" {...props} /> }} />
        <Tab.Screen name="Bible" component={BibleScreen} options={{ tabBarIcon: (props) => <TabIcon name="book-open-page-variant" {...props} /> }} />
        <Tab.Screen name="Hymns" component={HymnsScreen} options={{ tabBarIcon: (props) => <TabIcon name="music-note-outline" {...props} /> }} />
        <Tab.Screen name="Search" component={SearchScreen} options={{ tabBarIcon: (props) => <TabIcon name="magnify" {...props} /> }} />
        <Tab.Screen name="Premium" component={PremiumHubScreen} options={{ tabBarIcon: (props) => <TabIcon name="crown-outline" {...props} /> }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: (props) => <TabIcon name="account-circle-outline" {...props} /> }} />
      </Tab.Navigator>
      <MiniPlayer />
    </>
  );
}

function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: "#FAFAF8" } }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Auth" component={ExternalAuthScreen} />
      <Stack.Screen name="FAQ" component={FAQScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="Reading" component={ReadingScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: "modal" }} />
      <Stack.Screen name="Audio" component={AudioScreen} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} />
      <Stack.Screen name="DevotionalDetail" component={DevotionalDetailScreen} />
      <Stack.Screen name="Donate" component={DonateScreen} />
      <Stack.Screen name="ManageGifts" component={ManageGiftsScreen} />
      {["Bookmarks", "Favorites", "Downloads", "Plans", "Prayer", "Prayer Journal", "Saved Notes", "Reading Stats", "Edit Profile", "Change Password", "Notifications", "Support", "Offline", "Sermons", "Assistant", "Devotionals", "ContinueReading"].map((name) => (
        <Stack.Screen key={name} name={name} component={UtilityScreen} />
      ))}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Connect" component={ConnectWithUs} />
    </Stack.Navigator>
  );
}

function AppProviders() {
  const { currentTheme } = useContext(PaperThemeContext);
  const { booted, navigationState, persistNavigationState } = useAppState();

  if (!booted) {
    return (
      <PaperProvider theme={currentTheme}>
        <SplashScreen navigation={{ replace: () => {} }} />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={currentTheme}>
      <StatusBar style="auto" />
      <BookmarkProvider>
        <NavigationContainer initialState={navigationState} onStateChange={persistNavigationState}>
          <RootNavigator />
        </NavigationContainer>
      </BookmarkProvider>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") document.body.style.overflow = "auto";
  }, []);

  return (
    <SafeAreaProvider>
      <PaperThemeProvider>
        <AppStateProvider>
          <AppProviders />
        </AppStateProvider>
      </PaperThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenPadding: { paddingHorizontal: 16, paddingTop: 12 },
  scrollContent: { paddingBottom: 150 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 12 },
  headerTitleWrap: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  bold: { fontWeight: "800" },
  muted: { color: "#7e7773", marginTop: 4, lineHeight: 20 },
  centerText: { textAlign: "center" },
  card: { borderRadius: 12, marginBottom: 12 },
  listCard: { borderRadius: 12, marginHorizontal: 16, marginBottom: 10 },
  listContent: { paddingTop: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  between: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" },
  iconTile: { width: 50, height: 50, borderRadius: 12, backgroundColor: "#FFE0E6", alignItems: "center", justifyContent: "center" },
  hero: { borderRadius: 16, padding: 18, marginBottom: 14 },
  todayHero: { borderRadius: 22, padding: 18, marginBottom: 14, overflow: "hidden" },
  weekRail: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  dayDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.72)" },
  devotionalPreview: { backgroundColor: "rgba(255,255,255,0.86)", borderRadius: 14, padding: 12, marginTop: 10 },
  dualActions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  gridTwo: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  quickCard: { width: "48%", borderRadius: 12, padding: 14, minHeight: 112 },
  miniProgress: { height: 5, borderRadius: 5, backgroundColor: "#E9DFCF", marginTop: 10, overflow: "hidden" },
  miniProgressFill: { height: 5, borderRadius: 5, backgroundColor: "#F15A24" },
  primaryButton: { marginTop: 12, marginBottom: 8 },
  input: { minHeight: 52, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e7dfd8", marginBottom: 12 },
  splash: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashLogo: { width: 104, height: 104, borderRadius: 24, marginBottom: 18 },
  skeletonLine: { height: 14, borderRadius: 8, marginBottom: 12 },
  emptyState: { borderRadius: 12, padding: 24, alignItems: "center", marginBottom: 12 },
  lockedCard: { borderWidth: 1, borderColor: "#f2d0d9" },
  avatar: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#FFE0E6", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 12, backgroundColor: "#fff", padding: 12, alignItems: "center" },
  verseBox: { backgroundColor: "#F5F1E8", borderRadius: 12, padding: 14, marginVertical: 16 },
  hymnDetailCard: { marginTop: 12, marginBottom: 24 },
  fontControlRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  studyCard: { marginHorizontal: 18, marginTop: 6 },
  readerHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1 },
  readerTitleBlock: { flex: 1, marginLeft: 6, marginRight: 6 },
  readingControls: { flexDirection: "row", alignItems: "center", gap: 4 },
  readerMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  readerMetaChip: { marginRight: 6 },
  chapterRail: { paddingVertical: 10 },
  verseRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 10 },
  highlightedVerse: { backgroundColor: "rgba(255, 214, 102, 0.35)" },
  verseNum: { width: 28, fontWeight: "800", paddingTop: 2 },
  verseText: { flex: 1, lineHeight: 27 },
  readerBottom: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, paddingBottom: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e6ded6" },
  segment: { flexDirection: "row", gap: 10, marginBottom: 12 },
  paywallHeader: { height: 220, backgroundColor: "#111" },
  paywallImage: { width: "100%", height: "100%" },
  paywallClose: { position: "absolute", right: 16, top: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" },
  paywallSheet: { marginTop: -26, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: "#fff", padding: 20, paddingBottom: 34 },
  sponsorshipRow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F3EDE0", borderRadius: 12, padding: 14, marginTop: 18, marginBottom: 12 },
  paywallFeature: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 10 },
  planCard: { flex: 1, borderRadius: 14, borderWidth: 1, borderColor: "#E1D8CA", padding: 12, backgroundColor: "#fff" },
  planSelected: { borderColor: "#F15A24", backgroundColor: "#FFF3EA" },
  playerArt: { width: 210, height: 210, borderRadius: 18, backgroundColor: "#FFE0E6", alignItems: "center", justifyContent: "center", alignSelf: "center", marginVertical: 18 },
  progressTrack: { height: 8, borderRadius: 8, backgroundColor: "#eadfd8", marginVertical: 24, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 8, backgroundColor: "#E94E77" },
  playerControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 24 },
  roundButton: { width: 54, height: 54, borderRadius: 27, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  playButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#E94E77", alignItems: "center", justifyContent: "center" },
  miniPlayer: { position: "absolute", left: 12, right: 12, minHeight: 58, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 10, elevation: 9, shadowColor: "#000", shadowOpacity: 0.14, shadowRadius: 12 },
});

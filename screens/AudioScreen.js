import React, { useContext, useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Card, Text, Button, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppState } from "../contexts/AppContext";
import { audioAPI, devotionalAPI } from "../services/api";
import { getHymns } from "../services/localDatabase";
import { PaperThemeContext } from "../components/PaperThemeContext";

export default function AudioScreen({ route, navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const { playTrack } = useAppState();
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const selectedDevotional = route?.params?.item;

    const loadTracks = async () => {
      setLoading(true);
      setError("");

      try {
        const devotional = selectedDevotional || (await devotionalAPI.getTodayDevotional());
        const libraryItems = await audioAPI.getLibrary();
        const hymnItems = getHymns(5);

        const devotionalTrack = devotional
          ? {
              id: `devotional-${devotional.id || "today"}`,
              title: devotional.title || "Today's Audio Devotional",
              host: "Heart to Heart",
              duration: `${devotional.readTime || 2} min read`,
              durationSeconds: Math.max(60, Math.ceil((devotional.fullBody || devotional.body || "").split(/\s+/).length / 2.5)),
              type: "Devotional",
              description: devotional.verse || "Today's reading aloud with the device voice.",
              text: [devotional.title, devotional.verse, devotional.fullBody || devotional.body, devotional.confession, devotional.prayer]
                .filter(Boolean)
                .join("\n\n"),
            }
          : null;

        const libraryTracks = Array.isArray(libraryItems)
          ? libraryItems.map((item, index) => ({
              id: item.id || item._id || `audio-${index + 1}`,
              title: item.title || item.name || "Audio devotional",
              host: item.host || item.author || "Heart to Heart",
              duration: item.duration || "Audio",
              durationSeconds: item.durationSeconds || 900,
              type: item.type || "Audio",
              description: item.description || item.subtitle || "",
              text: item.text || item.body || item.content || "",
              audioUrl: item.audioUrl || item.playbackUrl,
            }))
          : [];

        const hymnTracks = hymnItems.map((hymn, index) => ({
          id: `hymn-${hymn.id || index}`,
          title: hymn.title,
          host: hymn.author || "Heart to Heart",
          duration: "3 mins",
          type: "Hymn",
          description: hymn.story || hymn.note || "",
          text: hymn.lyrics || hymn.note || hymn.story || hymn.title,
        }));

        const nextTracks = devotionalTrack ? [devotionalTrack, ...libraryTracks, ...hymnTracks] : [...libraryTracks, ...hymnTracks];

        if (active) {
          setTracks(nextTracks);
        }
      } catch (err) {
        if (active) {
          setTracks([]);
          setError("Audio content could not be loaded. Please try again.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTracks();
    return () => { active = false; };
  }, [route?.params?.item]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.background, justifyContent: "center" }]}>
        <ActivityIndicator animating size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Audio Library
        </Text>
        <MaterialCommunityIcons name="headphones" size={26} color={currentTheme.colors.primary} />
      </View>

      <Card style={[styles.summaryCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
        <Card.Content>
          <Text variant="labelLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
            Local + guided listening
          </Text>
          <Text style={{ color: currentTheme.colors.onSurface, marginTop: 6, lineHeight: 22 }}>
            Listen to devotionals, hymns, and guided audio while keeping the app smooth and offline-friendly.
          </Text>
        </Card.Content>
      </Card>

      {error ? (
        <Text style={{ color: currentTheme.colors.onSurface, marginBottom: 12 }}>{error}</Text>
      ) : null}

      {tracks.length === 0 ? (
        <Text style={{ color: currentTheme.colors.onSurface }}>No audio tracks are available right now.</Text>
      ) : (
        tracks.map((track) => (
          <Card key={track.id} style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name="play-circle" size={28} color={currentTheme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                  {track.title}
                </Text>
                <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 4 }}>
                  {track.type} · {track.host} · {track.duration}
                </Text>
              </View>
              <Button
                mode="contained"
                compact
                onPress={() => {
                  playTrack({ ...track, durationSeconds: track.durationSeconds || 180 }, []);
                  if (navigation) navigation.navigate("AudioPlayer", { track });
                }}
              >
                Play
              </Button>
            </Card.Content>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  summaryCard: { borderWidth: 1, borderRadius: 16, marginBottom: 16 },
  card: { borderWidth: 1, borderRadius: 14, marginBottom: 12 },
  cardContent: { flexDirection: "row", alignItems: "center" },
  iconWrap: { marginRight: 12 },
});

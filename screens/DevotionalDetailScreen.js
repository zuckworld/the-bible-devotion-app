import React, { useContext, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Share } from "react-native";
import { Card, Text, Button, Divider, Snackbar, useTheme } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Speech from 'expo-speech';
import { PaperThemeContext } from "../components/PaperThemeContext";
import { BookmarkContext } from "../bookmarks/BookmarkContext";
import { userAPI } from "../services/api";
import { cleanDevotional } from "../utils/textCleanup";

export default function DevotionalDetailScreen({ route, navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const { toggleBookmark, isBookmarked } = useContext(BookmarkContext);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const item = cleanDevotional(route.params.item);

  useEffect(() => {
    // Record that user read this devotional
    userAPI.recordReading(item.id);
  }, [item.id]);

  const handleBookmark = () => {
    toggleBookmark(item);
    const bookmarked = isBookmarked(item.date);
    setSnackbarMessage(bookmarked ? "Removed from bookmarks" : "Added to bookmarks");
    setSnackbarVisible(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${item.title}\n\n"${item.verse}"\n\n${item.fullBody}\n\n- From Heart to Heart Daily Devotional`,
        title: item.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header with Back Button and Actions */}
      <View style={styles.header}>
        <Button
          icon="arrow-left"
          onPress={() => navigation.goBack()}
          style={{ alignSelf: "flex-start" }}
          compact
        >
          Back
        </Button>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button icon="share-variant" onPress={handleShare} compact />
          <Button
            icon={isBookmarked(item.date) ? "bookmark" : "bookmark-outline"}
            onPress={handleBookmark}
            compact
            textColor={currentTheme.colors.primary}
          />
        </View>
      </View>

      {/* Main Content Card */}
      <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
        <Card.Content style={styles.cardContent}>
          {/* Date and Title Section */}
          <Text
            variant="labelSmall"
            style={{
              color: currentTheme.colors.primary,
              fontWeight: "600",
              marginBottom: 8,
            }}
          >
            {item.date}
          </Text>

          <Text
            variant="headlineSmall"
            style={{
              color: currentTheme.colors.onSurface,
              fontWeight: "700",
              marginBottom: 16,
            }}
          >
            {item.title}
          </Text>

          <Divider style={{ marginBottom: 16 }} />

          {/* Verse Section */}
          <View
            style={{
              backgroundColor: currentTheme.colors.surfaceVariant,
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
            }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: currentTheme.colors.onSurface,
                fontStyle: "italic",
                lineHeight: 22,
              }}
            >
              "{item.verse}"
            </Text>
          </View>

          {/* Reading Time */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 16,
              gap: 8,
            }}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color={currentTheme.colors.outline}
            />
            <Text
              variant="labelSmall"
              style={{ color: currentTheme.colors.outline }}
            >
              {item.readTime} min read
            </Text>
          </View>

          <Divider style={{ marginBottom: 16 }} />

          {/* Body Section */}
          <Text
            variant="bodyMedium"
            style={{
              color: currentTheme.colors.onSurface,
              lineHeight: 24,
              marginBottom: 20,
            }}
          >
            {item.fullBody}
          </Text>
        </Card.Content>
      </Card>

      {/* Confession Section */}
      {item.confession && (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.primaryContainer }]}>
          <Card.Content style={styles.cardContent}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialCommunityIcons
                name="hand-heart"
                size={24}
                color={currentTheme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: currentTheme.colors.primary,
                  fontWeight: "700",
                }}
              >
                Your Confession
              </Text>
            </View>
            <Divider style={{ marginBottom: 12 }} />
            <Text
              variant="bodyMedium"
              style={{
                color: currentTheme.colors.onPrimaryContainer,
                lineHeight: 22,
              }}
            >
              {item.confession}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Prayer Section */}
      {item.prayer && (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.secondaryContainer }]}>
          <Card.Content style={styles.cardContent}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
              <MaterialCommunityIcons
                name="hands-pray"
                size={24}
                color={currentTheme.colors.secondary}
                style={{ marginRight: 8 }}
              />
              <Text
                variant="titleMedium"
                style={{
                  color: currentTheme.colors.secondary,
                  fontWeight: "700",
                }}
              >
                Prayer
              </Text>
            </View>
            <Divider style={{ marginBottom: 12 }} />
            <Text
              variant="bodyMedium"
              style={{
                color: currentTheme.colors.onSecondaryContainer,
                lineHeight: 22,
              }}
            >
              {item.prayer}
            </Text>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
            <Button
              mode="outlined"
              onPress={() => navigation.navigate("Audio")}
              style={{ flex: 1, marginRight: 8 }}
              icon="headphones"
            >
              Audio
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                Speech.stop();
                Speech.speak(item.fullBody || item.body || item.description || item.title, {
                  language: 'en-US',
                  pitch: 1.0,
                  rate: 1.0,
                });
              }}
              style={{ flex: 1, marginLeft: 8 }}
              icon="text-to-speech"
            >
              Listen (TTS)
            </Button>
        <Button
          mode="contained"
          onPress={handleShare}
          style={{ flex: 1 }}
          icon="share-variant"
        >
          Share
        </Button>
      </View>

      <View style={{ height: 50 }} />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={2000}
      >
        {snackbarMessage}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
  },
  cardContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 8,
  },
});

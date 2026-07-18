import React, { useState, useEffect, useContext } from "react";
import { View, ScrollView, StyleSheet, Share } from "react-native";
import {
  Card,
  Text,
  Button,
  Snackbar,
  ActivityIndicator,
  Chip,
  Divider,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { devotionalAPI, userAPI } from "../services/api";

export default function HomeScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  
  const [todayDevotional, setTodayDevotional] = useState(null);
  const [weeklyDevotionals, setWeeklyDevotionals] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = await devotionalAPI.getTodayDevotional();
      const weekly = await devotionalAPI.getWeeklyDevotionals();
      const user = await userAPI.getUserData();

      setTodayDevotional(today);
      setWeeklyDevotionals(weekly);
      setUserData(user);
    } catch (error) {
      console.error("Error loading data:", error);
      setSnackbarMessage("Error loading devotionals");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleReadToday = () => {
    if (todayDevotional) {
      userAPI.recordReading(todayDevotional.id);
      navigation.navigate("DevotionalStack", {
        screen: "DevotionalDetail",
        params: { item: todayDevotional },
      });
    }
  };

  const handleShare = async () => {
    if (todayDevotional) {
      try {
        await Share.share({
          message: `${todayDevotional.title}\n\n"${todayDevotional.verse}"\n\n- From Heart to Heart Daily Devotional`,
          title: todayDevotional.title,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.colors.background, justifyContent: "center" }]}>
        <ActivityIndicator animating={true} size="large" color={currentTheme.colors.primary} />
      </View>
    );
  }

  const progressPercentage = userData?.progressPercentage || 0;
  const daysRead = userData?.readingHistory?.length || 0;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
          Today
        </Text>
        <MaterialCommunityIcons name="bell" size={24} color={currentTheme.colors.primary} />
      </View>

      {/* Daily Devotional Card */}
      {todayDevotional && (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="labelSmall"
                  style={{ color: currentTheme.colors.primary, fontWeight: "600", marginBottom: 8 }}
                >
                  The Daily Divine Message
                </Text>
                <Text variant="labelSmall" style={{ color: currentTheme.colors.outline }}>
                  {todayDevotional.date}
                </Text>
              </View>
              <Button
                icon="share-variant"
                mode="text"
                onPress={handleShare}
                style={{ alignSelf: "flex-start" }}
                compact
              />
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <Text
              variant="bodyMedium"
              style={{
                color: currentTheme.colors.onSurface,
                lineHeight: 22,
                marginBottom: 12,
                fontStyle: "italic",
              }}
            >
              "{todayDevotional.verse}"
            </Text>

            <Text
              variant="bodySmall"
              style={{
                color: currentTheme.colors.onSurface,
                lineHeight: 20,
                marginBottom: 16,
              }}
            >
              {todayDevotional.body}
            </Text>

            <Button
              mode="contained"
              onPress={handleReadToday}
              style={{
                marginTop: 8,
                backgroundColor: currentTheme.colors.primary,
              }}
              labelStyle={{ fontSize: 12 }}
            >
              Read Prayer
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Prayer Reminder Card */}
      <Card
        style={[
          styles.card,
          {
            backgroundColor: currentTheme.colors.secondaryContainer,
          },
        ]}
      >
        <Card.Content style={styles.cardContent}>
          <View style={styles.reminderContent}>
            <MaterialCommunityIcons
              name="hands-pray"
              size={32}
              color={currentTheme.colors.secondary}
              style={{ marginRight: 12 }}
            />
            <View style={{ flex: 1 }}>
              <Text variant="labelMedium" style={{ fontWeight: "600", color: currentTheme.colors.onSurface }}>
                Want to Deepen Your Faith
              </Text>
              <Text variant="labelSmall" style={{ color: currentTheme.colors.onSurfaceVariant, marginTop: 4 }}>
                Prayer sessions and spiritual guidance
              </Text>
            </View>
          </View>
          <Button
            mode="contained-tonal"
            onPress={() => navigation.navigate("Audio")}
            style={{ marginTop: 12 }}
            labelStyle={{ fontSize: 11 }}
          >
            Request Prayer
          </Button>
        </Card.Content>
      </Card>

      {/* Explore Devotionals Section */}
      <View style={{ paddingVertical: 12 }}>
        <Text variant="headlineSmall" style={{ marginHorizontal: 16, color: currentTheme.colors.onSurface, fontWeight: "700" }}>
          Explore Devotionals
        </Text>
      </View>

      {/* Devotional Cards Grid */}
      <View style={styles.gridContainer}>
        {weeklyDevotionals.slice(0, 3).map((dev, index) => (
          <Card
            key={index}
            style={[
              styles.gridCard,
              {
                backgroundColor: currentTheme.colors.surfaceVariant,
              },
            ]}
            onPress={() => navigation.navigate("DevotionalStack", { screen: "DevotionalDetail", params: { item: dev } })}
          >
            <Card.Content style={styles.gridCardContent}>
              <View
                style={[
                  styles.imagePlaceholder,
                  {
                    backgroundColor: [
                      currentTheme.colors.primaryContainer,
                      currentTheme.colors.secondaryContainer,
                      currentTheme.colors.tertiaryContainer,
                    ][index],
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={["sun-check", "moon-waning-crescent", "leaf"][index]}
                  size={40}
                  color={currentTheme.colors.primary}
                />
              </View>
              <Text
                variant="bodySmall"
                style={{
                  marginTop: 8,
                  color: currentTheme.colors.onSurface,
                  fontWeight: "600",
                }}
                numberOfLines={2}
              >
                {dev.title.substring(0, 30)}...
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Explore Videos Section */}
      <View style={{ paddingVertical: 12, marginTop: 8 }}>
        <Text variant="headlineSmall" style={{ marginHorizontal: 16, color: currentTheme.colors.onSurface, fontWeight: "700" }}>
          Explore Videos
        </Text>
      </View>

      {/* Video Chips */}
      <View style={{ flexDirection: "row", marginHorizontal: 16, marginBottom: 24, gap: 8, flexWrap: "wrap" }}>
        {["Reflections", "Inspiration", "Teaching", "Worship", "Community", "Growth"].map((label) => (
          <Chip key={label} icon="play-circle" onPress={() => navigation.navigate("Audio")} style={{ backgroundColor: currentTheme.colors.surfaceVariant }}>
            {label}
          </Chip>
        ))}
      </View>

      {/* Progress Section */}
      {userData && (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="labelMedium" style={{ color: currentTheme.colors.onSurface, fontWeight: "600", marginBottom: 12 }}>
              Your Progress
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View>
                <Text variant="headlineMedium" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                  {daysRead}
                </Text>
                <Text variant="labelSmall" style={{ color: currentTheme.colors.outline }}>
                  Days Read
                </Text>
              </View>
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: currentTheme.colors.surfaceVariant,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                  {progressPercentage}%
                </Text>
                <Text variant="labelSmall" style={{ color: currentTheme.colors.outline }}>
                  Progress
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>

      <View style={{ height: 50 }} />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  reminderContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  gridContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    borderRadius: 12,
  },
  gridCardContent: {
    padding: 12,
  },
  imagePlaceholder: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});


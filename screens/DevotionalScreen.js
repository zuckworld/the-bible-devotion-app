import React, { useContext, useState, useEffect } from "react";
import { View, ScrollView, StyleSheet, Share } from "react-native";
import {
  Card,
  Text,
  Button,
  Divider,
  Snackbar,
  ActivityIndicator,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { devotionalAPI, userAPI } from "../services/api";

export default function DevotionalScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  
  const [todayDevotional, setTodayDevotional] = useState(null);
  const [devotionalsForMonth, setDevotionalsForMonth] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("MAY");
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APRIL",
    "MAY",
    "JUNE",
    "JULY",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadMonthlyDevotionals();
  }, [selectedMonth]);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = await devotionalAPI.getTodayDevotional();
      setTodayDevotional(today);
    } catch (error) {
      console.error("Error loading today's devotional:", error);
      setSnackbarMessage("Error loading devotionals");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyDevotionals = async () => {
    try {
      const monthly = await devotionalAPI.getDevotionalsByMonth(selectedMonth);
      setDevotionalsForMonth(monthly);
    } catch (error) {
      console.error("Error loading monthly devotionals:", error);
    }
  };

  const handleReadDevotional = (item) => {
    userAPI.recordReading(item.id);
    navigation.navigate("DevotionalDetail", { item });
  };

  const handleShare = async () => {
    if (todayDevotional) {
      try {
        await Share.share({
          message: `${todayDevotional.title}\n\n"${todayDevotional.verse}"\n\n- From Heart to Heart`,
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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.onBackground, fontWeight: "700" }}>
          Devotionals
        </Text>
      </View>

      {/* Today's Devotional Card */}
      {todayDevotional && (
        <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.titleRow}>
              <View style={{ flex: 1 }}>
                <Text
                  variant="labelSmall"
                  style={{ color: currentTheme.colors.primary, fontWeight: "600", marginBottom: 8 }}
                >
                  TODAY'S DEVOTION
                </Text>
                <Text variant="labelSmall" style={{ color: currentTheme.colors.outline }}>
                  {todayDevotional.date}
                </Text>
              </View>
              <Button icon="share-variant" onPress={handleShare} compact />
            </View>

            <Divider style={{ marginVertical: 12 }} />

            <Text
              variant="titleMedium"
              style={{
                color: currentTheme.colors.onSurface,
                fontWeight: "600",
                marginBottom: 8,
              }}
            >
              {todayDevotional.title}
            </Text>

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
              onPress={() => handleReadDevotional(todayDevotional)}
              style={{ backgroundColor: currentTheme.colors.primary }}
            >
              Read Full Devotion
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Month Selection */}
      <View style={{ paddingHorizontal: 16, marginVertical: 12 }}>
        <Text
          variant="titleMedium"
          style={{ color: currentTheme.colors.onBackground, fontWeight: "700", marginBottom: 12 }}
        >
          Browse by Month
        </Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {months.map((month) => (
            <Button
              key={month}
              mode={selectedMonth === month ? "contained" : "outlined"}
              onPress={() => setSelectedMonth(month)}
              style={{
                backgroundColor:
                  selectedMonth === month ? currentTheme.colors.primary : "transparent",
              }}
              textColor={
                selectedMonth === month ? "#fff" : currentTheme.colors.primary
              }
              compact
            >
              {month}
            </Button>
          ))}
        </View>
      </View>

      {/* Monthly Devotionals Grid */}
      <View style={{ paddingHorizontal: 16, marginVertical: 12 }}>
        <Text
          variant="titleMedium"
          style={{ color: currentTheme.colors.onBackground, fontWeight: "700", marginBottom: 12 }}
        >
          {selectedMonth} Devotions
        </Text>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {devotionalsForMonth.slice(0, 31).map((dev, index) => (
            <Card
              key={index}
              style={[
                styles.dayCard,
                {
                  backgroundColor: currentTheme.colors.surfaceVariant,
                  flex: 0.48,
                },
              ]}
              onPress={() => handleReadDevotional(dev)}
            >
              <Card.Content
                style={{
                  padding: 12,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Text
                  variant="displaySmall"
                  style={{
                    color: currentTheme.colors.primary,
                    fontWeight: "700",
                    fontSize: 20,
                  }}
                >
                  {dev.day}
                </Text>
                <Divider style={{ marginVertical: 8, width: "80%" }} />
                <Text
                  variant="labelSmall"
                  style={{
                    color: currentTheme.colors.onSurface,
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {dev.title.substring(0, 20)}...
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </View>

      <View style={{ height: 80 }} />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  dayCard: {
    borderRadius: 12,
    marginVertical: 4,
  },
});

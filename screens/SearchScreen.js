import React, { useContext } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Text, Chip } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";

const toolCards = [
  { title: "Word Study", subtitle: "Look up terms and definitions", icon: "text-box-search-outline", color: "#0B1F4D" },
  { title: "Themes", subtitle: "Explore key biblical themes", icon: "lightbulb-on-outline", color: "#1D3A70" },
  { title: "Chronology", subtitle: "Track biblical events in order", icon: "calendar-range", color: "#274B8D" },
  { title: "Cross References", subtitle: "Trace related passages", icon: "link-variant", color: "#19376D" },
  { title: "Audio Bible", subtitle: "Listen while you read", icon: "headphones", color: "#2F5AA5" },
  { title: "Saved Notes", subtitle: "Keep personal reflections", icon: "notebook-outline", color: "#4A6FBF" },
];

export default function SearchScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Study Tools
        </Text>
        <Chip mode="outlined" style={[styles.chip, { borderColor: currentTheme.colors.primary }]} textStyle={{ color: currentTheme.colors.primary }}>
          Bible Study
        </Chip>
      </View>

      <Text style={[styles.subtitle, { color: currentTheme.colors.onBackground }]}>
        Deepen your reading with tools for understanding, reflection, and listening.
      </Text>

      <View style={styles.grid}>
        {toolCards.map((card) => (
          <TouchableOpacity
            key={card.title}
            activeOpacity={0.9}
            onPress={() => {
              if (card.title === "Word Study") {
                navigation.navigate("WordStudy");
              } else if (card.title === "Themes") {
                navigation.navigate("StudyThemes");
              } else if (card.title === "Chronology") {
                navigation.navigate("Timeline");
              } else if (card.title === "Cross References") {
                navigation.navigate("CrossReferences");
              } else if (card.title === "Audio Bible") {
                navigation.navigate("Audio");
              } else if (card.title === "Saved Notes") {
                navigation.navigate("Saved Notes");
              } else {
                navigation.navigate("Bible");
              }
            }}
          >
            <View style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
              <MaterialCommunityIcons name={card.icon} size={28} color={card.color} />
              <Text variant="titleMedium" style={[styles.cardTitle, { color: currentTheme.colors.primary }]}>
                {card.title}
              </Text>
              <Text variant="bodySmall" style={[styles.cardSubtitle, { color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline }]}>
                {card.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  chip: { backgroundColor: "transparent" },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  card: {
    width: "48%",
    minHeight: 150,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { marginTop: 14, marginBottom: 6, fontWeight: "700" },
  cardSubtitle: { lineHeight: 18 },
});

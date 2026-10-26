import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { getStudyThemes } from "../services/localDatabase";

export default function StudyThemesScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const [themes, setThemes] = useState([]);

  useEffect(() => {
    setThemes(getStudyThemes(8));
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Study Themes
        </Text>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color={currentTheme.colors.primary} />
      </View>

      <Text style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
        Explore the major biblical themes that shape teaching, preaching, prayer, and personal reflection.
      </Text>

      {themes.map((theme) => (
        <Card key={theme.slug} style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
          <Card.Content>
            <Chip mode="outlined" style={[styles.chip, { borderColor: currentTheme.colors.primary }]} textStyle={{ color: currentTheme.colors.primary }}>
              Theme
            </Chip>
            <Text variant="titleLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginTop: 10 }}>
              {theme.name}
            </Text>
            <Text style={{ color: currentTheme.colors.onSurface, marginTop: 8, lineHeight: 22 }}>
              {theme.description}
            </Text>
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  chip: { alignSelf: "flex-start", backgroundColor: "transparent" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 14 },
});

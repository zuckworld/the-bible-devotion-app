import React, { useContext, useEffect, useMemo, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Text, Searchbar } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { getHymns } from "../services/localDatabase";

export default function HymnsScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const navigation = useNavigation();
  const [query, setQuery] = useState("");
  const [hymns, setHymns] = useState([]);

  useEffect(() => {
    setHymns(getHymns(50));
  }, []);

  const filteredHymns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return hymns;
    return hymns.filter((hymn) => `${hymn.title} ${hymn.author || ""} ${hymn.story || ""}`.toLowerCase().includes(needle));
  }, [hymns, query]);

  const selectedHymn = filteredHymns[0] || null;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Hymns
        </Text>
        <MaterialCommunityIcons name="music-note-outline" size={28} color={currentTheme.colors.primary} />
      </View>

      <Searchbar
        value={query}
        onChangeText={setQuery}
        placeholder="Search hymns"
        style={[styles.searchbar, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}
        inputStyle={{ color: currentTheme.colors.onSurface }}
      />

      {selectedHymn ? (
        <Card style={[styles.featureCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
          <Card.Content>
            <Text variant="labelLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
              Featured hymn
            </Text>
            <Text variant="titleLarge" style={{ color: currentTheme.colors.onSurface, fontWeight: "700", marginTop: 8 }}>
              {selectedHymn.title}
            </Text>
            <Text variant="bodyMedium" style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 4 }}>
              {selectedHymn.author || "Unknown author"}
            </Text>
            {selectedHymn.story ? (
              <Text style={{ color: currentTheme.colors.onSurface, marginTop: 12, lineHeight: 22 }}>
                {selectedHymn.story}
              </Text>
            ) : null}
          </Card.Content>
        </Card>
      ) : null}

      {filteredHymns.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ color: currentTheme.colors.onSurface }}>No hymns match your search.</Text>
        </View>
      ) : (
        filteredHymns.map((hymn) => (
          <Card
            key={hymn.id || hymn.title}
            style={[styles.itemCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}
            onPress={() => navigation.navigate("HymnDetail", { hymn })}
          >
            <Card.Content>
              <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                {hymn.title}
              </Text>
              <Text variant="bodySmall" style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 4 }}>
                {hymn.author || "Unknown author"}
              </Text>
              {hymn.story ? (
                <Text style={{ color: currentTheme.colors.onSurface, marginTop: 10, lineHeight: 20 }} numberOfLines={2}>
                  {hymn.story}
                </Text>
              ) : null}
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
  searchbar: { borderWidth: 1, borderRadius: 12 },
  featureCard: { borderWidth: 1, borderRadius: 16, marginTop: 12, marginBottom: 16 },
  itemCard: { borderWidth: 1, borderRadius: 14, marginBottom: 10 },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
});

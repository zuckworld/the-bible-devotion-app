import React, { useContext } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Card, Text, Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";

export default function HymnDetailScreen({ route, navigation }) {
  const { hymn } = route.params || {};
  const { currentTheme } = useContext(PaperThemeContext);

  const lyrics = hymn?.lyrics || hymn?.note || hymn?.story || "No lyrics are available for this hymn yet.";

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Button mode="text" onPress={() => navigation.goBack()} icon="arrow-left" compact>
          Back
        </Button>
      </View>

      <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
        <Card.Content>
          <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
            {hymn?.title || "Hymn"}
          </Text>

          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={18} color={currentTheme.colors.primary} />
            <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginLeft: 6 }}>
              {hymn?.author || hymn?.author_composer || "Unknown author"}
            </Text>
          </View>

          {hymn?.story ? (
            <Text style={{ color: currentTheme.colors.onSurface, marginTop: 16, lineHeight: 22 }}>
              {hymn.story}
            </Text>
          ) : null}

          <Text style={{ color: currentTheme.colors.onSurface, marginTop: 18, lineHeight: 26 }}>
            {lyrics}
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  headerRow: { marginBottom: 8 },
  card: { borderWidth: 1, borderRadius: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
});

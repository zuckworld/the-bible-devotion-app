import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { getCrossReferences } from "../services/localDatabase";

export default function CrossReferencesScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const [references, setReferences] = useState([]);

  useEffect(() => {
    setReferences(getCrossReferences(6));
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Cross References
        </Text>
        <MaterialCommunityIcons name="link-variant" size={27} color={currentTheme.colors.primary} />
      </View>

      <Text style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
        Trace related passages and discover how one biblical truth connects to another theme across Scripture.
      </Text>

      {references.map((item) => (
        <Card key={item.topic} style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
          <Card.Content>
            <View style={styles.metaRow}>
              <Chip mode="outlined" style={[styles.chip, { borderColor: currentTheme.colors.primary }]} textStyle={{ color: currentTheme.colors.primary }}>
                {item.category}
              </Chip>
            </View>

            <Text variant="titleLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginTop: 12 }}>
              {item.topic}
            </Text>

            <Text style={{ color: currentTheme.colors.onSurface, marginTop: 8, lineHeight: 22 }}>
              {item.summary}
            </Text>

            <View style={styles.referencesWrap}>
              {item.references.map((reference) => (
                <Text key={`${item.topic}-${reference}`} style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginBottom: 6 }}>
                  • {reference}
                </Text>
              ))}
            </View>
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
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  chip: { backgroundColor: "transparent" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 14 },
  referencesWrap: { marginTop: 12 },
});

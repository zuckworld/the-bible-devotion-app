import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Card, Chip, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import { getTimelineEvents } from "../services/localDatabase";

export default function TimelineScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(getTimelineEvents(12));
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Bible Timeline
        </Text>
        <MaterialCommunityIcons name="calendar-range" size={28} color={currentTheme.colors.primary} />
      </View>

      <Text style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginBottom: 16 }}>
        Follow major biblical events in historical context to understand the flow of God's story.
      </Text>

      {events.map((event) => (
        <Card key={`${event.title}-${event.period}`} style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
          <Card.Content>
            <View style={styles.metaRow}>
              <Chip mode="outlined" style={[styles.chip, { borderColor: currentTheme.colors.primary }]} textStyle={{ color: currentTheme.colors.primary }}>
                {event.category}
              </Chip>
              <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginLeft: 8, fontWeight: "700" }}>
                {event.period}
              </Text>
            </View>

            <Text variant="titleLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginTop: 12 }}>
              {event.title}
            </Text>
            <Text style={{ color: currentTheme.colors.onSurface, marginTop: 8, lineHeight: 22 }}>
              {event.description}
            </Text>
            <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 10, fontWeight: "600" }}>
              {event.reference}
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
  metaRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap" },
  chip: { backgroundColor: "transparent" },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 14 },
});

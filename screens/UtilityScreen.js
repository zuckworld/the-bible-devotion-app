import React, { useContext } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Card, Text } from "react-native-paper";
import { useAppState } from "../contexts/AppContext";
import { PaperThemeContext } from "../components/PaperThemeContext";

export default function UtilityScreen({ route, navigation }) {
  const { bibleState } = useAppState();
  const { currentTheme } = useContext(PaperThemeContext);
  const notes = bibleState?.notes || [];
  const isSavedNotes = route?.name === "Saved Notes";

  if (!isSavedNotes) {
    return (
      <View style={[styles.center, { backgroundColor: currentTheme.colors.background }]}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary }}>Utility</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800", marginBottom: 8 }}>
        Saved Notes
      </Text>

      {notes.length === 0 ? (
        <Card style={[styles.emptyCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
          <Card.Content>
            <Text style={{ color: currentTheme.colors.onSurface, lineHeight: 22 }}>
              Your Bible notes and personal reflections will appear here.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        notes.map((note, index) => (
          <TouchableOpacity key={`${note.key || index}`} activeOpacity={0.9} onPress={() => navigation.navigate("Reading", { bookTitle: note.book, versionCode: "KJV", chapterIndex: Math.max(0, (Number(note.chapter) || 1) - 1) })}>
            <Card style={[styles.noteCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
              <Card.Content>
                <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                  {note.book} {note.chapter}:{note.verse}
                </Text>
                <Text style={[styles.noteText, { color: currentTheme.colors.onSurface }]}>
                  {note.note || "Saved reflection"}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  emptyCard: { borderWidth: 1, borderRadius: 14 },
  noteCard: { borderWidth: 1, borderRadius: 14, marginBottom: 12 },
  noteText: { marginTop: 8, lineHeight: 22 },
});

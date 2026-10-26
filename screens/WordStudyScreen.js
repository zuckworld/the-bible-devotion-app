import React, { useContext, useEffect, useState } from "react";
import { ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Button, Card, Text } from "react-native-paper";
import axios from "axios";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "../components/PaperThemeContext";
import EastonsDefinition from "../components/EastonsDefinition";
import { getDictionaryEntries, isBibleTerm, searchDictionaryTerms, searchVersesByWord } from "../services/localDatabase";

export default function WordStudyScreen({ navigation }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const [query, setQuery] = useState("faith");
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState(null);
  const [matches, setMatches] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const runSearch = async (term = query) => {
    const trimmed = (term || "").trim();
    if (!trimmed) return;

    setLoading(true);

    const eastonsEntries = getDictionaryEntries(trimmed);
    if (eastonsEntries.length > 0) {
      setDefinition({ source: "eastons", entries: eastonsEntries });
    } else if (isBibleTerm(trimmed)) {
      setDefinition({ source: "bible", entries: [] });
    } else {
      try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(trimmed)}`);
        const first = res.data && res.data[0];
        setDefinition(first || null);
      } catch (error) {
        setDefinition(null);
      }
    }

    const verseMatches = searchVersesByWord(trimmed).slice(0, 8);
    setMatches(verseMatches);
    setSuggestions([]);
    setLoading(false);
  };

  const handleQueryChange = (value) => {
    setQuery(value);
    setSuggestions(searchDictionaryTerms(value));
  };

  useEffect(() => {
    runSearch("faith");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800" }}>
          Word Study
        </Text>
        <Button mode="contained" onPress={() => runSearch(query)} compact>
          Search
        </Button>
      </View>

      <TextInput
        value={query}
        onChangeText={handleQueryChange}
        placeholder="Enter a word or phrase"
        style={[styles.input, { backgroundColor: currentTheme.colors.surface, color: currentTheme.colors.onSurface, borderColor: currentTheme.colors.outline }]}
        placeholderTextColor={currentTheme.colors.outline}
        onSubmitEditing={() => runSearch(query)}
      />

      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map((suggestion) => (
            <TouchableOpacity
              key={suggestion.term_lower}
              onPress={() => {
                setQuery(suggestion.term);
                runSearch(suggestion.term);
              }}
              style={styles.suggestionRow}
            >
              <Text style={{ color: currentTheme.colors.onSurface }}>{suggestion.term}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={currentTheme.colors.primary} />
        </View>
      ) : (
        <>
          <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <MaterialCommunityIcons name="text-box-search-outline" size={24} color={currentTheme.colors.primary} />
                <Text variant="titleLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginLeft: 8 }}>
                  {query || "Word"}
                </Text>
              </View>

              {!definition || definition.source === "bible" ? (
                <Text style={{ color: currentTheme.colors.onSurface, marginTop: 12, lineHeight: 22 }}>
                  {definition?.source === "bible"
                    ? "This is a Bible term; no Easton's entry is available."
                    : "No dictionary result was found for this word. You can still explore Bible references below."}
                </Text>
              ) : definition.source === "eastons" ? (
                definition.entries.map((entry) => (
                  <View key={entry.id} style={styles.meaningBlock}>
                    {definition.entries.length > 1 ? (
                      <Text style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 6 }}>{entry.word}</Text>
                    ) : null}
                    <EastonsDefinition
                      definition={entry.definition}
                      style={{ color: currentTheme.colors.onSurface, lineHeight: 22 }}
                      linkStyle={{ color: currentTheme.colors.primary, textDecorationLine: "underline" }}
                    />
                  </View>
                ))
              ) : (
                <>
                  {definition.phonetics?.[0]?.text ? (
                    <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 8 }}>
                      {definition.phonetics[0].text}
                    </Text>
                  ) : null}

                  {definition.meanings?.slice(0, 2).map((meaning, index) => (
                    <View key={`${meaning.partOfSpeech}-${index}`} style={styles.meaningBlock}>
                      <Text style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 6 }}>
                        {meaning.partOfSpeech}
                      </Text>
                      {meaning.definitions?.slice(0, 3).map((item, i) => (
                        <Text key={`${item.definition}-${i}`} style={{ color: currentTheme.colors.onSurface, lineHeight: 22, marginBottom: 6 }}>
                          {i + 1}. {item.definition}
                          {item.example ? ` — ${item.example}` : ""}
                        </Text>
                      ))}
                    </View>
                  ))}
                </>
              )}
            </Card.Content>
          </Card>

          <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
            <Card.Content>
              <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 10 }}>
                Bible References
              </Text>

              {matches.length === 0 ? (
                <Text style={{ color: currentTheme.colors.onSurface, lineHeight: 22 }}>
                  No verses containing this word were found in the local library.
                </Text>
              ) : (
                matches.map((match, idx) => (
                  <TouchableOpacity
                    key={`${match.book_name}-${match.chapter_number}-${match.verse_number}-${idx}`}
                    onPress={() => navigation.navigate("Reading", {
                      bookTitle: match.book_name,
                      versionCode: match.version_code,
                      chapterIndex: Number(match.chapter_number) - 1,
                    })}
                  >
                    <View style={styles.referenceItem}>
                      <Text style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                        {match.book_name} {match.chapter_number}:{match.verse_number}
                      </Text>
                      <Text style={{ color: currentTheme.colors.onSurface, lineHeight: 22, marginTop: 4 }}>
                        {match.text}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </Card.Content>
          </Card>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 120 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  suggestions: { marginTop: -14, marginBottom: 14, borderWidth: 1, borderColor: "#D7DCE3", borderRadius: 8, overflow: "hidden" },
  suggestionRow: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#E8EBEF" },
  loadingWrap: { alignItems: "center", justifyContent: "center", paddingVertical: 24 },
  card: { borderWidth: 1, borderRadius: 16, marginBottom: 16 },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  meaningBlock: { marginTop: 14 },
  referenceItem: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" },
});

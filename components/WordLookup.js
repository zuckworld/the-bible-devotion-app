import React, { useContext, useEffect, useState } from "react";
import { View, ScrollView, Linking, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Card, Chip, Portal, Text, TextInput } from "react-native-paper";
import { dictionaryAPI } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import { PaperThemeContext } from "./PaperThemeContext";
import EastonsDefinition from "./EastonsDefinition";
import { findBibleReference, getDictionaryEntries, getDictionaryEntry, getStrongEntries, searchVersesByWord } from "../services/localDatabase";

export default function WordLookup({ word, strongs, visible, onDismiss, verse, onSave }) {
  const { currentTheme } = useContext(PaperThemeContext);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [crossrefs, setCrossrefs] = useState([]);
  const [relatedVerses, setRelatedVerses] = useState([]);
  const [externalLinks, setExternalLinks] = useState([]);
  const [source, setSource] = useState("local");
  const [strongEntry, setStrongEntry] = useState(null);
  const [otherSenses, setOtherSenses] = useState([]);
  const [otherDictionaryEntries, setOtherDictionaryEntries] = useState([]);
  const normalized = (word || "").replace(/[^a-zA-Z'-]/g, "").toLowerCase();
  const navigation = useNavigation();

  function parseRef(ref) {
    if (!ref) return null;
    const m = ref.match(/^\s*(.+?)\s+(\d+)(?::(\d+))?\s*$/);
    if (!m) return null;
    const book = m[1].trim();
    const chapter = parseInt(m[2], 10) || 1;
    const verseNum = m[3] ? parseInt(m[3], 10) : null;
    return { book, chapter, verse: verseNum };
  }

  useEffect(() => {
    let active = true;

    async function loadWordStudy() {
      if (!normalized) {
        setEntry(null);
        setCrossrefs([]);
        setRelatedVerses([]);
        setExternalLinks([]);
        setSource("local");
        return;
      }

      setLoading(true);
      setEntry(null);
      setStrongEntry(null);
      setOtherSenses([]);
      setOtherDictionaryEntries([]);
      setCrossrefs([]);
      setRelatedVerses([]);
      setExternalLinks([]);

      try {
        if (strongs) {
          const senses = getStrongEntries(strongs);
          if (!active) return;
          setStrongEntry(senses[0] || null);
          setOtherSenses(senses.slice(1));
          setSource("strongs");
          setLoading(false);
          return;
        }

        const eastonsEntries = getDictionaryEntries(normalized);
        if (eastonsEntries.length > 0) {
          const localEntry = eastonsEntries[0];
          setEntry({
            word: localEntry.word,
            partOfSpeech: "Easton's Dictionary",
            definition: localEntry.definition,
            summary: "",
            source: "local",
          });
          setOtherDictionaryEntries(eastonsEntries.slice(1));
          setRelatedVerses(searchVersesByWord(normalized, "KJV", 5).map((item) => ({
            ref: `${item.book_name} ${item.chapter_number}:${item.verse_number}`,
            text: item.text,
          })));
          setSource("local");
          setLoading(false);
          return;
        }

        const study = await dictionaryAPI.getWordStudy(normalized);
        if (!active || !study) return;

        setEntry({
          word: study.word || normalized,
          partOfSpeech: study.partOfSpeech || "noun",
          definition: study.definition || "Definition not available.",
          summary: study.summary || "Study notes unavailable.",
          source: study.source || "local",
        });

        setCrossrefs(study.crossrefs || []);
        setRelatedVerses(study.relatedVerses || []);
        setExternalLinks(study.externalLinks || []);
        setSource(study.source || "local");
      } catch (error) {
        const localEntry = getDictionaryEntry(normalized);
        if (localEntry && active) {
          setEntry({
            word: localEntry.word,
            partOfSpeech: localEntry.partOfSpeech,
            summary: localEntry.summary,
            definition: localEntry.definition,
            source: "local",
          });
          setSource("local");
        } else if (active) {
          setEntry(null);
          setSource("none");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadWordStudy();

    return () => {
      active = false;
    };
  }, [normalized, strongs]);

  if (!visible) return null;

  return (
    <Portal>
      <View style={styles.backdrop} />
      <Card style={[styles.panel, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}>
        <Card.Content>
          <View style={styles.headRow}>
            <View>
              <Text variant="labelLarge" style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>
                Word Study
              </Text>
              <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: "800", marginTop: 2 }}>
                {word || "Lookup"}
              </Text>
            </View>
            <Chip mode="outlined" style={[styles.chip, { borderColor: currentTheme.colors.primary }]} textStyle={{ color: currentTheme.colors.primary }}>
              {source === "strongs" ? "Strong's" : source === "local" ? "Easton's" : source === "remote" ? "Reference" : "Study"}
            </Chip>
          </View>

          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={currentTheme.colors.primary} />
            </View>
          ) : strongEntry ? (
            <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollInner} showsVerticalScrollIndicator={false}>
              <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, fontWeight: "700" }}>
                {strongEntry.strongs_id}
              </Text>
              <Text style={{ color: currentTheme.colors.onSurface, fontSize: 18, fontWeight: "700", marginTop: 10 }}>
                {strongEntry.original || ""}
              </Text>
              <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 4 }}>
                {strongEntry.translit || ""}
              </Text>
              {strongEntry.gloss ? <Text style={{ color: currentTheme.colors.primary, marginTop: 10 }}>{strongEntry.gloss}</Text> : null}
              <Text style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginTop: 10 }}>
                {strongEntry.meaning || "Meaning unavailable."}
              </Text>
              {otherSenses.length > 0 ? (
                <View style={{ marginTop: 16 }}>
                  <Text style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 8 }}>Other senses</Text>
                  {otherSenses.map((sense) => (
                    <View key={sense.id} style={{ marginBottom: 12 }}>
                      <Text style={{ color: currentTheme.colors.onSurface, fontWeight: "700" }}>{sense.gloss || sense.original || sense.strongs_id}</Text>
                      <Text style={{ color: currentTheme.colors.onSurface, lineHeight: 22, marginTop: 4 }}>{sense.meaning || ""}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </ScrollView>
          ) : entry ? (
            <ScrollView style={styles.contentScroll} contentContainerStyle={styles.contentScrollInner} showsVerticalScrollIndicator={false}>
              <View style={styles.metaRow}>
                <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, fontWeight: "700" }}>
                  {entry.partOfSpeech || "noun"}
                </Text>
              </View>

              {entry.source === "local" ? (
                <EastonsDefinition
                  definition={entry.definition}
                  style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginTop: 12 }}
                  linkStyle={{ color: currentTheme.colors.primary, textDecorationLine: "underline" }}
                />
              ) : (
                <Text style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginTop: 12 }}>
                  {entry.definition || "Definition unavailable."}
                </Text>
              )}

              {otherDictionaryEntries.map((otherEntry) => (
                <View key={otherEntry.id} style={{ marginTop: 14 }}>
                  <Text style={{ color: currentTheme.colors.primary, fontWeight: "700" }}>{otherEntry.word}</Text>
                  <EastonsDefinition
                    definition={otherEntry.definition}
                    style={{ color: currentTheme.colors.onSurface, fontSize: 15, lineHeight: 22, marginTop: 6 }}
                    linkStyle={{ color: currentTheme.colors.primary, textDecorationLine: "underline" }}
                  />
                </View>
              ))}

              {entry.summary ? (
                <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline, marginTop: 10, lineHeight: 22 }}>
                  {entry.summary}
                </Text>
              ) : null}
            </ScrollView>
          ) : (
            <Text style={{ color: currentTheme.colors.onSurface, marginTop: 14, lineHeight: 22 }}>
              No definition was found locally or online. You can still search the web or explore related references below.
            </Text>
          )}
        </Card.Content>

        <Card.Content>
          <Text variant="titleSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 8 }}>
            Related verses
          </Text>

          {relatedVerses.length === 0 ? (
            <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline }}>
              No verse hits were found for this term in the local Bible data.
            </Text>
          ) : (
            relatedVerses.map((item, index) => (
              <Text
                key={`${item.ref || "verse"}-${index}`}
                style={{ color: currentTheme.colors.onSurface, marginTop: 6, lineHeight: 22 }}
                onPress={() => {
                  const parsed = parseRef(item.ref);
                  if (!parsed) {
                    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.ref)}`);
                    return;
                  }

                  const ref = findBibleReference(item.ref, "KJV");
                  if (ref) {
                    navigation.navigate("Reading", {
                      bookTitle: ref.bookTitle,
                      versionCode: ref.versionCode,
                      chapterIndex: ref.chapterIndex,
                    });
                    return;
                  }

                  Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.ref)}`);
                }}
              >
                • {item.ref} — {item.text}
              </Text>
            ))
          )}
        </Card.Content>

        <Card.Content>
          <Text variant="titleSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 8 }}>
            Notes
          </Text>
          <TextInput
            value={noteText}
            onChangeText={setNoteText}
            placeholder="Add a note for this verse"
            multiline
            mode="outlined"
            style={styles.noteInput}
            placeholderTextColor={currentTheme.colors.outline}
            textColor={currentTheme.colors.onSurface}
          />
        </Card.Content>

        <Card.Content>
          <Text variant="titleSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 8 }}>
            Cross references
          </Text>

          {crossrefs.length === 0 ? (
            <Text style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline }}>
              No related references were found for this term.
            </Text>
          ) : (
            crossrefs.map((item, index) => (
              <Text
                key={`${item.ref || "ref"}-${index}`}
                style={{ color: currentTheme.colors.onSurface, marginTop: 6, lineHeight: 22 }}
                onPress={() => {
                  const parsed = parseRef(item.ref);
                  if (!parsed) {
                    Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.ref)}`);
                    return;
                  }

                  const ref = findBibleReference(item.ref, "KJV");
                  if (ref) {
                    navigation.navigate("Reading", {
                      bookTitle: ref.bookTitle,
                      versionCode: ref.versionCode,
                      chapterIndex: ref.chapterIndex,
                    });
                    return;
                  }

                  Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(item.ref)}`);
                }}
              >
                • {item.ref} — {item.reason}
              </Text>
            ))
          )}
        </Card.Content>

        {externalLinks.length > 0 && (
          <Card.Content>
            <Text variant="titleSmall" style={{ color: currentTheme.colors.primary, fontWeight: "700", marginBottom: 8 }}>
              Study tools
            </Text>
            <View style={styles.linkRow}>
              {externalLinks.map((link) => (
                <Button
                  key={link.label}
                  mode="outlined"
                  compact
                  onPress={() => Linking.openURL(link.url)}
                  textColor={currentTheme.colors.primary}
                  style={styles.linkButton}
                >
                  {link.label}
                </Button>
              ))}
            </View>
          </Card.Content>
        )}

        <Card.Actions style={styles.actions}>
          <Button mode="text" onPress={() => onDismiss && onDismiss()} textColor={currentTheme.colors.primary}>
            Close
          </Button>
          <Button mode="text" onPress={() => Linking.openURL(`https://www.google.com/search?q=define+${encodeURIComponent(normalized)}`)} textColor={currentTheme.colors.primary}>
            Search web
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              if (onSave && verse) onSave(verse, noteText || `Note on ${normalized}`);
              if (onDismiss) onDismiss();
            }}
            buttonColor={currentTheme.colors.primary}
            textColor="#FFFFFF"
          >
            Save note
          </Button>
        </Card.Actions>
      </Card>
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  panel: {
    position: "absolute",
    left: 16,
    right: 16,
    top: 90,
    bottom: 120,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
  },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  chip: {
    backgroundColor: "transparent",
    marginTop: 8,
  },
  loadingWrap: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    maxHeight: 220,
  },
  contentScrollInner: {
    paddingBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  noteInput: {
    backgroundColor: "transparent",
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  linkButton: {
    marginRight: 8,
    marginBottom: 8,
  },
  actions: {
    justifyContent: "flex-end",
    paddingTop: 0,
  },
});

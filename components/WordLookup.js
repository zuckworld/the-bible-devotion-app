import React, { useEffect, useState } from "react";
import { View, ScrollView, Linking } from "react-native";
import { ActivityIndicator, Button, Card, Paragraph, Portal, Text, Title, TextInput } from "react-native-paper";
import axios from "axios";
import { dictionaryAPI } from "../services/api";
import { useNavigation } from "@react-navigation/native";
import kjv from "../assets/bible/kjv.json";


export default function WordLookup({ word, visible, onDismiss, verse, onSave }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [crossrefs, setCrossrefs] = useState([]);
  const normalized = (word || "").replace(/[^a-zA-Z'-]/g, "").toLowerCase();
  const navigation = useNavigation();

  function parseRef(ref) {
    // Improved parser: captures a book name (may include numeric prefix and multi-word names)
    // Expected formats: "John 3:16", "1 John 3:16", "Song of Solomon 2:1" or just "John 3"
    if (!ref) return null;
    const m = ref.match(/^\s*(.+?)\s+(\d+)(?::(\d+))?\s*$/);
    if (!m) return null;
    const book = m[1].trim();
    const chapter = parseInt(m[2], 10) || 1;
    const verseNum = m[3] ? parseInt(m[3], 10) : null;
    return { book, chapter, verse: verseNum };
  }

  function findLocalBook(bookName) {
    if (!bookName) return null;
    const normalize = (s) => (s || '').toLowerCase().replace(/["'.:,]/g, '').replace(/\s+/g, ' ').trim();
    const wanted = normalize(bookName.replace(/^1st|1|2nd|2|3rd|3\s+/i, (x) => x));

    // Try exact match, startsWith, abbrev, and fuzzy includes
    let found = kjv.find((bk) => normalize(bk.name) === normalize(bookName));
    if (found) return found;
    found = kjv.find((bk) => normalize(bk.name).startsWith(normalize(bookName)) || normalize(bookName).startsWith(normalize(bk.name)));
    if (found) return found;
    found = kjv.find((bk) => bk.abbrev && normalize(bk.abbrev) === normalize(bookName));
    if (found) return found;
    // fallback: include match
    found = kjv.find((bk) => normalize(bk.name).includes(normalize(bookName)) || normalize(bookName).includes(normalize(bk.name)));
    return found || null;
  }

  useEffect(() => {
    let active = true;
    async function fetchDef() {
      if (!normalized) return;
      setLoading(true);
      setData(null);
      try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalized)}`);
        if (!active) return;
        setData(res.data && res.data[0]);
      } catch (err) {
        if (!active) return;
        setData(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    async function fetchCrossrefs() {
      try {
        const refs = await dictionaryAPI.getCrossReferences(normalized);
        if (active) setCrossrefs(refs || []);
      } catch (e) {
        if (active) setCrossrefs([]);
      }
    }

    fetchDef();
    fetchCrossrefs();
    return () => {
      active = false;
    };
  }, [normalized]);

  if (!visible) return null;

  return (
    <Portal>
      <Card style={{ margin: 16, borderRadius: 12 }}>
        <Card.Content>
          <Title>{word || "Lookup"}</Title>
          {loading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator />
            </View>
          ) : data ? (
            <ScrollView style={{ maxHeight: 300 }}>
              <Paragraph style={{ marginBottom: 8 }}>{data.word}</Paragraph>
              {data.phonetics?.[0]?.text ? <Paragraph style={{ marginBottom: 6 }}>{data.phonetics[0].text}</Paragraph> : null}
              {data.meanings?.map((m, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text style={{ fontWeight: "700" }}>{m.partOfSpeech}</Text>
                  {m.definitions?.map((d, i) => (
                    <Paragraph key={i} style={{ marginTop: 4 }}>{d.definition}{d.example ? ` — ${d.example}` : ""}</Paragraph>
                  ))}
                </View>
              ))}
            </ScrollView>
          ) : (
            <Paragraph style={{ marginVertical: 8 }}>No definition found locally. Try web lookup.</Paragraph>
          )}
        </Card.Content>
        <Card.Content>
          <Text variant="titleSmall" style={{ marginTop: 8 }}>Notes</Text>
          <TextInput value={noteText} onChangeText={setNoteText} placeholder="Add a note for this verse" multiline mode="outlined" style={{ marginTop: 8 }} />
        </Card.Content>
        <Card.Actions>
          <Button onPress={() => onDismiss && onDismiss()}>Close</Button>
          <Button onPress={() => Linking.openURL(`https://www.google.com/search?q=define+${encodeURIComponent(normalized)}`)}>Search web</Button>
          <Button
            onPress={() => {
              if (onSave && verse) onSave(verse, noteText || `Note on ${normalized}`);
              if (onDismiss) onDismiss();
            }}
          >
            Save Note
          </Button>
        </Card.Actions>
          {crossrefs?.length ? (
          <Card.Content>
            <Text variant="titleSmall" style={{ marginTop: 6 }}>Cross references</Text>
            {crossrefs.map((c, i) => (
              <Paragraph key={i} style={{ marginTop: 6 }} onPress={() => {
                const parsed = parseRef(c.ref);
                const local = findLocalBook(parsed?.book);
                if (local) {
                  navigation.navigate('Reading', { bookItem: local, bookTitle: local.name, chapterIndex: Math.max(0, (parsed.chapter || 1) - 1) });
                } else {
                  // fallback: open web search for the ref
                  Linking.openURL(`https://www.google.com/search?q=${encodeURIComponent(c.ref)}`);
                }
              }}>{c.ref} — {c.reason}</Paragraph>
            ))}
          </Card.Content>
        ) : null}
      </Card>
    </Portal>
  );
}

// screens/ReadingScreen.js
import React, { useEffect, useMemo, useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../components/ThemeContext";
import { useAppState } from "../contexts/AppContext";
import { cleanText } from "../utils/textCleanup";
import WordLookup from "../components/WordLookup";

export default function ReadingScreen({ route, navigation }) {
  const { darkMode, setDarkMode, theme } = useContext(ThemeContext);
  const { bookItem, bookTitle } = route.params || {};
  const chapters = (bookItem && bookItem.chapters) || [];

  const [chapterIndex, setChapterIndex] = useState(
    route.params?.chapterIndex != null ? route.params.chapterIndex : 0
  );
  const [lookupWord, setLookupWord] = useState(null);
  const [lookupVisible, setLookupVisible] = useState(false);
  const [lookupTarget, setLookupTarget] = useState(null);
  const { saveBibleNote } = useAppState();

  useEffect(() => {
    if (!bookItem) navigation.goBack();
  }, [bookItem]);

  const currentVerses = useMemo(() => chapters[chapterIndex] || [], [chapters, chapterIndex]);

  const renderVerse = ({ item, index }) => {
    const cleaned = cleanText(item, { stripBibleNotes: true }) || "";
    const tokens = cleaned.split(/(\s+)/);

    return (
      <View style={styles.verseRow}>
        <Text style={styles.verseNum}>{index + 1}</Text>
        <View style={[styles.verseText, { color: theme.text, flexWrap: 'wrap', flexDirection: 'row' }]}>          
          {tokens.map((t, i) => {
            if (/^\s+$/.test(t)) return <Text key={`s-${i}`}>{t}</Text>;
            const display = t;
            return (
              <TouchableOpacity key={`w-${i}`} onPress={() => { setLookupWord(display); setLookupTarget({ book: bookTitle, chapter: chapterIndex + 1, verse: index + 1, key: `${bookTitle}:${chapterIndex+1}:${index+1}` }); setLookupVisible(true); }}>
                <Text style={{ color: theme.text, fontSize: 16, lineHeight: 22 }}>{display}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color="#4A90E2" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {bookTitle} — Chapter {chapterIndex + 1}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Chapter chooser */}
      <View style={styles.chaptersRow}>
        <FlatList
          data={chapters}
          horizontal
          keyExtractor={(_, i) => `ch-${i}`}
          renderItem={({ index }) => (
            <TouchableOpacity
              onPress={() => setChapterIndex(index)}
              style={[
                styles.chapterButton,
                chapterIndex === index && styles.chapterButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.chapterButtonText,
                  { color: theme.text },
                  chapterIndex === index && styles.chapterButtonTextActive,
                ]}
              >
                {index + 1}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </View>

      {/* Scrollable verses */}
      <FlatList
        data={currentVerses}
        keyExtractor={(_, i) => `v-${i}`}
        renderItem={renderVerse}
        contentContainerStyle={styles.versesContainer}
        showsVerticalScrollIndicator
        style={{ flex: 1 }}
      />

          <WordLookup
            word={lookupWord}
            visible={lookupVisible}
            verse={lookupTarget}
            onDismiss={() => setLookupVisible(false)}
            onSave={(verse, note) => {
              if (verse) saveBibleNote({ ...verse, note });
            }}
          />

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          onPress={() => setChapterIndex((s) => Math.max(0, s - 1))}
          disabled={chapterIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={28}
            color={chapterIndex === 0 ? '#ccc' : '#4A90E2'}
          />
        </TouchableOpacity>

        <Text style={[styles.chapterLabel, { color: theme.text }]}>Chapter {chapterIndex + 1}</Text>

        <TouchableOpacity
          onPress={() => setChapterIndex((s) => Math.min(chapters.length - 1, s + 1))}
          disabled={chapterIndex >= chapters.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={28}
            color={chapterIndex >= chapters.length - 1 ? '#ccc' : '#4A90E2'}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: { fontWeight: '700', fontSize: 16, color: '#222' },
  chaptersRow: {
    paddingVertical: 10,
  },
  chapterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  chapterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  chapterButtonText: { color: '#333', fontWeight: '600' },
  chapterButtonTextActive: { color: '#fff' },
  versesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120, // prevent bottom nav overlap
    paddingTop: 10,
  },
  verseRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  verseNum: { width: 30, color: '#4A90E2', fontWeight: '700' },
  verseText: { flex: 1, color: '#222', lineHeight: 22, fontSize: 16 },
  bottomNav: {
    position: 'absolute', // ✅ fixed changed to absolute
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chapterLabel: { fontWeight: '700', color: '#333' },
});

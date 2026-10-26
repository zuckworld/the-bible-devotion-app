import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PaperThemeContext } from "../components/PaperThemeContext";
import { useAppState } from "../contexts/AppContext";
import WordLookup from "../components/WordLookup";
import { getBookChapters, getChapterVerses } from "../services/localDatabase";

export default function ReadingScreen({ route, navigation }) {
  const { currentTheme, isDarkMode } = useContext(PaperThemeContext);
  const { bookItem, bookTitle, versionCode = 'KJV' } = route.params || {};
  const [chapters, setChapters] = useState([]);
  const [chapterIndex, setChapterIndex] = useState(route.params?.chapterIndex ?? 0);
  const [currentVerses, setCurrentVerses] = useState([]);
  const [lookupWord, setLookupWord] = useState(null);
  const [lookupStrongs, setLookupStrongs] = useState(null);
  const [lookupVisible, setLookupVisible] = useState(false);
  const [lookupTarget, setLookupTarget] = useState(null);
  const { saveBibleNote } = useAppState();

  useEffect(() => {
    if (!bookTitle) {
      navigation.goBack();
      return;
    }

    const nextChapters = getBookChapters(versionCode, bookTitle);
    setChapters(nextChapters);
    const requestedIndex = route.params?.chapterIndex ?? 0;
    setChapterIndex(Math.max(0, Math.min(requestedIndex, nextChapters.length - 1)));
  }, [bookTitle, versionCode, navigation, route.params?.chapterIndex]);

  useEffect(() => {
    const chapter = chapters[chapterIndex];
    if (!bookTitle || !chapter) {
      setCurrentVerses([]);
      return;
    }
    setCurrentVerses(getChapterVerses(versionCode, bookTitle, chapter.chapter));
  }, [bookTitle, versionCode, chapters, chapterIndex]);

  const renderVerse = ({ item, index }) => {
    const words = Array.isArray(item?.words) ? item.words : [{ text: item?.text || "", strongs: null }];

    return (
      <View style={styles.verseRow}>
        <Text style={[styles.verseNum, { color: currentTheme.colors.primary }]}>{item?.verse ?? index + 1}</Text>
        <View style={[styles.verseText, { color: currentTheme.colors.onBackground, flexWrap: 'wrap', flexDirection: 'row' }]}>
          {words.map((piece, i) => {
            if (!piece.strongs) {
              return <Text key={`p-${i}`} style={{ color: currentTheme.colors.onBackground, fontSize: 16, lineHeight: 24 }}>{piece.text}</Text>;
            }
            return (
              <TouchableOpacity
                key={`w-${i}`}
                onPress={() => {
                  setLookupWord(piece.text);
                  setLookupStrongs(piece.strongs);
                  setLookupTarget({
                    book: bookTitle,
                    chapter: chapterIndex + 1,
                    verse: item?.verse ?? index + 1,
                    key: `${bookTitle}:${chapterIndex + 1}:${item?.verse ?? index + 1}`,
                  });
                  setLookupVisible(true);
                }}
              >
                <Text style={{ color: currentTheme.colors.onBackground, fontSize: 16, lineHeight: 24 }}>{piece.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const safeColor = isDarkMode ? '#F5F7FA' : '#111827';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.colors.background, borderBottomColor: currentTheme.colors.outline }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={currentTheme.colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: safeColor }]}>
          {bookTitle} · Chapter {chapterIndex + 1}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.chaptersRow}>
        <FlatList
          data={chapters}
          horizontal
          keyExtractor={(item, i) => `ch-${item.chapter || i}`}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onPress={() => setChapterIndex(index)}
              style={[styles.chapterButton, chapterIndex === index && { backgroundColor: currentTheme.colors.primary }]}
            >
              <Text style={[styles.chapterButtonText, { color: chapterIndex === index ? '#FFFFFF' : safeColor }]}>
                {item.chapter}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        />
      </View>

      <FlatList
        data={currentVerses}
        keyExtractor={(item, i) => `v-${item.verse ?? i}`}
        renderItem={renderVerse}
        contentContainerStyle={styles.versesContainer}
        showsVerticalScrollIndicator
        style={{ flex: 1 }}
      />

      <WordLookup
        word={lookupWord}
        strongs={lookupStrongs}
        visible={lookupVisible}
        verse={lookupTarget}
        onDismiss={() => setLookupVisible(false)}
        onSave={(verse, note) => {
          if (verse) saveBibleNote({ ...verse, note });
        }}
      />

      <View style={[styles.bottomNav, { backgroundColor: currentTheme.colors.surface, borderTopColor: currentTheme.colors.outline }]}>
        <TouchableOpacity onPress={() => setChapterIndex((s) => Math.max(0, s - 1))} disabled={chapterIndex === 0}>
          <Ionicons name="chevron-back" size={28} color={chapterIndex === 0 ? currentTheme.colors.outline : currentTheme.colors.primary} />
        </TouchableOpacity>

        <Text style={[styles.chapterLabel, { color: safeColor }]}>Chapter {chapterIndex + 1}</Text>

        <TouchableOpacity onPress={() => setChapterIndex((s) => Math.min(chapters.length - 1, s + 1))} disabled={chapterIndex >= chapters.length - 1}>
          <Ionicons name="chevron-forward" size={28} color={chapterIndex >= chapters.length - 1 ? currentTheme.colors.outline : currentTheme.colors.primary} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontWeight: '700', fontSize: 16 },
  chaptersRow: { paddingVertical: 10 },
  chapterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#D5D9E2',
    backgroundColor: '#F8FAFC',
  },
  chapterButtonText: { fontWeight: '600' },
  versesContainer: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 10 },
  verseRow: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' },
  verseNum: { width: 30, fontWeight: '700' },
  verseText: { flex: 1, lineHeight: 24, fontSize: 16 },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chapterLabel: { fontWeight: '700' },
});

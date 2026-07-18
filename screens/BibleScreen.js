import React, { useMemo, useState, useContext } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Snackbar, ActivityIndicator, Searchbar } from 'react-native-paper';
import { PaperThemeContext } from "../components/PaperThemeContext";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import kjv from '../assets/bible/kjv.json';

export default function BibleScreen() {
  const navigation = useNavigation();
  const { currentTheme } = useContext(PaperThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const books = useMemo(() => {
    if (Array.isArray(kjv)) return kjv;
    if (typeof kjv === 'object') {
      return Object.keys(kjv).map((k) => ({
        name: k,
        chapters: kjv[k].chapters || kjv[k],
        abbrev: kjv[k].abbrev || k.slice(0,3).toLowerCase(),
      }));
    }
    return [];
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter(book =>
      book.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [books, searchQuery]);

  const renderItem = ({ item }) => {
    const title = item.name || (item.title ? item.title : (item.abbrev || 'Unknown').toUpperCase());
    const chaptersCount = (item.chapters && item.chapters.length) || 0;

    return (
      <Card
        style={[styles.bookCard, { backgroundColor: currentTheme.colors.surface }]}
        onPress={() =>
          navigation.navigate('Reading', {
            bookTitle: title,
            bookItem: item,
          })
        }
      >
        <Card.Content style={styles.bookCardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyLarge" style={{ color: currentTheme.colors.onSurface, fontWeight: '600', marginBottom: 4 }}>
                {title}
              </Text>
              <Text variant="bodySmall" style={{ color: currentTheme.colors.outline }}>
                {chaptersCount} chapters
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={currentTheme.colors.primary} />
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.onBackground, fontWeight: '700', marginBottom: 12 }}>
          📖 Holy Bible (KJV)
        </Text>
        <Searchbar
          placeholder="Search books..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={{ backgroundColor: currentTheme.colors.surface }}
          inputStyle={{ color: currentTheme.colors.onSurface }}
        />
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item, idx) => (item.abbrev ? item.abbrev : `${item.name}-${idx}`)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 }}
        scrollEnabled={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  bookCard: {
    borderRadius: 12,
    marginBottom: 8,
  },
  bookCardContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

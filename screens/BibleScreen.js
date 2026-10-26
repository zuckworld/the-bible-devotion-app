import React, { useMemo, useState, useContext, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, Text, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperThemeContext } from "../components/PaperThemeContext";
import { getBibleBooks } from "../services/localDatabase";

export default function BibleScreen() {
  const navigation = useNavigation();
  const { currentTheme } = useContext(PaperThemeContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [books, setBooks] = useState([]);

  useEffect(() => {
    setBooks(getBibleBooks());
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery) return books;
    return books.filter((book) => book.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [books, searchQuery]);

  const renderItem = ({ item }) => {
    const title = item.name || 'Unknown';
    const chaptersCount = Number(item.chapterCount || 0);

    return (
      <Card
        style={[styles.bookCard, { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.outline }]}
        onPress={() => navigation.navigate('Reading', { bookTitle: title, bookItem: item, versionCode: "KJV" })}
      >
        <Card.Content style={styles.bookCardContent}>
          <View style={styles.bookRow}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: '700', marginBottom: 4 }}>
                {title}
              </Text>
              <Text variant="bodySmall" style={{ color: currentTheme.colors.onSurfaceVariant || currentTheme.colors.outline }}>
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
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.primary, fontWeight: '800', marginBottom: 10 }}>
          Bible · KJV
        </Text>
        <Searchbar
          placeholder="Search books..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: currentTheme.colors.surface }]}
          inputStyle={{ color: currentTheme.colors.onSurface }}
          iconColor={currentTheme.colors.primary}
        />
      </View>

      <FlatList
        data={filteredBooks}
        keyExtractor={(item, idx) => `${item.name}-KJV-${idx}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  searchbar: { borderRadius: 14, borderWidth: 1 },
  listContent: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 12 },
  bookCard: {
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  bookCardContent: { paddingVertical: 12, paddingHorizontal: 16 },
  bookRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});

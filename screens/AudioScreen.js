import React, { useContext, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperThemeContext } from '../components/PaperThemeContext';

export default function AudioScreen() {
  const { currentTheme } = useContext(PaperThemeContext);
  const [message, setMessage] = useState('');

  const audioChannels = [
    { id: 1, title: 'Daily Devotional Podcast', icon: 'podcast', color: currentTheme.colors.primary },
    { id: 2, title: 'Prayer & Meditation', icon: 'heart-outline', color: currentTheme.colors.secondary },
    { id: 3, title: 'Scripture Reading', icon: 'book-open-outline', color: currentTheme.colors.tertiary },
    { id: 4, title: 'Worship & Music', icon: 'music-circle-outline', color: currentTheme.colors.primary },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.onBackground, fontWeight: '700' }}>
          Audio & Podcasts
        </Text>
        <Text variant="bodySmall" style={{ color: currentTheme.colors.outline, marginTop: 4 }}>
          Listen to daily devotions and spiritual content
        </Text>
      </View>

      {/* Audio Channels */}
      {audioChannels.map((channel, index) => (
        <Card
          key={channel.id}
          style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}
        >
          <Card.Content style={styles.cardContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: channel.color + '20' },
                ]}
              >
                <MaterialCommunityIcons name={channel.icon} size={28} color={channel.color} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text variant="bodyLarge" style={{ color: currentTheme.colors.onSurface, fontWeight: '600' }}>
                  {channel.title}
                </Text>
                <Text variant="labelSmall" style={{ color: currentTheme.colors.outline, marginTop: 4 }}>
                  Tap to play
                </Text>
              </View>
              <Button icon="play-circle" onPress={() => setMessage(`${channel.title} is ready to play.`)} compact />
            </View>
          </Card.Content>
        </Card>
      ))}

      {/* Prayer Request Section */}
      <Card style={[styles.card, { backgroundColor: currentTheme.colors.primaryContainer }]}>
        <Card.Content style={styles.cardContent}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <MaterialCommunityIcons
              name="hands-pray"
              size={28}
              color={currentTheme.colors.primary}
              style={{ marginRight: 12 }}
            />
            <Text variant="titleMedium" style={{ color: currentTheme.colors.primary, fontWeight: '700' }}>
              Need Prayer?
            </Text>
          </View>
          <Divider style={{ marginBottom: 12 }} />
          <Text variant="bodySmall" style={{ color: currentTheme.colors.onPrimaryContainer, lineHeight: 20, marginBottom: 12 }}>
            Share your prayer requests and let our community pray for you.
          </Text>
          <Button mode="contained" onPress={() => setMessage('Prayer request flow opened.')} style={{ backgroundColor: currentTheme.colors.primary }}>
            Submit Prayer Request
          </Button>
        </Card.Content>
      </Card>

      <View style={{ height: 80 }} />
      <Snackbar visible={!!message} onDismiss={() => setMessage('')}>{message}</Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  card: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12 },
  cardContent: { paddingVertical: 16, paddingHorizontal: 16 },
  iconContainer: { width: 56, height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
});

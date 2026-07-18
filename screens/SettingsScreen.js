import React, { useContext, useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Linking, Platform, Alert, Share } from 'react-native';
import { Card, Text, Switch, Button, Divider, List, Snackbar, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PaperThemeContext } from '../components/PaperThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useAppState } from '../contexts/AppContext';
import { appAPI } from '../services/api';

export default function SettingsScreen() {
  const { currentTheme, isDarkMode, setIsDarkMode } = useContext(PaperThemeContext);
  const navigation = useNavigation();
  const { profileState, updateProfile, bibleState, updateBiblePreferences, logout } = useAppState();
  const [notificationsEnabled, setNotificationsEnabled] = useState(profileState.notificationPrefs?.morningDevotional ?? true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [message, setMessage] = useState('');
  const [displayName, setDisplayName] = useState(profileState.displayName || '');
  const [language, setLanguage] = useState(profileState.language || 'en');
  const [fontScale, setFontScale] = useState(bibleState.fontScale || 1);
  const [versionInfo, setVersionInfo] = useState(null);

  useEffect(() => {
    let mounted = true;
    appAPI.getVersion().then((v) => { if (mounted) setVersionInfo(v); }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: currentTheme.colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text variant="headlineSmall" style={{ color: currentTheme.colors.onBackground, fontWeight: '700' }}>
          Settings
        </Text>
      </View>

      {/* Display Settings */}
      <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: currentTheme.colors.onSurface, fontWeight: '700', marginBottom: 12 }}>
            Profile & Display
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <View style={styles.settingRow}>
            <TextInput label="Display name" value={displayName} onChangeText={setDisplayName} mode="outlined" style={{ flex: 1, marginRight: 12 }} />
            <Switch value={isDarkMode} onValueChange={setIsDarkMode} />
          </View>
          <View style={[styles.settingRow, { marginTop: 12 }]}> 
            <View style={{ flex: 1 }}>
              <Text variant="bodyMedium" style={{ color: currentTheme.colors.onSurface }}>Language</Text>
              <Text variant="labelSmall" style={{ color: currentTheme.colors.outline }}>{language.toUpperCase()}</Text>
            </View>
            <Button mode="outlined" onPress={() => setLanguage((l) => l === 'en' ? 'es' : l === 'es' ? 'fr' : 'en')}>Switch</Button>
          </View>
          <View style={[styles.settingRow, { marginTop: 12 }]}> 
            <Text variant="bodyMedium" style={{ color: currentTheme.colors.onSurface }}>Text size</Text>
            <View style={{ flexDirection: 'row' }}>
              <Button mode="outlined" onPress={() => { const next = Math.max(0.85, fontScale - 0.1); setFontScale(next); updateBiblePreferences({ fontScale: next }); }}>A-</Button>
              <Button mode="outlined" onPress={() => { setFontScale(1); updateBiblePreferences({ fontScale: 1 }); }} style={{ marginHorizontal: 8 }}>Default</Button>
              <Button mode="outlined" onPress={() => { const next = Math.min(1.35, fontScale + 0.1); setFontScale(next); updateBiblePreferences({ fontScale: next }); }}>A+</Button>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: currentTheme.colors.onSurface, fontWeight: '700', marginBottom: 12 }}>
            Notifications
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <View style={styles.settingRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={currentTheme.colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text variant="bodyMedium" style={{ color: currentTheme.colors.onSurface }}>
                Daily Devotional
              </Text>
            </View>
            <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          </View>
          <View style={[styles.settingRow, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <MaterialCommunityIcons
                name="volume-high"
                size={24}
                color={currentTheme.colors.primary}
                style={{ marginRight: 12 }}
              />
              <Text variant="bodyMedium" style={{ color: currentTheme.colors.onSurface }}>
                Sound Effects
              </Text>
            </View>
            <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
          </View>
        </Card.Content>
      </Card>

      {/* About & Support */}
      <Card style={[styles.card, { backgroundColor: currentTheme.colors.surface }]}>
        <Card.Content>
          <Text variant="titleMedium" style={{ color: currentTheme.colors.onSurface, fontWeight: '700', marginBottom: 12 }}>
            About & Support
          </Text>
          <Divider style={{ marginBottom: 12 }} />
          <List.Item
            title="App Version"
            description={versionInfo?.version || '1.0.0'}
            left={props => <MaterialCommunityIcons name="information" size={24} color={currentTheme.colors.primary} />}
            titleStyle={{ color: currentTheme.colors.onSurface }}
            descriptionStyle={{ color: currentTheme.colors.outline }}
            onPress={async () => {
              try {
                const info = await appAPI.getVersion();
                setVersionInfo(info);
                Alert.alert('Version', info?.version || 'Unknown');
              } catch (e) { Alert.alert('Error', 'Unable to check version'); }
            }}
          />
          <List.Item
            title="Help & Feedback"
            left={props => <MaterialCommunityIcons name="help-circle-outline" size={24} color={currentTheme.colors.primary} />}
            onPress={() => navigation.navigate('Connect')}
            titleStyle={{ color: currentTheme.colors.onSurface }}
          />
          <List.Item
            title="Privacy Policy"
            left={props => <MaterialCommunityIcons name="shield-account" size={24} color={currentTheme.colors.primary} />}
            onPress={() => Linking.openURL('https://hearttoheartministry.com/privacy').catch(()=>setMessage('Unable to open link'))}
            titleStyle={{ color: currentTheme.colors.onSurface }}
          />
          <List.Item
            title="Connect With Us"
            left={props => <MaterialCommunityIcons name="account-group-outline" size={24} color={currentTheme.colors.primary} />}
            onPress={() => navigation.navigate('Connect')}
            titleStyle={{ color: currentTheme.colors.onSurface }}
          />
        </Card.Content>
      </Card>

      {/* Logout */}
      <View style={{ paddingHorizontal: 16, marginVertical: 16 }}>
        <Button
          mode="outlined"
          onPress={() => { logout(); setMessage('You have been logged out.'); }}
          icon="logout"
          style={{ borderColor: currentTheme.colors.error }}
          textColor={currentTheme.colors.error}
        >
          Logout
        </Button>
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <Button mode="contained" onPress={() => {
          updateProfile({ displayName, language, notificationPrefs: { ...profileState.notificationPrefs, morningDevotional: notificationsEnabled } });
          setMessage('Preferences saved.');
        }}>Save Preferences</Button>
        <Button mode="text" onPress={async () => {
          const url = Platform.OS === 'android' ? 'https://play.google.com/store/apps/details?id=com.hearttoheart.app' : 'https://apps.apple.com/app/id000000000';
          try { await Share.share({ message: `Check out Heart to Heart: ${url}` }); } catch (e) { setMessage('Unable to share'); }
        }}>Share App</Button>
      </View>

      <View style={{ height: 80 }} />
      <Snackbar visible={!!message} onDismiss={() => setMessage('')}>{message}</Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16 },
  card: { marginHorizontal: 16, marginVertical: 8, borderRadius: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
});

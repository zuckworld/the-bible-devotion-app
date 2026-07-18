import React, { useState } from 'react';
import { View, Linking, StyleSheet } from 'react-native';
import { Card, Text, Button, Divider, Snackbar, TextInput } from 'react-native-paper';
import { Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { contactAPI } from '../services/api';
import { supportAPI } from '../services/api';
import * as Device from 'expo-device';

export default function ConnectWithUs() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('General inquiry');
  const [snackbar, setSnackbar] = useState('');
  const [loading, setLoading] = useState(false);

  const openMail = () => Linking.openURL('mailto:support@hearttoheartministry.com?subject=App%20Support');
  const openPhone = () => Linking.openURL('tel:+1234567890');
  const openWebsite = () => Linking.openURL('https://hearttoheartministry.com');

  const reportBug = async () => {
    // Prefill message and open mail as quick fallback
    const body = `Please describe the bug and steps to reproduce.`;
    Linking.openURL(`mailto:support@hearttoheartministry.com?subject=Bug%20Report&body=${encodeURIComponent(body)}`);
  };

  const viewFaq = () => navigation.navigate('FAQ');

  const shareApp = async () => {
    try {
      await Share.share({ title: 'Heart to Heart', message: 'Check out Heart to Heart devotional app: https://hearttoheartministry.com' });
    } catch (e) {
      // ignore
    }
  };

  const sendLogs = async () => {
    try {
      const deviceInfo = { brand: Device.brand, modelName: Device.modelName, osName: Device.osName, osVersion: Device.osVersion };
      const payload = { email: email || null, subject: 'App logs', message: 'User-submitted logs', device: deviceInfo, metadata: {} };
      const res = await supportAPI.sendLog(payload);
      if (res) setSnackbar('Logs uploaded — support will review them.');
      else setSnackbar('Failed uploading logs.');
    } catch (e) {
      setSnackbar('Failed collecting device info.');
    }
  };

  const submitMessage = async () => {
    if (!email.includes('@') || !message.trim()) {
      setSnackbar('Please enter a valid email and message.');
      return;
    }
    setLoading(true);
    const result = await contactAPI.sendMessage({ name: name.trim(), email: email.trim(), subject: subject || 'App support', message: message.trim(), type: 'support' });
    setLoading(false);
    if (result) {
      setSnackbar('Your message was sent. We will reply soon.');
      setName('');
      setEmail('');
      setMessage('');
      setSubject('General inquiry');
      return;
    }
    setSnackbar('Unable to send your message. Please try again later.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.topNav}>
        <Button compact mode="outlined" onPress={() => navigation.goBack()} icon="arrow-left">Back</Button>
        <Button compact mode="text" onPress={() => navigation.navigate('MainTabs')} icon="home-outline">Home</Button>
      </View>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall" style={{ fontWeight: '700', marginBottom: 8 }}>Connect With Us</Text>
          <Text variant="bodyMedium" style={{ marginBottom: 12 }}>We'd love to hear from you — questions, feedback, prayer requests, or partnership enquiries.</Text>
          <Divider />
          <View style={{ marginTop: 12 }}>
            <Button icon={() => <MaterialCommunityIcons name="email-outline" size={18} />} mode="contained" onPress={openMail} style={{ marginBottom: 8 }}>
              Email Support
            </Button>
            <Button icon={() => <MaterialCommunityIcons name="bug" size={18} />} mode="outlined" onPress={reportBug} style={{ marginBottom: 8 }}>
              Report a bug
            </Button>
            <Button icon={() => <MaterialCommunityIcons name="help-circle-outline" size={18} />} mode="outlined" onPress={viewFaq} style={{ marginBottom: 8 }}>
              View FAQ
            </Button>
            <Button icon={() => <MaterialCommunityIcons name="phone" size={18} />} mode="outlined" onPress={openPhone} style={{ marginBottom: 8 }}>
              Call Us
            </Button>
            <Button icon={() => <MaterialCommunityIcons name="web" size={18} />} mode="outlined" onPress={openWebsite}>
              Visit Website
            </Button>
            <Button icon={() => <MaterialCommunityIcons name="share-variant" size={18} />} mode="outlined" onPress={shareApp} style={{ marginTop: 8 }}>
              Share App
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 8 }}>Send a Message</Text>
          <TextInput label="Name (optional)" value={name} onChangeText={setName} mode="outlined" style={styles.field} />
          <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.field} keyboardType="email-address" autoCapitalize="none" />
          <TextInput label="Subject" value={subject} onChangeText={setSubject} mode="outlined" style={styles.field} />
          <TextInput label="Message" value={message} onChangeText={setMessage} mode="outlined" style={[styles.field, { minHeight: 120 }]} multiline />
          <Button icon={() => <MaterialCommunityIcons name="send" size={18} />} mode="contained" loading={loading} onPress={submitMessage}>
            Send message
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 8 }}>Prayer Requests</Text>
          <Text variant="bodyMedium" style={{ marginBottom: 12 }}>Send us a prayer request via email and our prayer team will lift it up.</Text>
          <Button icon={() => <MaterialCommunityIcons name="message-text-outline" size={18} />} mode="contained" onPress={openMail}>
            Send Prayer Request
          </Button>
          <Button icon={() => <MaterialCommunityIcons name="file-upload" size={18} />} mode="outlined" onPress={sendLogs} style={{ marginTop: 8 }}>
            Send App Logs
          </Button>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 8 }}>Support the Ministry</Text>
          <Text variant="bodyMedium" style={{ marginBottom: 12 }}>Help keep resources free and expand our reach. Tap below to donate.</Text>
          <Button icon={() => <MaterialCommunityIcons name="hand-heart" size={18} />} mode="contained" onPress={() => navigation.navigate('Donate')}>
            Donate
          </Button>
        </Card.Content>
      </Card>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')}>{snackbar}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, gap: 8 },
  card: { marginBottom: 12, borderRadius: 12 },
  field: { marginBottom: 12 },
});

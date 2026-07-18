import React, { useEffect, useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Card, Text, ActivityIndicator, List, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { supportAPI } from '../services/api';

export default function FAQScreen() {
  const navigation = useNavigation();
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const items = await supportAPI.getFaq();
      if (mounted) setFaq(items || []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator /></View>;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
        <Button compact mode="outlined" onPress={() => navigation.goBack()} icon="arrow-left">Back</Button>
        <Button compact mode="text" onPress={() => navigation.navigate('MainTabs')} icon="home-outline">Home</Button>
      </View>
      <Card style={{ marginBottom: 12 }}>
        <Card.Content>
          <Text variant="headlineSmall" style={{ fontWeight: '700' }}>Help & FAQ</Text>
        </Card.Content>
      </Card>
      {faq && faq.map((f, idx) => (
        <List.Section key={idx}>
          <List.Accordion title={f.q} id={`faq-${idx}`}>
            <List.Item title={f.a} />
          </List.Accordion>
        </List.Section>
      ))}
    </ScrollView>
  );
}

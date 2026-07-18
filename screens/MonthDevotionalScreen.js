import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { devotionalAPI } from "../services/api";
import { cleanDevotional } from "../utils/textCleanup";

export default function MonthDevotionalScreen({ route, navigation }) {
  const month = route.params?.month || "MAY";
  const [devotionals, setDevotionals] = useState([]);

  useEffect(() => {
    devotionalAPI.getDevotionalsByMonth(month).then((items) => setDevotionals(items.map(cleanDevotional)));
  }, [month]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => navigation.goBack()}>Back</Button>
        <Text variant="headlineSmall" style={styles.title}>{month} Devotionals</Text>
      </View>
      <FlatList
        data={devotionals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => navigation.navigate("DevotionalDetail", { item })}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.title}>{item.date} - {item.title}</Text>
              <Text variant="bodySmall" numberOfLines={2}>{item.body}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAF8" },
  header: { paddingHorizontal: 16, paddingTop: 16 },
  title: { fontWeight: "800" },
  list: { padding: 16, paddingBottom: 120 },
  card: { borderRadius: 12, marginBottom: 10 },
});

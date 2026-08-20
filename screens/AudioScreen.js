import React from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';

export default function AudioScreen({ route }) {
  const devotional = route?.params?.item;
  return (
    <View>
      <Text>{devotional?.title || 'No devotional selected'}</Text>
    </View>
  );
}

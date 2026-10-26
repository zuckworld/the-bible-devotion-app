import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

export default function PaywallScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
      <Text variant="headlineSmall">Premium access</Text>
    </View>
  );
}

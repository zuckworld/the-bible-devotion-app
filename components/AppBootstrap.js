import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { PaperThemeProvider } from "./PaperThemeContext";
import { AppStateProvider } from "../contexts/AppContext";
import { initializeBibleDatabase } from "../services/bibleDatabase";
import { initializeLocalDatabase } from "../services/localDatabase";

export function AppBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    async function initialize() {
      try {
        await initializeBibleDatabase();
        initializeLocalDatabase();
        if (active) setReady(true);
      } catch (error) {
        console.warn("Local database initialization failed", error);
        if (active) {
          setInitializationError(error instanceof Error ? error.message : String(error));
        }
      }
    }

    initialize();
    return () => {
      active = false;
    };
  }, [attempt]);

  if (initializationError) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#FFFFFF" }}>
          <Text style={{ color: "#B42318", fontWeight: "700", textAlign: "center" }}>Local content could not be initialized.</Text>
          <Text style={{ marginTop: 8, color: "#475467", textAlign: "center" }}>{initializationError}</Text>
          <Button
            mode="contained"
            onPress={() => {
              setInitializationError(null);
              setAttempt((current) => current + 1);
            }}
            style={{ marginTop: 16 }}
          >
            Retry
          </Button>
        </View>
      </SafeAreaProvider>
    );
  }

  if (!ready) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" }}>
          <ActivityIndicator size="large" color="#0B1F4D" />
          <Text style={{ marginTop: 16, color: "#0B1F4D", fontWeight: "600" }}>Loading local content...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperThemeProvider>
        <AppStateProvider>{children}</AppStateProvider>
      </PaperThemeProvider>
    </SafeAreaProvider>
  );
}

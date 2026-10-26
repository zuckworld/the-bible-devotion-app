import React, { useContext, useEffect } from "react";
import { Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { PaperProvider } from "react-native-paper";
import { StatusBar } from "expo-status-bar";

import BookmarkProvider from "./bookmarks/BookmarkContext";
import { AppBootstrap } from "./components/AppBootstrap";
import { PaperThemeContext } from "./components/PaperThemeContext";
import { useAppState } from "./contexts/AppContext";
import { RootNavigator } from "./navigation/AppNavigator";

function AppProviders() {
  const { currentTheme } = useContext(PaperThemeContext);
  const { navigationState, persistNavigationState } = useAppState();

  return (
    <PaperProvider theme={currentTheme}>
      <StatusBar style={currentTheme.dark ? "light" : "dark"} />
      <BookmarkProvider>
        <NavigationContainer initialState={navigationState} onStateChange={persistNavigationState}>
          <RootNavigator />
        </NavigationContainer>
      </BookmarkProvider>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    if (Platform.OS === "web") document.body.style.overflow = "auto";
  }, []);

  return (
    <AppBootstrap>
      <AppProviders />
    </AppBootstrap>
  );
}

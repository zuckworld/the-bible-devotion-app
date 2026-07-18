import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";

export const PaperThemeContext = createContext();

const THEME_KEY = "h2h.theme.darkMode";

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#F15A24",
    primaryContainer: "#FFF0E8",
    secondary: "#121212",
    secondaryContainer: "#EFEAE0",
    tertiary: "#00A879",
    background: "#F4F0E4",
    surface: "#FFFFFF",
    surfaceVariant: "#EEE8D9",
    onBackground: "#191714",
    onSurface: "#191714",
    error: "#B3261E",
    outline: "#A49C8E",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FF7A3D",
    primaryContainer: "#33231B",
    secondary: "#F8F2E6",
    secondaryContainer: "#25231F",
    tertiary: "#25D2A0",
    background: "#050505",
    surface: "#121212",
    surfaceVariant: "#202020",
    onBackground: "#F8F2E6",
    onSurface: "#F8F2E6",
    outline: "#81796C",
    error: "#F2B8B5",
  },
};

export const PaperThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((value) => {
      if (value != null) setIsDarkMode(value === "true");
    });
  }, []);

  const setPersistedDarkMode = (value) => {
    const nextValue = typeof value === "function" ? value(isDarkMode) : value;
    setIsDarkMode(nextValue);
    AsyncStorage.setItem(THEME_KEY, String(nextValue));
  };

  const currentTheme = isDarkMode ? darkTheme : lightTheme;

  return (
    <PaperThemeContext.Provider value={{ isDarkMode, setIsDarkMode: setPersistedDarkMode, currentTheme }}>
      {children}
    </PaperThemeContext.Provider>
  );
};

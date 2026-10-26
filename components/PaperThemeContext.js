import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { appDarkTheme, appLightTheme } from "../theme/appTheme";

export const PaperThemeContext = createContext();

const THEME_KEY = "h2h.theme.darkMode";

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

  const currentTheme = isDarkMode ? appDarkTheme : appLightTheme;

  return (
    <PaperThemeContext.Provider value={{ isDarkMode, setIsDarkMode: setPersistedDarkMode, currentTheme }}>
      {children}
    </PaperThemeContext.Provider>
  );
};

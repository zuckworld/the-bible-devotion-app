import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";

export const NAVY = {
  primary: "#0B1F4D",
  primarySoft: "#1D3A70",
  secondary: "#122C5C",
  accent: "#F3F7FF",
  light: "#FFFFFF",
  text: "#111827",
  textMuted: "#4B5563",
  border: "#E5E7EB",
  background: "#FFFFFF",
  surface: "#F8FAFC",
};

export const NAVY_DARK = {
  primary: "#A7B9FF",
  primarySoft: "#7FA2FF",
  secondary: "#DCE7FF",
  accent: "#0F172A",
  light: "#F8FAFC",
  text: "#F5F7FA",
  textMuted: "#D1D5DB",
  border: "#243041",
  background: "#0B1220",
  surface: "#111827",
};

export const appLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: NAVY.primary,
    primaryContainer: "#EAF0FF",
    secondary: NAVY.secondary,
    secondaryContainer: "#F2F7FF",
    tertiary: "#4F46E5",
    background: NAVY.background,
    surface: NAVY.surface,
    surfaceVariant: "#EEF2F7",
    onBackground: NAVY.text,
    onSurface: NAVY.text,
    onPrimary: "#FFFFFF",
    onSecondary: "#FFFFFF",
    outline: NAVY.border,
    error: "#B3261E",
  },
};

export const appDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: NAVY_DARK.primary,
    primaryContainer: "#1B2A45",
    secondary: NAVY_DARK.secondary,
    secondaryContainer: "#172033",
    tertiary: "#93C5FD",
    background: NAVY_DARK.background,
    surface: NAVY_DARK.surface,
    surfaceVariant: "#172334",
    onBackground: NAVY_DARK.text,
    onSurface: NAVY_DARK.text,
    onPrimary: "#09111F",
    onSecondary: "#09111F",
    outline: NAVY_DARK.border,
    error: "#F2B8B5",
  },
};

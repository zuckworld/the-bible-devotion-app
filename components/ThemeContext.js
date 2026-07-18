import React, { createContext, useState } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const theme = darkMode
    ? {
        background: "#121212",
        card: "#1E1E1E",
        text: "#E9DCC9",
        footerBackground: "#121212",
        subText: "#AAAAAA",
        button1: "#4A90E2",
        button2: "#50C878",
        donate: "#E94E77",
      }
    : {
        background: "#E9DCC9",
        card: "#F9F6EE",
        text: "#1a1a1a",
        footerBackground: "#E9DCC9",
        subText: "#888",
        button1: "#4A90E2",
        button2: "#50C878",
        donate: "#E94E77",
      };

  return (
    <ThemeContext.Provider value={{ darkMode, setDarkMode, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

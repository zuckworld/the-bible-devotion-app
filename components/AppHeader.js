import React, { useContext } from "react";
import { View, TouchableOpacity, Image, Switch, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "./ThemeContext";

export default function AppHeader() {
  const { darkMode, setDarkMode, theme } = useContext(ThemeContext);

  return (
    <View style={styles.header}>
      {/* Profile avatar */}
      <TouchableOpacity>
        <Image
          source={require('../assets/boy.png')}
          style={styles.avatar}
        />
      </TouchableOpacity>

      {/* Toggle switch for dark mode */}
      <View style={styles.switchContainer}>
        <Ionicons
          name="moon"
          size={18}
          color={darkMode ? "#E9DCC9" : "#121212"}
          style={{ marginRight: 5 }}
        />
        <Switch
          value={darkMode}
          onValueChange={() => setDarkMode(!darkMode)}
          thumbColor={darkMode ? "#E9DCC9" : "#F4F3F4"}
          trackColor={{ false: "#E5E5E5", true: "#333" }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 25,
    marginBottom: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    shadowColor: "#000000ff",
    shadowOffset: { width: 5, height: 7 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 2,
    borderColor: "#591414ff",
    borderRadius: 15,
  },
  avatar: {
    width: 35,
    height: 35,
    borderRadius: 50,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
});

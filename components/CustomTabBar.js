// components/CustomTabBar.js
import React, { useContext } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { PaperThemeContext } from "./PaperThemeContext";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const { currentTheme } = useContext(PaperThemeContext);

  return (
    <View style={[styles.tabContainer, { backgroundColor: currentTheme.colors.surface, borderTopColor: currentTheme.colors.outline }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Center floating button
        if (label === "Devotional") {
          return (
            <TouchableOpacity
              key={label}
              onPress={onPress}
              style={styles.centerButton}
            >
              <View style={[styles.centerCircle, { backgroundColor: currentTheme.colors.primary }]}>
                <MaterialCommunityIcons
                  name="book-heart"
                  size={28}
                  color="#fff"
                  style={{ marginTop: 2 }}
                />
              </View>
            </TouchableOpacity>
          );
        }

        // Other tabs
        const iconName =
          label === "Home"
            ? "home"
            : label === "Bible"
            ? "book-open-page-variant"
            : label === "Audio"
            ? "headphones"
            : "cog";

        return (
          <TouchableOpacity
            key={label}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            <MaterialCommunityIcons
              name={iconName}
              size={26}
              color={isFocused ? currentTheme.colors.primary : currentTheme.colors.outline}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    height: 70,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  centerButton: {
    top: -25,
  },
  centerCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4b7bec",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
});

export default CustomTabBar;

import React, { useState, useContext, } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { ThemeContext } from "./ThemeContext";

const screenWidth = Dimensions.get("window").width;

const books = [
  { id: "1", title: "The Power of Faith", image: require("../assets/pursuit.webp") },
  { id: "2", title: "Walking in Grace", image: require("../assets/success.webp") },
  { id: "3", title: "Purpose Driven Life", image: require("../assets/treasury.webp") },
  { id: "4", title: "Strength in Weakness", image: require("../assets/word.webp") },
  { id: "5", title: "Strength in Weakness", image: require("../assets/faith.webp") },
  { id: "6", title: "Strength in Weakness", image: require("../assets/born-again.webp") },
];

export default function AuthorBooksSection({ navigation }) {
    const { darkMode, setDarkMode, theme } = useContext(ThemeContext);
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Other Books by the Author</Text>
      <FlatList
        data={books}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("ReadingScreen", { bookItem: item })}
          >
            <Image source={item.image} style={styles.image} />
            <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 1,
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#1E1E1E",
    borderRadius: 12,
    padding: 10,
    marginRight: 15,
    width: screenWidth * 0.4, // about 40% of screen width
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E9DCC9",
  },
  title: {
    marginTop: 8,
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
});

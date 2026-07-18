import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const BookmarkContext = createContext();

export default function BookmarkProvider({ children }) {
  const [bookmarks, setBookmarks] = useState([]);

  // Load on start
  useEffect(() => {
    async function load() {
      const saved = await AsyncStorage.getItem("bookmarks");
      if (saved) setBookmarks(JSON.parse(saved));
    }
    load();
  }, []);

  // Save on change
  useEffect(() => {
    AsyncStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const toggleBookmark = (item) => {
    const exists = bookmarks.find((b) => b.date === item.date);

    if (exists) {
      setBookmarks(bookmarks.filter((b) => b.date !== item.date));
    } else {
      setBookmarks([...bookmarks, item]);
    }
  };

  const isBookmarked = (date) => {
    return bookmarks.some((b) => b.date === date);
  };

  return (
    <BookmarkContext.Provider value={{ bookmarks, toggleBookmark, isBookmarked }}>
      {children}
    </BookmarkContext.Provider>
  );
}

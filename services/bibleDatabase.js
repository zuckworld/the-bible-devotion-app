import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SQLite from "expo-sqlite";

export const DB_VERSION = 1;

const DATABASE_NAME = "bible.db";
const LEGACY_DATABASE_NAME = "heart_to_heart.db";
const VERSION_KEY = "bible_db_version";
const LEGACY_CLEANUP_KEY = "legacy_bible_database_removed";
const BUNDLED_DATABASE = require("../assets/db/bible.db");

let db = null;


export async function initializeBibleDatabase() {
  const storedVersion = Number(await AsyncStorage.getItem(VERSION_KEY)) || 0;
  if (storedVersion < DB_VERSION) {
    await SQLite.deleteDatabaseAsync(DATABASE_NAME);
    db = await SQLite.openDatabaseAsync(DATABASE_NAME, BUNDLED_DATABASE);
    await AsyncStorage.setItem(VERSION_KEY, String(DB_VERSION));
  } else {
    db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  }

  const oldDatabaseRemoved = await AsyncStorage.getItem(LEGACY_CLEANUP_KEY);
  if (oldDatabaseRemoved !== "true") {
    await SQLite.deleteDatabaseAsync(LEGACY_DATABASE_NAME);
    await AsyncStorage.setItem(LEGACY_CLEANUP_KEY, "true");
  }

  db.execSync("PRAGMA query_only = ON");
  return db;
}

function getDatabase() {
  if (!db) {
    throw new Error("Bible database has not been initialized.");
  }
  return db;
}

export function getBibleBooks() {
  return getDatabase().getAllSync(`
    SELECT book_num, book AS name, COUNT(DISTINCT chapter) AS chapterCount
    FROM verses
    WHERE translation = 'KJV'
    GROUP BY book_num, book
    ORDER BY book_num
  `).map((row) => ({
    book_num: Number(row.book_num),
    name: String(row.name),
    chapterCount: Number(row.chapterCount),
    versionCode: "KJV",
  }));
}

export function getBookChapters(_versionCode = "KJV", bookName) {
  return getDatabase().getAllSync(
    `SELECT DISTINCT chapter
     FROM verses
     WHERE translation = 'KJV' AND book = ?
     ORDER BY chapter`,
    [bookName]
  ).map((row) => ({ chapter: Number(row.chapter) }));
}

export function getChapterVerses(_versionCode = "KJV", bookName, chapter) {
  const rows = getDatabase().getAllSync(
    `SELECT v.id, v.verse, v.text, w.pos, w.text AS word_text, w.strongs
     FROM verses AS v
     LEFT JOIN verse_words AS w ON w.verse_id = v.id
     WHERE v.translation = 'KJV' AND v.book = ? AND v.chapter = ?
     ORDER BY v.verse, w.pos`,
    [bookName, Number(chapter)]
  );
  const verses = new Map();
  for (const row of rows) {
    let verse = verses.get(row.id);
    if (!verse) {
      verse = {
        id: Number(row.id),
        verse: Number(row.verse),
        text: String(row.text),
        words: [],
      };
      verses.set(row.id, verse);
    }

    if (row.pos == null) {
      verse.words.push({ text: verse.text, strongs: null });
    } else {
      verse.words.push({
        text: String(row.word_text),
        strongs: row.strongs == null ? null : String(row.strongs),
      });
    }
  }

  return Array.from(verses.values());
}

export function findBibleReference(referenceText, _versionCode = "KJV") {
  if (!referenceText || !String(referenceText).trim()) return null;
  const match = String(referenceText).trim().match(/^(.+?)\s+(\d+)(?::(\d+))?\s*$/i);
  if (!match) return null;

  const [, book, rawChapter, rawVerse] = match;
  const chapter = Number(rawChapter);
  const verse = Number(rawVerse || 1);
  const row = getDatabase().getFirstSync(
    `SELECT book, chapter, verse, text
     FROM verses
     WHERE translation = 'KJV' AND LOWER(book) = LOWER(?) AND chapter = ? AND verse = ?
     LIMIT 1`,
    [book.trim(), chapter, verse]
  );
  if (!row) return null;

  return {
    bookTitle: String(row.book),
    versionCode: "KJV",
    chapterIndex: Number(row.chapter) - 1,
    verseNumber: Number(row.verse),
    text: String(row.text),
  };
}

export function searchVersesByWord(term, _versionCode = "KJV", limit = 8) {
  const clean = String(term || "").trim();
  if (!clean) return [];
  const rows = getDatabase().getAllSync(
    `SELECT book AS book_name, chapter AS chapter_number, verse AS verse_number, text
     FROM verses
     WHERE translation = 'KJV' AND LOWER(text) LIKE LOWER(?)
     ORDER BY book_num, chapter, verse
     LIMIT ?`,
    [`%${clean.replace(/[%_]/g, "")}%`, Number(limit) || 8]
  );
  return rows.map((row) => ({ ...row, version_code: "KJV" }));
}

export function getStrongEntries(strongs) {
  const ids = String(strongs || "").trim().split(/\s+/).filter(Boolean);
  const prioritizedIds = ids.slice().reverse().filter((id) => id !== "G3588");
  if (ids.includes("G3588") && prioritizedIds.length === 0) prioritizedIds.push("G3588");

  return prioritizedIds.flatMap((strongsId) => getDatabase().getAllSync(
    `SELECT * FROM lexicon WHERE strongs_id = ? ORDER BY is_primary DESC, id`,
    [strongsId]
  ));
}

export function getDictionaryEntries(term) {
  const clean = String(term || "").trim();
  if (!clean) return [];
  return getDatabase().getAllSync(
    `SELECT id, term, definition
     FROM dictionary
     WHERE source = 'EASTONS' AND term_lower = LOWER(?)
     ORDER BY id`,
    [clean]
  ).map((row) => ({
    id: Number(row.id),
    word: String(row.term),
    definition: String(row.definition || ""),
  }));
}

export function searchDictionaryTerms(term, limit = 20) {
  const prefix = String(term || "").trim().toLowerCase();
  if (!prefix) return [];
  return getDatabase().getAllSync(
    `SELECT DISTINCT term, term_lower
     FROM dictionary
     WHERE source = 'EASTONS' AND term_lower LIKE ?
     ORDER BY term_lower
     LIMIT ?`,
    [`${prefix.replace(/[%_]/g, "")}%`, Number(limit) || 20]
  ).map((row) => ({ term: String(row.term), term_lower: String(row.term_lower) }));
}

export function getDictionaryEntry(term) {
  return getDictionaryEntries(term)[0] || null;
}

export function isBibleTerm(term) {
  const clean = String(term || "").trim();
  if (!clean) return false;
  return Boolean(getDatabase().getFirstSync(
    `SELECT 1 FROM verse_words
     WHERE LOWER(text) = LOWER(?) AND strongs IS NOT NULL
     LIMIT 1`,
    [clean]
  ));
}
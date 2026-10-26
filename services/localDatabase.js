import * as SQLite from "expo-sqlite";
import {
  findBibleReference,
  getBibleBooks,
  getBookChapters,
  getChapterVerses,
  getDictionaryEntries,
  getDictionaryEntry,
  getStrongEntries,
  isBibleTerm,
  searchDictionaryTerms,
  searchVersesByWord,
} from "./bibleDatabase";

export {
  findBibleReference,
  getBibleBooks,
  getBookChapters,
  getChapterVerses,
  getDictionaryEntries,
  getDictionaryEntry,
  getStrongEntries,
  isBibleTerm,
  searchDictionaryTerms,
  searchVersesByWord,
};

let db = null;

const devotionalSeedData = {
  "jan.json": require("../data/devotional/jan.json"),
  "feb.json": require("../data/devotional/feb.json"),
  "mar.json": require("../data/devotional/mar.json"),
  "april.json": require("../data/devotional/april.json"),
  "may.json": require("../data/devotional/may.json"),
  "june.json": require("../data/devotional/june.json"),
  "july.json": require("../data/devotional/july.json"),
  "aug.json": require("../data/devotional/aug.json"),
  "sep.json": require("../data/devotional/sep.json"),
  "oct.json": require("../data/devotional/oct.json"),
  "nov.json": require("../data/devotional/nov.json"),
  "dec.json": require("../data/devotional/dec.json"),
};

const studyThemeSeedData = [
  {
    slug: "faith-and-trust",
    name: "Faith and Trust",
    description: "Themes of reliance, confidence, and obedience to God.",
  },
  {
    slug: "grace-and-redemption",
    name: "Grace and Redemption",
    description: "God's mercy, forgiveness, and restoration for sinners.",
  },
  {
    slug: "prayer-and-worship",
    name: "Prayer and Worship",
    description: "Words of praise, petition, and worshipful dependence on God.",
  },
  {
    slug: "hope-and-courage",
    name: "Hope and Courage",
    description: "Steadfast faith in the midst of hardship and uncertainty.",
  },
  {
    slug: "love-and-community",
    name: "Love and Community",
    description: "God's love and the call to love one another in the body of Christ.",
  },
];

const timelineSeedData = [
  {
    title: "Creation",
    period: "c. 4004 BC",
    category: "Genesis",
    description: "God creates the heavens, the earth, and all living things in six days.",
    reference: "Genesis 1:1-2:3",
  },
  {
    title: "The Flood",
    period: "c. 2348 BC",
    category: "Genesis",
    description: "The world is judged by water, but Noah and his family are spared by grace.",
    reference: "Genesis 6-9",
  },
  {
    title: "Abraham's Call",
    period: "c. 2091 BC",
    category: "Patriarchs",
    description: "God calls Abram to leave his homeland and trust His promises.",
    reference: "Genesis 12",
  },
  {
    title: "Joseph in Egypt",
    period: "c. 1900 BC",
    category: "Patriarchs",
    description: "Joseph's journey through betrayal, prison, and divine favor prepares the story of Israel.",
    reference: "Genesis 37-50",
  },
  {
    title: "Exodus from Egypt",
    period: "c. 1446 BC",
    category: "Exodus",
    description: "God rescues His people from slavery through Moses and the Passover.",
    reference: "Exodus 1-15",
  },
  {
    title: "Wilderness Journey",
    period: "c. 1446-1406 BC",
    category: "Wilderness",
    description: "Israel learns obedience, dependence, and trust through testing and provision.",
    reference: "Numbers, Deuteronomy",
  },
  {
    title: "David's Kingdom",
    period: "c. 1010-970 BC",
    category: "Kings",
    description: "David rules in Jerusalem, establishing a kingdom that points toward Christ.",
    reference: "1 Samuel 16-2 Samuel 5",
  },
  {
    title: "Babylonian Exile",
    period: "c. 586 BC",
    category: "Prophets",
    description: "Judah is carried into exile, and the people learn the cost of disobedience.",
    reference: "2 Kings 24-25, Jeremiah",
  },
  {
    title: "Life of Jesus",
    period: "c. 4 BC-AD 30",
    category: "Gospels",
    description: "Jesus teaches, heals, suffers, dies, and rises to redeem humanity.",
    reference: "Matthew-Mark, Luke, John",
  },
  {
    title: "Pentecost",
    period: "AD 30",
    category: "Church",
    description: "The Holy Spirit descends, and the church begins to proclaim the Gospel.",
    reference: "Acts 2",
  },
  {
    title: "Paul's Missionary Journeys",
    period: "AD 46-57",
    category: "Church",
    description: "Paul travels across the Roman world establishing churches and teaching doctrine.",
    reference: "Acts 13-28",
  },
  {
    title: "New Creation",
    period: "Future hope",
    category: "Eschatology",
    description: "God will renew all things and establish His kingdom in fullness.",
    reference: "Revelation 21-22",
  },
];

const crossReferenceSeedData = [
  {
    topic: "Faith",
    category: "Trust",
    summary: "Faith is anchored in the character of God and His promises.",
    references: ["Hebrews 11:1", "Romans 4:20-21", "2 Corinthians 5:7"],
  },
  {
    topic: "Grace",
    category: "Mercy",
    summary: "Grace is God's unearned favor that transforms and sustains us.",
    references: ["Ephesians 2:8-9", "Titus 2:11-12", "John 1:16-17"],
  },
  {
    topic: "Prayer",
    category: "Worship",
    summary: "Prayer strengthens communion with God and invites His guidance.",
    references: ["Philippians 4:6-7", "1 Thessalonians 5:16-18", "Matthew 6:9-13"],
  },
  {
    topic: "Love",
    category: "Community",
    summary: "Love is the clearest visible sign of God's work in His people.",
    references: ["1 Corinthians 13:4-8", "John 13:34-35", "Romans 5:8"],
  },
  {
    topic: "Hope",
    category: "Courage",
    summary: "Hope is a confident expectation rooted in God's faithfulness.",
    references: ["Romans 15:13", "Psalm 42:11", "Lamentations 3:21-24"],
  },
];

const devotionalFiles = Object.keys(devotionalSeedData);

function tableCount(tableName) {
  const row = db.getFirstSync(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return Number(row?.count ?? 0);
}

function ensureSchema() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS devotionals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_text TEXT NOT NULL,
      title TEXT,
      verse TEXT,
      body TEXT,
      confession TEXT,
      prayer TEXT,
      UNIQUE(date_text, title)
    );

    CREATE TABLE IF NOT EXISTS hymns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT UNIQUE NOT NULL,
      author TEXT,
      year INTEGER,
      lyrics TEXT,
      story TEXT,
      note TEXT
    );

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT UNIQUE NOT NULL,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS study_themes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      period TEXT,
      category TEXT,
      description TEXT,
      reference TEXT
    );

    CREATE TABLE IF NOT EXISTS cross_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      category TEXT,
      summary TEXT,
      references TEXT
    );
  `);
}

function seedDevotionals() {
  for (const fileName of devotionalFiles) {
    const data = devotionalSeedData[fileName];
    const items = Array.isArray(data) ? data : [];

    for (const item of items) {
      db.runSync(
        `INSERT OR IGNORE INTO devotionals (date_text, title, verse, body, confession, prayer) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          String(item?.date ?? ""),
          String(item?.title ?? ""),
          String(item?.verse ?? ""),
          String(item?.body ?? ""),
          String(item?.confession ?? ""),
          String(item?.prayer ?? ""),
        ]
      );
    }
  }
}

function seedHymns() {
  const source = require("../assets/hymns.json");
  const items = Array.isArray(source?.hymns) ? source.hymns : [];

  for (const hymn of items) {
    db.runSync(
      `INSERT OR IGNORE INTO hymns (title, author, year, lyrics, story, note) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(hymn?.title ?? ""),
        String(hymn?.author_composer ?? ""),
        Number(hymn?.year ?? 0),
        String(hymn?.lyrics ?? ""),
        String(hymn?.story ?? ""),
        String(hymn?.note ?? ""),
      ]
    );
  }
}

function seedStudyThemes() {
  for (const theme of studyThemeSeedData) {
    db.runSync(
      `INSERT OR IGNORE INTO study_themes (slug, name, description) VALUES (?, ?, ?)`,
      [
        String(theme.slug || "").trim(),
        String(theme.name || "Study Theme"),
        String(theme.description || ""),
      ]
    );
  }
}

function seedTimelineEvents() {
  for (const event of timelineSeedData) {
    db.runSync(
      `INSERT OR IGNORE INTO timeline_events (title, period, category, description, reference) VALUES (?, ?, ?, ?, ?)`,
      [
        String(event.title || ""),
        String(event.period || ""),
        String(event.category || ""),
        String(event.description || ""),
        String(event.reference || ""),
      ]
    );
  }
}

function seedCrossReferences() {
  for (const item of crossReferenceSeedData) {
    db.runSync(
      `INSERT OR IGNORE INTO cross_references (topic, category, summary, references) VALUES (?, ?, ?, ?)`,
      [
        String(item.topic || ""),
        String(item.category || "General"),
        String(item.summary || ""),
        JSON.stringify(Array.isArray(item.references) ? item.references : []),
      ]
    );
  }
}

export function initializeLocalDatabase() {
  db = SQLite.openDatabaseSync("heart_to_heart.db");
  ensureSchema();

  if (tableCount("devotionals") === 0) {
    seedDevotionals();
  }

  if (tableCount("hymns") === 0) {
    seedHymns();
  }

  if (tableCount("study_themes") === 0) {
    seedStudyThemes();
  }

  if (tableCount("timeline_events") === 0) {
    seedTimelineEvents();
  }

  if (tableCount("cross_references") === 0) {
    seedCrossReferences();
  }

  db.runSync(
    `INSERT OR IGNORE INTO app_meta (key, value) VALUES ('database_initialized', 'true')`
  );

  return true;
}

export function getLocalDatabase() {
  return db;
}

export function getHymns(limit = 50) {
  return db.getAllSync(
    `SELECT id, title, author, year, lyrics, story, note
     FROM hymns
     ORDER BY title COLLATE NOCASE
     LIMIT ?`,
    [Number(limit) || 50]
  );
}

function normalizeLocalDevotional(row) {
  const body = String(row?.body ?? "");
  const dateText = String(row?.date_text ?? "");

  return {
    id: Number(row?.id ?? 0),
    date: dateText,
    title: String(row?.title ?? "Daily Devotional"),
    verse: String(row?.verse ?? ""),
    body,
    fullBody: body,
    confession: row?.confession ? String(row.confession) : null,
    prayer: row?.prayer ? String(row.prayer) : null,
    readTime: Math.max(2, Math.ceil((body.split(/\s+/).filter(Boolean).length || 1) / 180)),
  };
}

export function getDevotionalsByMonth(monthKey = "MAY") {
  const key = String(monthKey || "MAY").toUpperCase();

  const rows = db.getAllSync(
    `SELECT id, date_text, title, verse, body, confession, prayer
     FROM devotionals
     ORDER BY date_text COLLATE NOCASE`
  );

  return rows
    .filter((row) => {
      const dateText = String(row?.date_text ?? "").toUpperCase();
      if (dateText === key) return true;
      if (!dateText.startsWith(key)) return false;
      const nextChar = dateText.slice(key.length, key.length + 1);
      return nextChar === "" || /\s/.test(nextChar);
    })
    .map(normalizeLocalDevotional);
}

export function getTodayDevotional() {
  const today = new Date();
  const monthKeys = ["JAN", "FEB", "MAR", "APRIL", "MAY", "JUNE", "JULY", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthKey = monthKeys[today.getMonth()] || "MAY";
  const dayLabel = String(today.getDate());

  const rows = getDevotionalsByMonth(monthKey);
  const match = rows.find((item) => String(item.date).endsWith(dayLabel)) || rows[0] || null;

  return match;
}

export function getDevotionalById(id) {
  const row = db.getFirstSync(
    `SELECT id, date_text, title, verse, body, confession, prayer
     FROM devotionals
     WHERE id = ?`,
    [Number(id)]
  );

  return row ? normalizeLocalDevotional(row) : null;
}

export function getStudyThemes(limit = 8) {
  return db.getAllSync(
    `SELECT slug, name, description
     FROM study_themes
     ORDER BY name COLLATE NOCASE
     LIMIT ?`,
    [Number(limit) || 8]
  );
}

export function getTimelineEvents(limit = 12) {
  return db.getAllSync(
    `SELECT title, period, category, description, reference
     FROM timeline_events
     ORDER BY id
     LIMIT ?`,
    [Number(limit) || 12]
  );
}

export function getCrossReferences(limit = 6) {
  const rows = db.getAllSync(
    `SELECT topic, category, summary, references
     FROM cross_references
     ORDER BY topic COLLATE NOCASE
     LIMIT ?`,
    [Number(limit) || 6]
  );

  return rows.map((row) => ({
    topic: String(row.topic),
    category: String(row.category || "General"),
    summary: String(row.summary || ""),
    references: (() => {
      try {
        const parsed = JSON.parse(String(row.references || "[]"));
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [];
      }
    })(),
  }));
}

export function normalizeBookName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function findMatchingLocalBook(bookItem, localBooks = []) {
  if (!bookItem) return null;
  const targetName = normalizeBookName(bookItem.name || bookItem.title || bookItem.book || "");
  if (!targetName) return null;

  return localBooks.find((candidate) => normalizeBookName(candidate.name || candidate.title || "") === targetName) || null;
}

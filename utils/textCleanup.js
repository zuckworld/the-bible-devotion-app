const mojibakePairs = [
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€\u009d", "”"],
  ["â€˜", "‘"],
  ["â€™", "’"],
  ["â€\u0099", "’"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€¦", "…"],
  ["â€¢", "•"],
  ["Â ", " "],
  ["Â", ""],
  ["Ã©", "é"],
  ["Ã¨", "è"],
  ["Ã¡", "á"],
  ["Ã­", "í"],
  ["Ã³", "ó"],
  ["Ãº", "ú"],
  ["Ã±", "ñ"],
  ["�", ""],
];

const ocrWordFixes = [
  ["PREP ARING", "PREPARING"],
  ["GREA TNESS", "GREATNESS"],
  ["GREA T", "GREAT"],
  ["F AITH", "FAITH"],
  ["P ASSION", "PASSION"],
  ["MA TCH", "MATCH"],
  ["W AY", "WAY"],
  ["GLOR Y", "GLORY"],
  ["HONOR Y", "HONORY"],
  ["HONOUR Y", "HONOURY"],
  ["HEA VENL Y", "HEAVENLY"],
  ["HEA VEN", "HEAVEN"],
  ["ST OP", "STOP"],
  ["CREA TED", "CREATED"],
  ["RECREA TE", "RECREATE"],
  ["DOMINA TING", "DOMINATING"],
  ["HA VING", "HAVING"],
  ["LA Y", "LAY"],
  ["MASTER Y", "MASTERY"],
  ["HOL Y", "HOLY"],
  ["PRA YING", "PRAYING"],
  ["D AIL Y", "DAILY"],
  ["W ANTS", "WANTS"],
  ["VENL Y", "VENLY"],
];

export function cleanText(value, options = {}) {
  if (value == null) return "";

  const { stripBibleNotes = false, compact = false } = options;
  let text = String(value);

  mojibakePairs.forEach(([bad, good]) => {
    text = text.split(bad).join(good);
  });

  ocrWordFixes.forEach(([bad, good]) => {
    text = text.replace(new RegExp(`\\b${bad}\\b`, "g"), good);
  });

  text = text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\uFFFD/g, "")
    .replace(/\\n/g, " ")
    .replace(/\s+\/\s+/g, " / ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([“‘])\s+/g, "$1")
    .replace(/\s+([”’])/g, "$1")
    .replace(/\s+-\s+/g, " - ")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (stripBibleNotes) {
    text = text.replace(/\s*\{[^}]+\}/g, "").replace(/\s{2,}/g, " ").trim();
  }

  if (compact) {
    text = text.replace(/^:\s*/, "");
  }

  return text;
}

export function cleanDevotional(item) {
  if (!item) return item;
  return {
    ...item,
    title: cleanText(item.title, { compact: true }),
    verse: cleanText(item.verse),
    body: cleanText(item.body),
    fullBody: cleanText(item.fullBody || item.body),
    confession: item.confession ? cleanText(item.confession) : item.confession,
    prayer: item.prayer ? cleanText(item.prayer) : item.prayer,
  };
}

import jan from "./devotional/jan.json";
import feb from "./devotional/feb.json";
import mar from "./devotional/mar.json";
import april from "./devotional/april.json";
import may from "./devotional/may.json";
import june from "./devotional/june.json";
import july from "./devotional/july.json";
import aug from "./devotional/aug.json";
import sep from "./devotional/sep.json";
import oct from "./devotional/oct.json";
import nov from "./devotional/nov.json";
import dec from "./devotional/dec.json";

export const months = {
  JAN: jan,
  FEB: feb,
  MAR: mar,
  APRIL: april,
  MAY: may,
  JUNE: june,
  JULY: july,
  AUG: aug,
  SEP: sep,
  OCT: oct,
  NOV: nov,
  DEC: dec
};

export function getTodayDevotional() {
  const today = new Date();
  const monthIndex = today.getMonth(); // 0 - 11
  const day = today.getDate(); // 1 - 31

  const monthKeys = ["JAN","FEB","MAR","APRIL","MAY","JUNE","JULY","AUG","SEP","OCT","NOV","DEC"];
  const monthKey = monthKeys[monthIndex];

  const monthData = months[monthKey];

  // Day numbers start 1
  return monthData[day - 1];
}

export function getDevotionsForMonth(monthKey) {
  return months[monthKey];
}

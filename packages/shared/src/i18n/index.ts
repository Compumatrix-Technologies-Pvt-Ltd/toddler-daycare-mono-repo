import { de } from "./de.js";
import { en } from "./en.js";

export { de } from "./de.js";
export { en } from "./en.js";

export type Language = "de" | "en";

export const translations = {
  de,
  en,
} as const;

export type Translations = typeof de;

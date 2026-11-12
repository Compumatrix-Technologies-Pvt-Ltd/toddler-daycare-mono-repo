import { de } from "./de.js";
import { en } from "./en.js";

export { de } from "./de.js";
export { en } from "./en.js";

export type Language = "de" | "en";

export type Translations = typeof de;

export const translations: Record<Language, Translations> = {
  de,
  en,
};

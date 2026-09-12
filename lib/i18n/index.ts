import { Language, TranslationDictionary } from "@/types";
import { vi } from "./dictionaries/vi";
import { en } from "./dictionaries/en";

export const dictionaries: Record<Language, TranslationDictionary> = {
  vi,
  en,
};

export const defaultLanguage: Language = "vi";

export function getDictionary(lang: Language = defaultLanguage): TranslationDictionary {
  return dictionaries[lang] || dictionaries[defaultLanguage];
}

export const supportedLanguages: readonly {
  code: Language;
  label: string;
  flag: string;
}[] = [
  { code: "vi", label: "Tiếng Việt", flag: "🇻🇳" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

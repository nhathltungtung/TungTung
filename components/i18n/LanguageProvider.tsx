"use client";

import React, { createContext, useContext, useState } from "react";
import { Language, TranslationDictionary } from "@/types";
import { vi } from "@/lib/i18n/dictionaries/vi";
import { en } from "@/lib/i18n/dictionaries/en";

const dictionaries: Record<Language, TranslationDictionary> = {
  vi,
  en,
};

const defaultLanguage: Language = "vi";

interface LanguageContextType {
  language: Language;
  t: TranslationDictionary;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialize language from localStorage or default to "vi"
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLang = localStorage.getItem("language") as Language | null;
        if (savedLang && (savedLang === "vi" || savedLang === "en")) {
          return savedLang;
        }
      } catch {
        return defaultLanguage;
      }
    }
    return defaultLanguage;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("language", lang);
      document.cookie = `language=${lang};path=/;max-age=31536000`;
    } catch {
      // Ignore storage errors
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === "vi" ? "en" : "vi";
    setLanguage(nextLang);
  };

  const t = dictionaries[language];

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return context;
}

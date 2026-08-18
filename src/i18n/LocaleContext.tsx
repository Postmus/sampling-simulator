import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Locale = "en" | "nl";
export type LocalizedText = Record<Locale, string>;

const STORAGE_KEY = "statistical-concepts-lab-locale";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function initialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "nl") return stored;
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  return window.navigator.language.toLowerCase().startsWith("nl") ? "nl" : "en";
}

export function LocaleProvider({ children, initial }: { children: ReactNode; initial?: Locale }) {
  const [locale, setLocale] = useState<Locale>(() => initial ?? initialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // The selected locale still applies for the current page session.
    }
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (context === null) throw new Error("useLocale must be used inside LocaleProvider.");
  return context;
}

export function localeTag(locale: Locale) {
  return locale === "nl" ? "nl-NL" : "en-US";
}

export function formatNumber(
  value: number,
  locale: Locale,
  maximumFractionDigits = 2,
  minimumFractionDigits = 0,
) {
  return new Intl.NumberFormat(localeTag(locale), {
    maximumFractionDigits,
    minimumFractionDigits,
  }).format(value);
}

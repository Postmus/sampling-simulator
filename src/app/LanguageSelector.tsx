import { useLocale } from "../i18n/LocaleContext";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  return (
    <label className="language-selector">
      <span>{locale === "nl" ? "Taal" : "Language"}</span>
      <select
        aria-label={locale === "nl" ? "Taal" : "Language"}
        value={locale}
        onChange={(event) => setLocale(event.target.value as "en" | "nl")}
      >
        <option value="en">English</option>
        <option value="nl">Nederlands</option>
      </select>
    </label>
  );
}

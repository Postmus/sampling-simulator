import { Suspense, useEffect, useMemo, useState } from "react";
import {
  conceptsForTheme,
  findConcept,
  findTheme,
  themeRegistry,
} from "./app/conceptRegistry";
import { LanguageSelector } from "./app/LanguageSelector";
import { appMessages } from "./app/messages";
import { useLocale } from "./i18n/LocaleContext";

function idFromHash(hash: string, segment: "concepts" | "themes") {
  const match = hash.match(new RegExp(`^#/${segment}/([^/?]+)`));
  return match?.[1] ?? null;
}

function App() {
  const { locale } = useLocale();
  const messages = appMessages[locale];
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const conceptId = idFromHash(hash, "concepts");
  const themeId = idFromHash(hash, "themes");
  const concept = useMemo(() => findConcept(conceptId), [conceptId]);
  const theme = useMemo(() => findTheme(themeId), [themeId]);

  if (concept !== null) {
    const ConceptPage = concept.component;
    return (
      <Suspense fallback={<main className="loading-screen">{messages.loading}</main>}>
        <ConceptPage />
      </Suspense>
    );
  }

  if (theme !== null) {
    const themeCopy = theme.copy[locale];
    const concepts = conceptsForTheme(theme.id);
    return (
      <main className="library-shell theme-shell">
        <div className="library-toolbar theme-toolbar">
          <a className="theme-back-link" href="#/">← {messages.backToThemes}</a>
          <LanguageSelector />
        </div>
        <header className="library-header theme-header">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{themeCopy.title}</h1>
          <p>{themeCopy.description}</p>
        </header>

        <section className="concept-library theme-explorations" aria-labelledby="theme-explorations-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{messages.explorationsEyebrow}</p>
              <h2 id="theme-explorations-title">{messages.availableExplorations}</h2>
            </div>
            <span>{messages.explorationCount(concepts.length)}</span>
          </div>
          <div className="concept-grid">
            {concepts.map((entry, index) => {
              const copy = entry.copy[locale];
              return (
                <a className="concept-card" href={`#/concepts/${entry.id}`} key={entry.id}>
                  <span className="concept-number" aria-hidden="true">{index + 1}</span>
                  <h3>{copy.title}</h3>
                  <p>{copy.description}</p>
                  <span className="concept-link">{messages.open} <span aria-hidden="true">→</span></span>
                </a>
              );
            })}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="library-shell">
      <div className="library-toolbar"><LanguageSelector /></div>
      <header className="library-header landing-header">
        <p className="eyebrow">{messages.title}</p>
        <h1 id="concept-library-title">{messages.chooseTheme}</h1>
      </header>

      <section className="concept-library" aria-labelledby="concept-library-title">
        <div className="theme-grid">
          {themeRegistry.map((entry, index) => {
            const copy = entry.copy[locale];
            const explorationCount = conceptsForTheme(entry.id).length;
            return (
              <a className={`theme-card theme-${index + 1}`} href={`#/themes/${entry.id}`} key={entry.id}>
                <span className="theme-index" aria-hidden="true">0{index + 1}</span>
                <h3>{copy.title}</h3>
                <p>{copy.description}</p>
                <div className="theme-card-footer">
                  <span>{messages.explorationCount(explorationCount)}</span>
                  <strong>{messages.openTheme} <span aria-hidden="true">→</span></strong>
                </div>
              </a>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;

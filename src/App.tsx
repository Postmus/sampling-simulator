import { Suspense, useEffect, useMemo, useState } from "react";
import { conceptRegistry, findConcept } from "./app/conceptRegistry";
import { LanguageSelector } from "./app/LanguageSelector";
import { appMessages } from "./app/messages";
import { useLocale } from "./i18n/LocaleContext";

function conceptIdFromLocation() {
  const match = window.location.hash.match(/^#\/concepts\/([^/?]+)/);
  return match?.[1] ?? null;
}

function App() {
  const { locale } = useLocale();
  const messages = appMessages[locale];
  const [conceptId, setConceptId] = useState(conceptIdFromLocation);

  useEffect(() => {
    const handleHashChange = () => setConceptId(conceptIdFromLocation());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const concept = useMemo(() => findConcept(conceptId), [conceptId]);

  if (concept !== null) {
    const ConceptPage = concept.component;
    return (
      <Suspense fallback={<main className="loading-screen">{messages.loading}</main>}>
        <ConceptPage />
      </Suspense>
    );
  }

  return (
    <main className="library-shell">
      <div className="library-toolbar"><LanguageSelector /></div>
      <header className="library-header">
        <p className="eyebrow">{messages.eyebrow}</p>
        <h1>{messages.title}</h1>
        <p>{messages.intro}</p>
      </header>

      <section className="concept-library" aria-labelledby="concept-library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{messages.libraryEyebrow}</p>
            <h2 id="concept-library-title">{messages.available}</h2>
          </div>
          <span>{messages.conceptCount(conceptRegistry.length)}</span>
        </div>

        <div className="concept-grid">
          {conceptRegistry.map((entry) => {
            const copy = entry.copy[locale];
            return (
              <a className="concept-card" href={`#/concepts/${entry.id}`} key={entry.id}>
                <span className="concept-category">{copy.category}</span>
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

export default App;

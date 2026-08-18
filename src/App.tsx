import { Suspense, useEffect, useMemo, useState } from "react";
import { conceptRegistry, findConcept } from "./app/conceptRegistry";

function conceptIdFromLocation() {
  const match = window.location.hash.match(/^#\/concepts\/([^/?]+)/);
  return match?.[1] ?? null;
}

function App() {
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
      <Suspense fallback={<main className="loading-screen">Loading concept…</main>}>
        <ConceptPage />
      </Suspense>
    );
  }

  return (
    <main className="library-shell">
      <header className="library-header">
        <p className="eyebrow">Interactive statistics</p>
        <h1>Statistical Concepts Lab</h1>
        <p>
          Explore statistical ideas by changing a model, watching each step, and comparing a
          single run with its long-run behavior.
        </p>
      </header>

      <section className="concept-library" aria-labelledby="concept-library-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Concept library</p>
            <h2 id="concept-library-title">Available explorations</h2>
          </div>
          <span>{conceptRegistry.length} concept</span>
        </div>

        <div className="concept-grid">
          {conceptRegistry.map((entry) => (
            <a className="concept-card" href={`#/concepts/${entry.id}`} key={entry.id}>
              <span className="concept-category">{entry.category}</span>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <span className="concept-link">Open exploration <span aria-hidden="true">→</span></span>
            </a>
          ))}

          <article className="concept-card concept-card-coming-soon" aria-label="More concepts coming soon">
            <span className="concept-category">Next</span>
            <h3>Confidence interval coverage</h3>
            <p>Watch repeated intervals succeed and fail to capture a fixed population value.</p>
            <span className="concept-link">Planned</span>
          </article>
        </div>
      </section>
    </main>
  );
}

export default App;

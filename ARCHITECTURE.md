# Architecture

## Guiding rule

Each statistical concept is an independent feature. The application shell knows only its title,
category, description, route identifier, and lazy-loaded page component. Concept-specific state
must not be added to `App.tsx` or to the registry.

## Layers

### App

`src/app/conceptRegistry.ts` is the catalogue. `src/App.tsx` handles the library and hash routing.
Hash routes keep static deployments and direct links working without server-side rewrites.
The registry stores English and Dutch metadata for every concept.

### Localization

`src/i18n` owns the global `en`/`nl` locale, browser-language fallback, local persistence, the
document language attribute, and locale-aware number formatting. Shared shell copy lives in
`src/app/messages.ts`; teaching copy stays in each concept's `messages.ts`. This keeps a future
concept's terminology close to its visualization while maintaining one language choice across the
lab. Message interfaces and parity tests prevent one locale from silently losing a key.

### Concepts

Each directory under `src/concepts` owns a complete teaching interaction. A concept may contain:

- a page component and controls;
- pure simulation/model functions;
- visualization-specific calculations;
- an animated scene controller;
- concept-scoped styles and tests.

Do not force unrelated concepts into a common configuration or state shape.

### Domain

`src/domain` contains pure, deterministic mathematical code. It must not import React, browser
APIs, animation code, or concept components. Random functions accept an explicit RNG so scenarios
can be replayed and tested.

### Runtime

`src/runtime` coordinates time and lifecycle concerns that recur across animated concepts. The
animation runtime currently owns speed adjustment, pause/resume, reduced motion, cancellation, and
stale-run protection.

### Visualization

`src/visualization` contains small drawing primitives. A primitive belongs here only after multiple
concepts need the same behavior; concept-specific geometry stays with its concept.

## Adding a concept

1. Create `src/concepts/<concept-id>/`.
2. Put mathematical transformations in pure model functions and test them.
3. Build the page and visualization inside the concept directory.
4. Reuse the animation runtime for cancellation and reduced-motion behavior.
5. Provide complete English and Dutch concept copy, including SVG and accessibility text.
6. Add one localized lazy-loaded entry to `conceptRegistry.ts`.
7. Verify `npm test`, `npm run build`, and `npm run test:e2e`.

## Readable exploration layout

Treat laptop and classroom readability as an acceptance criterion for every new exploration. The
mean-difference sampling exploration is the current reference implementation.

- Design and visually inspect both the initial and populated states at the shared Playwright
  baseline of 1366 × 768 pixels.
- Prefer vertical page scrolling over shrinking an entire visualization to fit a short viewport.
  Preserve the intended type sizes when content needs more vertical room.
- Keep explanatory SVG text effectively about 16 pixels or larger after the SVG has been placed
  and scaled. Panel headings should remain visibly larger than annotations, axes, and labels.
- Use the `--exploration-*` tokens in `src/styles.css` as the starting point for control dimensions,
  control text, status text, panel headings, explanatory text, labels, and axes. A concept may use
  larger values when its content benefits from them.
- Give panels enough vertical space that data, formulas, and annotations do not compete for the
  same area. Do not solve collisions by making instructional text smaller.
- Keep the primary controls and summary values readable without requiring tiny uppercase labels.
  Less frequently used controls, such as animation speed and replay options, may live in a clearly
  labelled expandable section.
- Do not rely on Unicode combining marks for mathematical notation in SVG when browser or font
  placement is inconsistent. Draw the notation explicitly or use another robust representation.
- Verify responsive behavior separately. Horizontal scrolling is acceptable for a complex SVG on
  a narrow phone when further compression would make the content unreadable.

When an existing exploration is revised substantially, apply this convention during the same
change rather than preserving an unnecessarily compressed layout.

The least-squares exploration is the second implemented concept and demonstrates that the shell,
animation runtime, presentation behavior, and design language can be shared without forcing its
state into the sampling model. Future inference concepts should remain separate features and reuse
only the mathematical or visual primitives they genuinely share.

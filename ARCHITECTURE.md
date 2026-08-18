# Architecture

## Guiding rule

Each statistical concept is an independent feature. The application shell knows only its title,
category, description, route identifier, and lazy-loaded page component. Concept-specific state
must not be added to `App.tsx` or to the registry.

## Layers

### App

`src/app/conceptRegistry.ts` is the catalogue. `src/App.tsx` handles the library and hash routing.
Hash routes keep static deployments and direct links working without server-side rewrites.

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
5. Add one lazy-loaded entry to `conceptRegistry.ts`.
6. Verify `npm test` and `npm run build`.

The least-squares exploration is the second implemented concept and demonstrates that the shell,
animation runtime, presentation behavior, and design language can be shared without forcing its
state into the sampling model. Future inference concepts should remain separate features and reuse
only the mathematical or visual primitives they genuinely share.

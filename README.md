# Statistical Concepts Lab

An extensible, frontend-only teaching app for explaining statistical ideas through animated,
interactive visualizations.

The current concept library includes:

- a sampling journey that follows observations into one sample and then builds a sampling
  distribution from repeated sample means;
- a least-squares exploration that links a movable regression line, an always-visible mean
  reference, residual squares, an animated SSE accumulator, the slope–intercept error landscape,
  and a residual dot plot for the current candidate line.

Both explorations support presentation mode and reduced motion. The sampling journey also supports
deterministic replay and fast batch generation.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL. The concept library is the home page; concepts use static-host-friendly
hash routes such as `#/concepts/sampling-distribution` and `#/concepts/least-squares`.

## Validate

```bash
npm test
npm run build
npx playwright install chromium # first browser-test run only
npm run test:e2e
```

## Architecture

- `src/app`: application shell and the small concept registry
- `src/concepts`: self-contained concept features with their own model, controls, stage, and styles
- `src/domain`: pure probability, random-number, and statistical functions
- `src/runtime`: concept-independent animation and simulation lifecycle utilities
- `src/visualization`: low-level SVG helpers shared only when concepts genuinely need them

See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries and instructions for adding a
concept.

The previous all-in-one sampling simulator is retained in Git history at the local tag
`sampling-simulator-v0.1`.

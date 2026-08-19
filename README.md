# Statistical Concepts Lab

An extensible, frontend-only teaching app for explaining statistical ideas through animated,
interactive visualizations.

The current concept library includes:

- a sampling journey that follows observations into one sample and then builds a sampling
  distribution from repeated sample means;
- a least-squares exploration that links a movable regression line, an always-visible mean
  reference, residual squares, a full-width animated SSE accumulator, and the slope–intercept
  error landscape.
- a regression-diagnostics demonstrator that releases residuals from a fitted equation into an
  always-visible residual-versus-fitted plot and residual distribution, including an animated
  comparison of models using `x` and `log₂(x)`.

The library and all explorations support English and Dutch, presentation mode, and reduced motion.
The language choice persists between pages and visits. The sampling journey also supports
deterministic replay and fast batch generation.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL. The concept library is the home page; concepts use static-host-friendly
hash routes such as `#/concepts/sampling-distribution`, `#/concepts/least-squares`, and
`#/concepts/regression-diagnostics`.

## Deploy to GitHub Pages

The [Pages workflow](./.github/workflows/deploy-pages.yml) runs the unit tests, builds the app, and
deploys `dist` whenever `main` is updated. It can also be started manually from the repository's
**Actions** tab.

Before the first deployment, open **Settings → Pages** in the GitHub repository and select
**GitHub Actions** as the build and deployment source. After the workflow completes, this
repository will normally be available at:

<https://postmus.github.io/sampling-simulator/>

The app uses relative asset paths and hash routes, so it works from the repository subdirectory
without a separate Pages-specific build configuration.

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
- `src/i18n`: global locale state, persistence, and locale-aware number formatting
- `src/domain`: pure probability, random-number, and statistical functions
- `src/runtime`: concept-independent animation and simulation lifecycle utilities
- `src/visualization`: low-level SVG helpers shared only when concepts genuinely need them

See [ARCHITECTURE.md](./ARCHITECTURE.md) for module boundaries and instructions for adding a
concept.

The previous all-in-one sampling simulator is retained in Git history at the local tag
`sampling-simulator-v0.1`.

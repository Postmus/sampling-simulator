# Sampling Simulator

A frontend-only teaching app for illustrating:

- population distributions
- one observed sample
- sampling distributions of estimators
- empirical versus theoretical standard error

The current MVP supports:

- sample mean from normal, uniform, and right-skewed populations
- sample proportion from a Bernoulli population

## Run locally

```bash
npm install
npm run dev
```

## Architecture

- `src/core`: pure statistical logic
- `src/components`: reusable UI panels and simple SVG-based charts
- `src/presets`: lecture-ready example scenarios
- `src/App.tsx`: top-level teaching flow and state

The app is frontend-only and suitable for local use during lectures or later deployment as a static site such as GitHub Pages.

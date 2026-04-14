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

Open the local Vite URL that the command prints. Do not open `index.html` directly from disk.

## Architecture

- `src/core`: pure statistical logic
- `src/components`: reusable UI panels and simple SVG-based charts
- `src/presets`: lecture-ready example scenarios
- `src/App.tsx`: top-level teaching flow and state

The app is frontend-only and suitable for local use during lectures or deployment as a static site such as GitHub Pages.

## GitHub Pages

This repository is set up to deploy the built `dist/` output with GitHub Actions. After pushing to the default branch, the workflow will build the app and publish it to GitHub Pages.

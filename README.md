# Statistical Concepts Lab

An extensible, frontend-only teaching app for explaining statistical ideas through animated,
interactive visualizations.

The first concept follows observations from a fixed normal population into one random sample,
calculates its mean, and then moves that single estimate into a sampling distribution. It supports
deterministic replay, fast batch generation, pause/resume, presentation mode, and reduced motion.

## Run locally

```bash
npm install
npm run dev
```

Open the local Vite URL. The concept library is the home page; concepts use static-host-friendly
hash routes such as `#/concepts/sampling-distribution`.

## Validate

```bash
npm test
npm run build
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

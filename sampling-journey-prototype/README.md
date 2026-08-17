# Sampling Journey Prototype

This is an isolated, disposable prototype for testing a more focused way of teaching sampling variability.

The central interaction makes the relationship explicit:

1. a fixed population model generates a random sample;
2. the sample produces one sample mean;
3. the sample mean becomes one dot in the sampling distribution;
4. repeated samples gradually reveal the long-run distribution of the estimator.

## Run it

From the repository root:

```bash
npm run dev
```

Open the URL printed by Vite and add `/sampling-journey-prototype/` to it. For example:

```text
http://localhost:5173/sampling-journey-prototype/
```

The prototype imports the existing statistical and random-number utilities from `src/core`. It does not modify or replace the existing React application.

## Prototype boundaries

- normal population only;
- sample mean only;
- animated individual samples plus fast batch generation;
- theoretical and empirical standard error;
- deterministic replay with the same random seed;
- reduced-motion fallback.

Confidence intervals and hypothesis testing are deliberately excluded until the central sampling interaction has been evaluated.

# Sampling Journey Prototype

This is an isolated, disposable prototype for testing a more focused way of teaching sampling variability.

The central interaction makes the relationship explicit:

1. a fixed population distribution generates a random sample;
2. the sampled observations move into the random-sample panel;
3. a vertical bar marks the calculated sample mean and displays its value;
4. only that calculated mean moves into the sampling distribution;
5. repeated samples gradually reveal the long-run distribution of the estimator.

Outlined reference markers keep the latest sampled values visible on the population distribution while solid copies remain in the random-sample panel.

All three panels use the same numerical x-axis. The narrower spread of the sample means is therefore a direct visual contrast with the wider population distribution rather than an effect of rescaling.

Panel 3 contains only the empirical sample means; it does not overlay a theoretical sampling-distribution curve. It always uses a histogram with fixed bins. The bin width is based on half the theoretical standard error, rounded to a readable value, and remains fixed until the population model or sample size changes.

## Run it

From the repository root:

```bash
npm run dev
```

Open the URL printed by Vite and add `/sampling-journey-prototype/` to it. For example:

```text
http://localhost:5173/sampling-journey-prototype/
```

The prototype imports the repository's statistical and random-number utilities from `src/core`. Its compact lecture layout places controls and empirical metrics in a left rail, keeps the full animation visible without document scrolling on common presentation viewports, and includes a fullscreen presentation mode.

## Prototype boundaries

- normal population only;
- sample mean only;
- animated individual samples plus fast batch generation;
- empirical standard error;
- deterministic replay with the same random seed;
- reduced-motion fallback.

Confidence intervals and hypothesis testing are deliberately excluded until the central sampling interaction has been evaluated.

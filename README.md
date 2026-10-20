# Statistical Concepts Lab

An extensible, frontend-only teaching app for explaining statistical ideas through animated,
interactive visualizations.

The current concept library includes:

- a sampling journey that follows observations into one sample and then builds a sampling
  distribution from repeated sample means;
- a Gel X animal-experiment journey that repeatedly samples 12 animals per treatment group and
  builds the sampling distribution of the difference between the Gel X and vehicle means;
- a least-squares exploration that links a movable regression line, an always-visible mean
  reference, residual squares, a full-width animated SSE accumulator, and the slope–intercept
  error landscape.
- a regression-diagnostics demonstrator that releases residuals from a fitted equation into an
  always-visible residual-versus-fitted plot and residual distribution, including an animated
  comparison of models using `x` and `log₂(x)`.
- an additive ANCOVA exploration that moves from three horizontal group-mean fits to three
  parallel regression lines and compares treatment coefficients, standard errors, confidence
  intervals, and p-values before and after baseline adjustment.
- an interaction-model exploration that moves from parallel to non-parallel implant-stability
  regression lines and compares the jaw difference at two selected insertion-torque values.
- a cluster-randomisation exploration that shows patients within hospitals and compares ordinary
  regression with a random-intercept model across single and repeated trials.

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

## Stratification exploration

Open `#/concepts/stratified-randomization` for the LAS allocation/analysis demo.
Compare analyses shows one experiment with a switch between simple and stratified
randomization of the same animals (six per cell under stratification). Repeat
experiments compares the two estimators under simple randomization; Balance within
sex compares the within-sex estimator under the two allocation methods. Both
repetition tabs show only their paired sampling distributions. Model/replay
settings and the optional standard-error table open in dialogs. The main tabs
fit 1280×720 and 1366×768 viewports in both languages; narrow screens stack content.
The model fixes 12 animals of each sex, adds a common treatment effect of 10 pp,
and uses a male vehicle mean of 50%, a configurable sex effect (default 12 pp),
and Normal residual SD (default 12 pp). This is an illustrative unbounded model.

The within-sex estimator uses equal target-population weights. Under these fixed
allocation totals it equals the treatment coefficient in the common-effect
treatment-plus-sex model; the optional SE view uses that model's residual variance
and 21 degrees of freedom. Empty sex/treatment cells are explicitly reported,
not silently redrawn. All experiments remain counted; undefined adjusted
estimates are excluded only from their own distribution and valid counts are shown.

Model changes reset accumulated experiments. Reset replays the displayed seed;
New seed starts another reproducible sequence. Batches stop at 20,000 experiments.
The demo includes English/Dutch copy, reduced motion and presentation mode.

## Plaque-index hypothesis testing and power

Open `#/concepts/plaque-index-inference` (under **Sampling distributions**) for a separate
THK teaching exploration. It samples independent Normal populations with a common adjustable
SD, comparing control (default mean 1.50, adjustable from 0 to 3) with extra oral-hygiene
guidance. The displayed difference is experimental minus control. Defaults are SD 0.60, 24 patients per group, and H₀ (true difference 0).
Switch to H₁ for a true difference of −0.30, adjustable from −0.80 to +0.80 with a minimum
absolute magnitude of 0.05. Both population means are labelled in their density plots. Population SD accepts
0.05–1.20; group size accepts integers 2–500. These are illustrative unbounded Normal draws,
not truncated plaque scores, which preserves the exact pooled t-test assumptions.

Each experiment contributes one mean difference and one t-statistic. The t-statistic uses the
pooled SD estimated from that experiment, with 2n − 2 degrees of freedom; it is always tested
against the central null t-distribution with two-sided α = 0.05. The observed rejection fraction
is labelled type I error under H₀ and estimated power under H₁. The population SD, theoretical
SE = SD × √(2/n), and empirical SD of repeated differences are displayed separately.

Model edits clear accumulated results. Reset replays the seed; New seed starts another sequence.
Runs support one animated experiment, ten animated experiments, or a batch of 1,000, up to
20,000 completed experiments. English/Dutch, presentation mode, pause and reduced motion are
supported. Language changes preserve the current model and results.

Repeated-experiment plots show empirical counts without theoretical density overlays. Their
axes fit all simulated results, including zero and (for t-statistics) both rejection boundaries.

## Cluster randomisation: patients within hospitals

Open `#/concepts/cluster-randomization` under **Clustered data** for the first Beyond Linear
Regression exploration. Each trial randomises six hospitals, three per arm, with exactly 20
patients per hospital. A horizontal dot plot shows one hospital per row, individual systolic
blood-pressure outcomes, treatment assignment, and observed hospital means. Hospital ordering
stays fixed. The illustrative control population mean is 130 mmHg.
Two compact horizontal boxplots appear to the right on wide screens (below on narrow screens),
pooling the 60 patients per treatment arm on the same outcome range. They show Tukey hinges,
median lines, 1.5-IQR whiskers, individual outliers, and observed group means as diamonds.

ICC ranges from 0.10 to 0.90. Total outcome SD within each treatment arm is separately adjustable
(default 12 mmHg), and remains fixed when ICC changes. Independent Normal hospital effects
have variance `ICC × SD²`; patient residuals have variance `(1 − ICC) × SD²`. Trials start under
H₀; H₁ enables a configurable common treatment effect (default −5 mmHg).

Each trial fits ordinary patient-level regression (118 residual degrees of freedom) and a
balanced Gaussian random-intercept model using closed-form REML with a nonnegative hospital
variance. The latter uses a pre-specified t reference with four degrees of freedom. For interior
variance estimates its inference equals a pooled t-test on the six hospital means. At the
zero-hospital-variance boundary, REML pools the residual sums of squares and retains the
four-degree-of-freedom reference, giving conservative inference. Boundary trials are included
and identified in the expandable model details. Neither analysis uses the generating variance
parameters to estimate its uncertainty. Numerical regression fixtures are checked against R
`lm()` and `nlme::lme()`; simulation tests check null calibration across the allowed ICC range.

The two models share the treatment-effect estimate, but have different standard errors,
95% confidence intervals, and potentially different decisions. Repeated trials show observed
type I error under H₀, estimated power under H₁, interval coverage, and one common sampling
distribution of treatment estimates. Every trial generates new hospital effects, patients, and
a balanced hospital allocation. Runs support one trial with a brief reveal, or batches
of 1,000, up to 20,000 trials. Population edits clear results; reset replays the seed. English,
Dutch, presentation mode, reduced motion, and narrow-screen chart scrolling are
supported.

## Randomised blocks: treatment within hospitals

Open `#/concepts/randomized-block-design` as the second **Clustered data** exploration. It uses
the same six hospitals and 20 patients per hospital, but randomises exactly ten patients to
each treatment within every hospital. The continuous outcome, ICC limits, configurable total
SD, common treatment effect, seed/replay behaviour, and repeated-trial controls match the
cluster-randomisation companion.

Each hospital row contains two coloured patient bands and connected treatment means. The
adjacent treatment-group boxplots pool 60 patients per arm across all six hospitals. **Centre
within hospitals** subtracts each hospital's observed mean from both treatment groups and
updates both plots to a shared deviation scale. This is a display transformation: original
outcomes, fitted analyses, completed-trial counts, and the estimate histogram stay unchanged.
Population edits retain this display choice; restoring defaults clears it.

The balanced Gaussian random-intercept model uses closed-form REML. Hospital-mean contrasts
have five degrees of freedom, and within-hospital residuals after estimating the common
treatment effect have `120 − 6 − 1 = 113`. Treatment uncertainty depends on the estimated
residual variance; the mixed-model test uses a t reference with 113 degrees of freedom.
Interior fits agree with both R `nlme::lme()` and treatment-plus-fixed-hospital regression.
At the nonnegative-hospital-variance boundary, REML pools the residual sums of squares and
retains the pre-specified 113-degree-of-freedom reference. Ordinary regression uses 118
degrees of freedom and includes the unmodelled hospital differences in its residual variance.

Simulation checks verify calibrated mixed-model type I error, conservative ordinary-regression
tests, and increased power from accounting for hospitals in this balanced common-effect model.
The exploration supports English, Dutch, presentation mode, reduced motion, and responsive
chart stacking.

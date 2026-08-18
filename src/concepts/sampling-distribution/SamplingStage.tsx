export function SamplingStage() {
  return (
    <section className="stage-card" aria-label="Animated sampling process">
      <div className="stage-heading-row">
        <p data-role="status" className="status" role="status" aria-live="polite">
          Draw one sample to begin.
        </p>
      </div>
      <div className="svg-wrap">
        <svg data-role="stage" viewBox="0 0 1200 760" role="img" aria-labelledby="svg-title svg-description">
          <title id="svg-title">Animated sampling journey</title>
          <desc id="svg-description">
            A random sample appears in the population panel and moves to the sample panel. Its mean
            then moves into a histogram of means from repeated samples.
          </desc>
          <rect className="zone-background population-zone" x="30" y="28" width="1140" height="225" rx="24" />
          <rect className="zone-background sample-zone" x="30" y="272" width="1140" height="205" rx="24" />
          <rect className="zone-background distribution-zone" x="30" y="496" width="1140" height="235" rx="24" />
          <g data-layer="population" />
          <g data-layer="population-sample" />
          <g data-layer="sample" />
          <g data-layer="mean" />
          <g data-layer="histogram" />
          <g data-layer="distribution-reference" />
          <g data-layer="transition" />
          <g data-layer="annotation" />
        </svg>
      </div>
    </section>
  );
}

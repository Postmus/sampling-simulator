import { useLocale } from "../../i18n/LocaleContext";
import { meanDifferenceMessages } from "./messages";

export function MeanDifferenceStage() {
  const { locale } = useLocale();
  const messages = meanDifferenceMessages[locale].stage;

  return (
    <section className="mean-difference-stage-card" aria-label={messages.aria}>
      <div className="mean-difference-stage-heading">
        <p data-role="status" className="mean-difference-status" role="status" aria-live="polite">
          {messages.initialStatus}
        </p>
      </div>
      <div className="mean-difference-svg-wrap">
        <svg data-role="stage" viewBox="0 0 1200 850" role="img" aria-labelledby="mean-difference-svg-title mean-difference-svg-description">
          <title id="mean-difference-svg-title">{messages.svgTitle}</title>
          <desc id="mean-difference-svg-description">{messages.svgDescription}</desc>
          <rect className="mean-difference-zone mean-difference-population-zone" x="30" y="20" width="1140" height="235" rx="24" />
          <rect className="mean-difference-zone mean-difference-experiment-zone" x="30" y="275" width="1140" height="250" rx="24" />
          <rect className="mean-difference-zone mean-difference-distribution-zone" x="30" y="545" width="1140" height="280" rx="24" />
          <g data-layer="population" />
          <g data-layer="population-sample" />
          <g data-layer="experiment" />
          <g data-layer="means" />
          <g data-layer="distribution-reference" />
          <g data-layer="histogram" />
          <g data-layer="transition" />
          <g data-layer="annotation" />
        </svg>
      </div>
    </section>
  );
}

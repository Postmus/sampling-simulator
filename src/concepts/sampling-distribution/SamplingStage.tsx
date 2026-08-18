import { useLocale } from "../../i18n/LocaleContext";
import { samplingMessages } from "./messages";

export function SamplingStage() {
  const { locale } = useLocale();
  const messages = samplingMessages[locale].stage;
  return (
    <section className="stage-card" aria-label={messages.aria}>
      <div className="stage-heading-row">
        <p data-role="status" className="status" role="status" aria-live="polite">
          {messages.initialStatus}
        </p>
      </div>
      <div className="svg-wrap">
        <svg data-role="stage" viewBox="0 0 1200 760" role="img" aria-labelledby="svg-title svg-description">
          <title id="svg-title">{messages.svgTitle}</title>
          <desc id="svg-description">{messages.svgDescription}</desc>
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

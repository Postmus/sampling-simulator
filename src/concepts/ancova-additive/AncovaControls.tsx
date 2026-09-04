import { useLocale } from "../../i18n/LocaleContext";
import { ancovaMessages } from "./messages";
import type { AncovaModelKind } from "./model";

interface AncovaControlsProps {
  activeModel: AncovaModelKind | null;
  adjustedRevealed: boolean;
  busy: boolean;
  onUnadjusted: () => void;
  onAdjusted: () => void;
  onReset: () => void;
}

export function AncovaControls(props: AncovaControlsProps) {
  const { locale } = useLocale();
  const messages = ancovaMessages[locale].controls;
  return (
    <aside className="ancova-control-rail" aria-label={messages.aria}>
      <section className="ancova-case-card">
        <h2>{messages.caseTitle}</h2>
        <p>{messages.caseText}</p>
      </section>

      <section className="ancova-question-card">
        <span>{messages.questionTitle}</span>
        <p>{messages.questionText}</p>
      </section>

      <section className="ancova-model-path">
        <div className="ancova-rail-heading"><span>{messages.modelPath}</span></div>
        <article className={`ancova-model-step${props.activeModel === "unadjusted" ? " active" : ""}${props.activeModel !== null ? " revealed" : ""}`}>
          <div><span className="step-number">1</span><strong>{messages.stepOne.replace(/^1 · /, "")}</strong></div>
          <p>{messages.stepOneHint}</p>
          <button
            className={props.activeModel === null ? "primary" : "secondary"}
            type="button"
            disabled={props.busy || props.activeModel === "unadjusted"}
            onClick={props.onUnadjusted}
          >
            {props.busy && props.activeModel !== "adjusted"
              ? messages.fitting
              : props.activeModel === null
                ? messages.fitUnadjusted
                : messages.showUnadjusted}
          </button>
        </article>

        <div className={`ancova-step-connector${props.activeModel !== null ? " ready" : ""}`} aria-hidden="true">↓</div>

        <article className={`ancova-model-step${props.activeModel === "adjusted" ? " active" : ""}${props.adjustedRevealed ? " revealed" : ""}`}>
          <div><span className="step-number">2</span><strong>{messages.stepTwo.replace(/^2 · /, "")}</strong></div>
          <p>{messages.stepTwoHint}</p>
          <button
            className={props.activeModel === "unadjusted" && !props.adjustedRevealed ? "primary" : "secondary"}
            type="button"
            disabled={props.busy || props.activeModel === null || props.activeModel === "adjusted"}
            onClick={props.onAdjusted}
          >
            {props.busy && props.activeModel === "adjusted"
              ? messages.fitting
              : props.adjustedRevealed
                ? messages.showAdjusted
                : messages.addBaseline}
          </button>
        </article>
      </section>

      <button className="secondary ancova-reset" type="button" disabled={props.busy || props.activeModel === null} onClick={props.onReset}>
        {messages.reset}
      </button>
    </aside>
  );
}

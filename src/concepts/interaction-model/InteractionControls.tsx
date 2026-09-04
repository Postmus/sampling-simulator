import { useLocale } from "../../i18n/LocaleContext";
import { interactionMessages } from "./messages";
import type { InteractionModelKind } from "./model";

interface InteractionControlsProps {
  activeModel: InteractionModelKind | null;
  interactionRevealed: boolean;
  busy: boolean;
  onAdditive: () => void;
  onInteraction: () => void;
  onReset: () => void;
}

export function InteractionControls(props: InteractionControlsProps) {
  const { locale } = useLocale();
  const messages = interactionMessages[locale].controls;
  return (
    <aside className="ancova-control-rail" aria-label={messages.aria}>
      <section className="ancova-case-card"><h2>{messages.caseTitle}</h2><p>{messages.caseText}</p></section>
      <section className="ancova-question-card"><span>{messages.questionTitle}</span><p>{messages.questionText}</p></section>
      <section className="ancova-model-path">
        <div className="ancova-rail-heading"><span>{messages.modelPath}</span></div>
        <article className={`ancova-model-step${props.activeModel === "additive" ? " active" : ""}${props.activeModel !== null ? " revealed" : ""}`}>
          <div><span className="step-number">1</span><strong>{messages.stepOne.replace(/^1 · /, "")}</strong></div>
          <p>{messages.stepOneHint}</p>
          <button className={props.activeModel === null ? "primary" : "secondary"} type="button" disabled={props.busy || props.activeModel === "additive"} onClick={props.onAdditive}>
            {props.busy && props.activeModel === "additive" ? messages.fitting : props.activeModel === null ? messages.fitAdditive : messages.showAdditive}
          </button>
        </article>
        <div className={`ancova-step-connector${props.activeModel !== null ? " ready" : ""}`} aria-hidden="true">↓</div>
        <article className={`ancova-model-step${props.activeModel === "interaction" ? " active" : ""}${props.interactionRevealed ? " revealed" : ""}`}>
          <div><span className="step-number">2</span><strong>{messages.stepTwo.replace(/^2 · /, "")}</strong></div>
          <p>{messages.stepTwoHint}</p>
          <button className={props.activeModel === "additive" && !props.interactionRevealed ? "primary" : "secondary"} type="button" disabled={props.busy || props.activeModel === null || props.activeModel === "interaction"} onClick={props.onInteraction}>
            {props.busy && props.activeModel === "interaction" ? messages.fitting : props.interactionRevealed ? messages.showInteraction : messages.addInteraction}
          </button>
        </article>
      </section>
      <button className="secondary ancova-reset" type="button" disabled={props.busy || props.activeModel === null} onClick={props.onReset}>{messages.reset}</button>
    </aside>
  );
}

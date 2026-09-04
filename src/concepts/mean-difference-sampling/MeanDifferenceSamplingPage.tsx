import { useEffect, useRef } from "react";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale } from "../../i18n/LocaleContext";
import { MeanDifferenceControls } from "./MeanDifferenceControls";
import { MeanDifferenceJourneyController } from "./MeanDifferenceJourneyController";
import { MeanDifferenceStage } from "./MeanDifferenceStage";
import { meanDifferenceMessages } from "./messages";
import "./mean-difference-sampling.css";

export default function MeanDifferenceSamplingPage() {
  const { locale } = useLocale();
  const messages = meanDifferenceMessages[locale];
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (rootRef.current === null) return;
    const controller = new MeanDifferenceJourneyController(rootRef.current, locale);
    return () => controller.destroy();
  }, [locale]);

  return (
    <main className="mean-difference-journey" ref={rootRef}>
      <header className="mean-difference-header">
        <a className="mean-difference-back-link" href="#/themes/sampling-estimation" aria-label={messages.backAria}>
          ← {messages.library}
        </a>
        <div className="mean-difference-title">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{messages.title}</h1>
          <p>{messages.subtitle}</p>
        </div>
        <div className="mean-difference-header-actions">
          <LanguageSelector />
          <button data-role="fullscreen" className="secondary mean-difference-presentation" type="button">
            {messages.presentation}
          </button>
        </div>
      </header>

      <div className="mean-difference-workspace">
        <MeanDifferenceControls />
        <MeanDifferenceStage />
      </div>
    </main>
  );
}

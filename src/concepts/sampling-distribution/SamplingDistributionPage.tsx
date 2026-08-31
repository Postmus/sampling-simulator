import { useEffect, useRef } from "react";
import { SamplingControls } from "./SamplingControls";
import { SamplingJourneyController } from "./SamplingJourneyController";
import { SamplingStage } from "./SamplingStage";
import { LanguageSelector } from "../../app/LanguageSelector";
import { useLocale } from "../../i18n/LocaleContext";
import { samplingMessages } from "./messages";
import "./sampling-distribution.css";

export default function SamplingDistributionPage() {
  const { locale } = useLocale();
  const messages = samplingMessages[locale];
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (rootRef.current === null) {
      return;
    }
    const controller = new SamplingJourneyController(rootRef.current, locale);
    return () => controller.destroy();
  }, [locale]);

  return (
    <main className="sampling-journey" ref={rootRef}>
      <header className="compact-header">
        <a className="back-link" href="#/themes/sampling-estimation" aria-label={messages.backAria}>← {messages.library}</a>
        <div className="compact-title">
          <p className="eyebrow">{messages.eyebrow}</p>
          <h1>{messages.title}</h1>
          <p className="header-subtitle">{messages.subtitle}</p>
        </div>
        <div className="compact-header-actions">
          <LanguageSelector />
          <button data-role="fullscreen" className="secondary compact-button" type="button">{messages.presentation}</button>
        </div>
      </header>

      <div className="workspace-layout">
        <SamplingControls />
        <SamplingStage />
      </div>
    </main>
  );
}

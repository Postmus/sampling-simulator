import { describe, expect, it } from "vitest";
import { appMessages } from "../app/messages";
import { conceptRegistry } from "../app/conceptRegistry";
import { leastSquaresMessages } from "../concepts/least-squares/messages";
import { regressionScenarios } from "../concepts/least-squares/scenarios";
import { samplingMessages } from "../concepts/sampling-distribution/messages";
import { diagnosticsMessages } from "../concepts/regression-diagnostics/messages";
import { diagnosticScenarios } from "../concepts/regression-diagnostics/scenarios";
import { formatNumber } from "./LocaleContext";

function messageShape(value: unknown): unknown {
  if (typeof value === "function") return "function";
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).sort(([first], [second]) => first.localeCompare(second))
        .map(([key, nested]) => [key, messageShape(nested)]),
    );
  }
  return typeof value;
}

describe("localization", () => {
  it("keeps English and Dutch message structures in parity", () => {
    expect(messageShape(appMessages.nl)).toEqual(messageShape(appMessages.en));
    expect(messageShape(leastSquaresMessages.nl)).toEqual(messageShape(leastSquaresMessages.en));
    expect(messageShape(samplingMessages.nl)).toEqual(messageShape(samplingMessages.en));
    expect(messageShape(diagnosticsMessages.nl)).toEqual(messageShape(diagnosticsMessages.en));
  });

  it("provides localized metadata for every concept and regression scenario", () => {
    conceptRegistry.forEach((concept) => {
      expect(concept.copy.en.title).not.toBe("");
      expect(concept.copy.nl.title).not.toBe("");
    });
    regressionScenarios.forEach((scenario) => {
      expect(scenario.copy.en.xLabel).not.toBe("");
      expect(scenario.copy.nl.xLabel).not.toBe("");
    });
    diagnosticScenarios.forEach((scenario) => {
      expect(scenario.copy.en.xLabel).not.toBe("");
      expect(scenario.copy.nl.xLabel).not.toBe("");
    });
  });

  it("uses locale-specific decimal and thousands separators", () => {
    expect(formatNumber(1234.5, "en", 2, 2)).toBe("1,234.50");
    expect(formatNumber(1234.5, "nl", 2, 2)).toBe("1.234,50");
  });
});

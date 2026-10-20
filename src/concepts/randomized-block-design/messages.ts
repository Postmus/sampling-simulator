import type { Locale } from "../../i18n/LocaleContext";
import { clusterMessages } from "../cluster-randomization/messages";

const en = {
  ...clusterMessages.en,
  title: "Randomised blocks: treatment within hospitals",
  subtitle: "Randomise patients within each hospital. See how accounting for hospital differences improves precision.",
  allocation: "Every hospital: 10 control + 10 intervention patients",
  sampling: "Drawing patients and randomising ten per treatment within each hospital…",
  dataTitle: "1  One randomised block trial",
  dataDescription: "Each hospital contains ten control and ten intervention patients. Connected diamonds compare the two observed treatment means within each hospital.",
  pooledPatients: "Patients pooled across all six hospitals in each group.",
  plotAria: "Patient outcomes and connected treatment means within six hospitals",
  centeredPlotAria: "Hospital-centred patient outcomes and connected treatment means within six hospitals",
  centeredBoxplotAria: "Boxplots of hospital-centred patient outcomes by treatment group",
  center: "Centre within hospitals",
  rawHint: "Show the original patient outcomes, including differences between hospitals.",
  centeredHint: "Subtract each hospital’s observed mean from its patients. This changes both plots; fitted analyses and accumulated trials stay the same.",
  centeredOutcome: "Deviation from hospital mean (mmHg)", centeredBoxplotOutcome: "Deviation (mmHg)",
  displayedValue: "Displayed deviation", withinHospitalDifference: "Within-hospital treatment difference",
  analysisDescription: "Balanced allocation within every hospital gives both models the same treatment estimate. Accounting for hospital differences usually reduces its standard error.",
  methodDescription: "Hospital effects and patient residuals are independent Normal draws. Both models estimate uncertainty from the original trial, without using the generating ICC or SD. The balanced random-intercept model uses REML with a nonnegative hospital variance. Its treatment test uses a t reference with 120 − 6 − 1 = 113 degrees of freedom. Away from the zero-variance boundary, the treatment inference equals linear regression with hospital fixed effects. Centring the display does not refit either model.",
  boundary: "This trial estimates zero hospital variance. REML pools the residual variation and retains the pre-specified 113-degree-of-freedom reference.",
  repeatsDescription: "Each trial draws new hospitals and patients and randomises ten patients per treatment within each hospital. Both analyses use the same original outcomes.",
  powerNote: "Ignoring hospital differences can make the test conservative and lose power. Compare type I error under H₀ as well as power under H₁.",
};

type Messages = { [Key in keyof typeof en]: string };
const nl: Messages = {
  ...clusterMessages.nl,
  title: "Gerandomiseerde blokken: behandeling binnen ziekenhuizen",
  subtitle: "Randomiseer patiënten binnen elk ziekenhuis. Ontdek hoe rekening houden met ziekenhuisverschillen de precisie verbetert.",
  allocation: "Elk ziekenhuis: 10 controle- en 10 interventiepatiënten",
  sampling: "Trek patiënten en randomiseer er tien per behandeling binnen elk ziekenhuis…",
  dataTitle: "1  Eén gerandomiseerd blokonderzoek",
  dataDescription: "Elk ziekenhuis bevat tien controle- en tien interventiepatiënten. Verbonden ruiten vergelijken de twee waargenomen behandelgemiddelden binnen elk ziekenhuis.",
  pooledPatients: "Patiënten samengenomen uit alle zes ziekenhuizen per groep.",
  plotAria: "Patiëntuitkomsten en verbonden behandelgemiddelden binnen zes ziekenhuizen",
  centeredPlotAria: "Binnen het ziekenhuis gecentreerde patiëntuitkomsten en verbonden behandelgemiddelden",
  centeredBoxplotAria: "Boxplots van binnen het ziekenhuis gecentreerde patiëntuitkomsten per behandelgroep",
  center: "Centreer binnen ziekenhuizen",
  rawHint: "Toon de oorspronkelijke patiëntuitkomsten, inclusief verschillen tussen ziekenhuizen.",
  centeredHint: "Trek het waargenomen ziekenhuisgemiddelde af van elke patiënt. Dit verandert beide grafieken; de analyses en verzamelde onderzoeken blijven gelijk.",
  centeredOutcome: "Afwijking van ziekenhuisgemiddelde (mmHg)", centeredBoxplotOutcome: "Afwijking (mmHg)",
  displayedValue: "Getoonde afwijking", withinHospitalDifference: "Behandelverschil binnen het ziekenhuis",
  analysisDescription: "Gebalanceerde toewijzing binnen elk ziekenhuis geeft bij beide modellen dezelfde effectschatting. Rekening houden met ziekenhuisverschillen verkleint meestal de standaardfout.",
  methodDescription: "Ziekenhuiseffecten en patiëntresiduen zijn onafhankelijke normale trekkingen. Beide modellen schatten de onzekerheid uit het oorspronkelijke onderzoek, zonder de ingestelde ICC of SD te gebruiken. Het gebalanceerde random-interceptmodel gebruikt REML met een niet-negatieve ziekenhuisvariantie. De behandeltoets gebruikt een t-referentie met 120 − 6 − 1 = 113 vrijheidsgraden. Buiten de nulgrens voor de variantie komt de behandeltoets overeen met lineaire regressie met vaste ziekenhuiseffecten. Centreren van de weergave past geen van beide modellen opnieuw aan.",
  boundary: "Dit onderzoek schat de ziekenhuisvariantie op nul. REML voegt de residuele variatie samen en behoudt de vooraf gekozen referentie met 113 vrijheidsgraden.",
  repeatsDescription: "Elk onderzoek trekt nieuwe ziekenhuizen en patiënten en randomiseert tien patiënten per behandeling binnen elk ziekenhuis. Beide analyses gebruiken dezelfde oorspronkelijke uitkomsten.",
  powerNote: "Ziekenhuisverschillen negeren kan de toets conservatief maken en power kosten. Vergelijk zowel de type I-fout onder H₀ als de power onder H₁.",
};

export const blockMessages: Record<Locale, Messages> = { en, nl };

import { mean } from "../../domain/statistics";
import { formatNumber, type Locale } from "../../i18n/LocaleContext";
import { Axis, GroupBoxPlots, useChartWidth } from "../cluster-randomization/Charts";
import { blockMessages } from "./messages";
import { displayHospitals, HOSPITALS, outcomeDomain, PATIENTS_PER_HOSPITAL, type Configuration, type Trial } from "./model";

export { IntervalChart, SamplingChart } from "../cluster-randomization/Charts";

export function HospitalChart({ configuration, trial, progress, locale, centered }: {
  configuration: Configuration; trial: Trial | null; progress: number; locale: Locale; centered: boolean;
}) {
  const { ref, width } = useChartWidth();
  const m = blockMessages[locale];
  const displayed = trial ? displayHospitals(trial, centered) : [];
  const domain = outcomeDomain(configuration, trial, centered);
  const left = 150, right = width - 28;
  const x = (value: number) => left + (right - left) * (value - domain[0]) / (domain[1] - domain[0]);
  const label = centered ? m.centeredPlotAria : m.plotAria;
  return <div className="cluster-chart-scroll cluster-hospital-chart" tabIndex={0} role="region" aria-label={label}><div className="cluster-chart" ref={ref}>
    <svg viewBox={`0 0 ${width} 440`} role="img" aria-label={label} data-chart="hospitals" data-centered={centered} data-axis-min={domain[0]} data-axis-max={domain[1]}>
      {centered && <line className="cluster-zero-line" x1={x(0)} x2={x(0)} y1={20} y2={365} />}
      {Array.from({ length: HOSPITALS }, (_, id) => {
        const hospital = displayed[id];
        const y = 52 + id * 57;
        const controlMean = hospital ? mean(hospital.patients.filter((patient) => !patient.treated).map((patient) => patient.outcome)) : 0;
        const treatmentMean = hospital ? mean(hospital.patients.filter((patient) => patient.treated).map((patient) => patient.outcome)) : 0;
        return <g key={id} data-hospital={id + 1}>
          <rect className="cluster-row" x={0} y={y - 25} width={width} height={51} rx={8} />
          {centered && <line className="cluster-zero-line" x1={x(0)} x2={x(0)} y1={y - 25} y2={y + 26} />}
          <text className="cluster-hospital-label" x={12} y={y + 5}>{m.hospital} {id + 1}</text>
          {[-10, 10].map((offset) => <line key={offset} className="cluster-row-guide" x1={left} x2={right} y1={y + offset} y2={y + offset} />)}
          {hospital?.patients.map((patient) => {
            const fraction = Math.max(0, Math.min(1, progress * (HOSPITALS * PATIENTS_PER_HOSPITAL + 12) - (id * PATIENTS_PER_HOSPITAL + patient.id)));
            const jitter = Math.sin((id + 1) * 41 + patient.id * 17.3) * 5;
            const raw = trial!.hospitals[id].patients.find((original) => original.id === patient.id)!.outcome;
            return <circle key={patient.id} className={`cluster-patient ${patient.treated ? "intervention" : "control"}`} cx={x(patient.outcome)} cy={y + (patient.treated ? 10 : -10) + jitter}
              r={4.5} opacity={fraction * 0.82} data-patient={patient.id} data-treatment={patient.treated ? "intervention" : "control"} data-outcome={raw} data-display-value={patient.outcome}>
              <title>{m.hospital} {id + 1}, {m.patient} {patient.id + 1}: {formatNumber(raw, locale, 1)} mmHg{centered ? `; ${m.displayedValue}: ${formatNumber(patient.outcome, locale, 1)} mmHg` : ""}</title>
            </circle>;
          })}
          {hospital && progress === 1 && <>
            <line className="block-mean-connector" x1={x(controlMean)} x2={x(treatmentMean)} y1={y - 10} y2={y + 10} data-difference={treatmentMean - controlMean}>
              <title>{m.withinHospitalDifference}: {formatNumber(treatmentMean - controlMean, locale, 2)} mmHg</title>
            </line>
            {[false, true].map((treated) => {
              const value = treated ? treatmentMean : controlMean;
              const markerY = y + (treated ? 10 : -10);
              const group = treated ? "intervention" : "control";
              return <path key={group} className={`block-within-mean ${group}`} data-mean={value} data-treatment={group}
                d={`M${x(value)},${markerY - 6} l6,6 l-6,6 l-6,-6 Z`}>
                <title>{m[group]} · {m.observedMean}: {formatNumber(value, locale, 2)} mmHg</title>
              </path>;
            })}
          </>}
        </g>;
      })}
      <Axis domain={domain} left={left} right={right} y={375} label={centered ? m.centeredOutcome : m.outcome} locale={locale} />
    </svg>
  </div></div>;
}

export function TreatmentBoxPlots({ configuration, trial, progress, locale, centered }: {
  configuration: Configuration; trial: Trial | null; progress: number; locale: Locale; centered: boolean;
}) {
  const m = blockMessages[locale];
  const patients = trial && progress === 1 ? displayHospitals(trial, centered).flatMap((hospital) => hospital.patients) : [];
  const groups = {
    control: patients.filter((patient) => !patient.treated).map((patient) => patient.outcome),
    intervention: patients.filter((patient) => patient.treated).map((patient) => patient.outcome),
  };
  return <GroupBoxPlots groups={groups} domain={outcomeDomain(configuration, trial, centered)} locale={locale}
    axisLabel={centered ? m.centeredBoxplotOutcome : m.boxplotOutcome} ariaLabel={centered ? m.centeredBoxplotAria : m.boxplotAria} />;
}

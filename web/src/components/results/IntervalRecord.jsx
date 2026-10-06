import { Badge } from "../ui/index.js";
import { confidenceState, labelTone, ruleName, ruleShort } from "../../data/classification.js";
import { dominantMineral, mineralColour, mineralLabel } from "../../data/minerals.js";
import styles from "./IntervalRecord.module.css";

export function ErrorBadge({ interval }) {
 const flag = confidenceState(interval.confidence_error, interval.final_mask);
 return <Badge tone={flag.state} icon={flag.icon}>{flag.text}{interval.confidence_error != null ? ", Error "+Number(interval.confidence_error).toFixed(1) : ", Error unavailable"}</Badge>;
}
export function RecordDetails({ interval }) {
 return <details className={styles.details}><summary>Full interval record</summary>
   <dl><div><dt>Classifier rule</dt><dd>{interval.rule_fired}: {ruleName(interval.rule_fired)}</dd></div>
     <div><dt>Reason</dt><dd>{interval.reason || "No reason returned"}</dd></div>
     <div><dt>API confidence</dt><dd>{interval.confidence ?? "Unavailable"}</dd></div>
     <div><dt>Error</dt><dd>{interval.confidence_error ?? "Error unavailable"}</dd></div>
     <div><dt>Final Mask</dt><dd>{interval.final_mask === false ? "Excluded" : interval.final_mask === true ? "Included" : "Unavailable"}</dd></div></dl>
   <p className={styles.mineralTitle}>All returned minerals</p>
   {interval.minerals?.length ? <ul className={styles.minerals}>{interval.minerals.map((mineral,index)=><li key={mineral.name+"-"+index}>
     <span className={styles.swatch} style={{background:mineralColour(mineral.name)}}/>{mineralLabel(mineral.name)}
     <span className={styles.rawName}>{mineral.name}</span><strong>{Number(mineral.percentage).toFixed(2)}%</strong></li>)}</ul> : <p>No mineral data returned.</p>}
 </details>;
}
export default function IntervalRecord({ interval, selected, onSelect }) {
 const dominant=dominantMineral(interval.minerals);
 return <div className={styles.record}>
   <div className={styles.head}><button type="button" onClick={onSelect} className={styles.depth} aria-pressed={selected}>
     {interval.depth_from_m} <span>to</span> {interval.depth_to_m} m</button>
     <Badge tone={labelTone(interval.label)}>{interval.label}</Badge></div>
   <div className={styles.rule}><span className={styles.ruleId}>{ruleShort(interval.rule_fired)}</span><span>{ruleName(interval.rule_fired)}</span><ErrorBadge interval={interval}/></div>
   <p className={styles.reason}>{interval.reason || "No reason returned"}</p>
   {dominant ? <p className={styles.dominant}><span className={styles.swatch} style={{background:mineralColour(dominant.name)}}/>
     {mineralLabel(dominant.name)} dominant <strong>{Number(dominant.percentage).toFixed(1)}%</strong></p> : <p className={styles.dominant}>No dominant mineral data</p>}
   <RecordDetails interval={interval}/>
 </div>;
}

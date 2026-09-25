import { LABELS, RULES, ruleName, ruleShort } from "../../data/classification.js";
import { labelColours } from "../../styles/theme.js";
import styles from "./RuleStrip.module.css";

/* Segments narrower than this share of the visible depth range hide their
   rule text, which would not fit. */
const MIN_WIDTH_FOR_TEXT = 4;

/*
  What the classifier decided, along depth, under the mineral timeline.

  One segment per interval, coloured by the label the classifier gave it, with
  the rule that fired (R1 to R5) written on it. Colour is not the only cue: the
  rule text is on every segment that is wide enough, and Unclassified is
  hatched rather than a fourth flat colour. A key underneath names the four
  labels and spells out the five rules, so it can be read without knowing the
  classifier.

  It is plain markup, not a second chart, so it lines up with the timeline's
  plot area by using the same left and right margins, and it follows the
  timeline's zoom through `from` and `to`, the visible depth range.
*/
export default function RuleStrip({ intervals, from, to, activeFrom }) {
  const span = to - from;
  if (!(span > 0) || intervals.length === 0) return null;

  const placed = intervals
    .map((interval) => {
      const start = Math.max(interval.depth_from_m, from);
      const end = Math.min(interval.depth_to_m, to);
      if (end <= start) return null;
      return {
        interval,
        left: ((start - from) / span) * 100,
        width: ((end - start) / span) * 100,
      };
    })
    .filter(Boolean);

  const summary = (interval) =>
    `${interval.depth_from_m} to ${interval.depth_to_m} m. ${interval.label}, ${ruleShort(
      interval.rule_fired
    )} ${ruleName(interval.rule_fired)}.`;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.rowLabel}>Rule</span>
        <div className={styles.strip}>
          {placed.map(({ interval, left, width }) => {
            const unclassified = interval.label === "Unclassified";
            return (
              <div
                key={interval.depth_from_m}
                className={[
                  styles.segment,
                  unclassified ? styles.unclassified : "",
                  interval.depth_from_m === activeFrom ? styles.active : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: unclassified ? undefined : labelColours[interval.label],
                }}
                title={summary(interval)}
              >
                {width >= MIN_WIDTH_FOR_TEXT && ruleShort(interval.rule_fired)}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.key}>
        {Object.keys(LABELS).map((label) => (
          <span key={label} className={styles.keyItem}>
            <span
              className={`${styles.swatch} ${label === "Unclassified" ? styles.unclassified : ""}`}
              style={label === "Unclassified" ? undefined : { background: labelColours[label] }}
            />
            {label}
          </span>
        ))}
        <span className={styles.codes}>
          {Object.values(RULES)
            .map((rule) => `${rule.short} ${rule.name}`)
            .join("  \u00b7  ")}
        </span>
      </div>
    </div>
  );
}

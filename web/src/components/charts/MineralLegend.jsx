import { MINERAL_ORDER, mineralColour, mineralLabel } from "../../data/minerals.js";
import styles from "./MineralLegend.module.css";
export default function MineralLegend({ compact = false }) {
  return <div className={`${styles.legend} ${compact ? styles.compact : ""}`} aria-label="Mineral colour legend">
    {MINERAL_ORDER.map(name => <span className={styles.item} key={name}>
      <span className={styles.swatch} style={{background: mineralColour(name)}} aria-hidden="true" />{mineralLabel(name)}
    </span>)}</div>;
}

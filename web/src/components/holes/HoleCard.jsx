import { Card, Icon } from "../ui/index.js";
import styles from "./HoleCard.module.css";

/*
  One drill hole, as a card.

  Purely presentational: it takes a hole object shaped the way the API returns
  it and knows nothing about where that object came from. Task 9 can hand it
  live rows without touching this file.

  variant "full"    the grid card on the Hole Explorer
  variant "compact" the one line row in the selection rail
*/
export default function HoleCard({ hole, variant = "full", selected = false, onSelect }) {
  const interactive = typeof onSelect === "function";

  const shared = {
    as: interactive ? "button" : "div",
    interactive,
    selected,
    padding: variant === "compact" ? "compact" : "padded",
    onClick: interactive ? () => onSelect(hole) : undefined,
    "aria-pressed": interactive ? selected : undefined,
  };

  if (variant === "compact") {
    return (
      <Card {...shared}>
        <div className={styles.compactRow}>
          <span className={styles.id}>{hole.hole_id}</span>
          <span className={styles.compactMeta}>
            {hole.intervals_classified} intervals
          </span>
        </div>
        <p className={styles.region}>{hole.region}</p>
      </Card>
    );
  }

  return (
    <Card {...shared}>
      <div className={styles.card}>
        <div className={styles.top}>
          <div>
            <p className={styles.id}>{hole.hole_id}</p>
            <p className={styles.region}>{hole.region}</p>
          </div>
          <Icon name="chevronRight" size={18} className={styles.chevron} />
        </div>

        <div className={styles.facts}>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Depth</span>
            <span className={styles.factValue}>{hole.total_depth_m} m</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Intervals</span>
            <span className={styles.factValue}>{hole.intervals_classified}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Latitude</span>
            <span className={styles.factValue}>{hole.latitude.toFixed(3)}</span>
          </div>
          <div className={styles.fact}>
            <span className={styles.factLabel}>Longitude</span>
            <span className={styles.factValue}>{hole.longitude.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

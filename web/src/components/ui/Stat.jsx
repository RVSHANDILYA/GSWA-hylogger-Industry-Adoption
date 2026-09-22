import styles from "./Stat.module.css";

/* A single figure with its label. Used on the landing page and above the
   interval list, where a chart would be more machinery than the number
   deserves. */
export default function Stat({ value, unit, label, note }) {
  return (
    <div className={styles.stat}>
      <p className={styles.value}>
        {value}
        {unit && <span className={styles.unit}>{unit}</span>}
      </p>
      <p className={styles.label}>{label}</p>
      {note && <p className={styles.note}>{note}</p>}
    </div>
  );
}

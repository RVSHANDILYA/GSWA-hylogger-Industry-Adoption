import Icon from "./Icon.jsx";
import styles from "./Badge.module.css";

/*
  A small labelled chip.

  Tones cover the four classifier labels (ore, altered, waste, unclassified),
  the three status states (good, caution, problem) plus neutral and accent.

  Colour is never the only signal here. A tone always arrives with its text,
  and the status tones additionally carry an icon, so the chip still reads
  correctly in greyscale or with any form of colour vision deficiency.
*/
export default function Badge({
  children,
  tone = "neutral",
  icon,
  mono = false,
  className = "",
  ...rest
}) {
  const classes = [styles.badge, styles[tone], mono && styles.mono, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes} {...rest}>
      {icon ? (
        <Icon name={icon} size={13} className={styles.glyph} strokeWidth={2} />
      ) : (
        <span className={styles.dot} />
      )}
      {children}
    </span>
  );
}

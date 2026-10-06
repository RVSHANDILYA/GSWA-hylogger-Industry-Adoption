import Icon from "./Icon.jsx";
import styles from "./Feedback.module.css";

/*
  The three "nothing to show yet" states, kept together so they stay
  consistent with each other.

  API requests use Loading and StateMessage so a pending request or a failed
  connection always has an explicit, readable state.
*/

export function Spinner({ size = 18, label = "Loading" }) {
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size }}
      role="status"
      aria-label={label}
    />
  );
}

export function Skeleton({ width = "100%", height = "1rem", radius, style, ...rest }) {
  return (
    <span
      className={styles.skeleton}
      style={{ width, height, borderRadius: radius, display: "block", ...style }}
      aria-hidden="true"
      {...rest}
    />
  );
}

export function Loading({ children = "Loading" }) {
  return (
    <div className={styles.loadingRow}>
      <Spinner />
      <span>{children}</span>
    </div>
  );
}

/*
  Empty and error states. `tone="problem"` turns the icon red for a genuine
  failure, the default neutral tone is for "there is simply nothing here".
*/
export function StateMessage({
  icon = "info",
  title,
  children,
  action,
  tone = "neutral",
}) {
  return (
    <div className={`${styles.state} ${tone === "problem" ? styles.problem : ""}`.trim()}>
      <span className={styles.stateIcon}>
        <Icon name={icon} size={20} />
      </span>
      <p className={styles.stateTitle}>{title}</p>
      {children && <p className={styles.stateBody}>{children}</p>}
      {action && <div className={styles.stateAction}>{action}</div>}
    </div>
  );
}

import Icon from "./Icon.jsx";
import styles from "./Notice.module.css";

/*
  A dashed panel that says "this part is scaffolding, not finished work".

  It exists so the placeholder sections of the skeleton are obviously
  placeholder to anyone demoing the site, including the client. Delete the
  Notice when the real thing lands, do not let one quietly ship.
*/
export default function Notice({ title, children }) {
  return (
    <div className={styles.notice}>
      <Icon name="info" size={17} className={styles.icon} />
      <div>
        <span className={styles.title}>{title}</span>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}

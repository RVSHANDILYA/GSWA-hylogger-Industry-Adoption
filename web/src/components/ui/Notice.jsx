import Icon from "./Icon.jsx";
import styles from "./Notice.module.css";
export default function Notice({ title, children }) {
  return <div className={styles.notice}><Icon name="info" size={17} className={styles.icon} />
    <div><span className={styles.title}>{title}</span><div className={styles.body}>{children}</div></div></div>;
}

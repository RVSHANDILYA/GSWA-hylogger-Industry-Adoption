import Logo from "./Logo.jsx";
import styles from "./Brand.module.css";

export default function Brand() {
  return <span className={styles.lockup}>
    <Logo size={32} />
    <span className={styles.name}>CoreSense</span>
    <span className={styles.divider} aria-hidden="true" />
    <span className={styles.product}>HyLogger</span>
  </span>;
}

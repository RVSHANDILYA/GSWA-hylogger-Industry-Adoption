import styles from "./PageHeader.module.css";

/* Every page except the landing page opens with this, so the pages read as
   one site rather than four separate experiments. */
export default function PageHeader({ eyebrow, title, lede, meta }) {
  return (
    <header className={styles.header}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className={styles.title}>{title}</h1>
      {lede && <p className={styles.lede}>{lede}</p>}
      {meta && <div className={styles.meta}>{meta}</div>}
    </header>
  );
}

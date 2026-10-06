import { useState } from "react";
import styles from "./CorePoster.module.css";

export default function CorePoster({ className = "" }) {
  const [failed, setFailed] = useState(false);
  return <div className={`${styles.frame} ${className}`}>
    {import.meta.env.VITE_HAS_HERO_POSTER && !failed ?
      <img src={import.meta.env.BASE_URL + "hero-poster.png"}
        alt="Preview of the 05GJD001 drill core walkthrough" onError={() => setFailed(true)} /> :
      // TODO: Add the supplied public/hero-poster.png, then restart Vite or rebuild.
      <div className={styles.placeholder} role="img" aria-label="Drill core walkthrough preview not yet available">
        <span className="eyebrow">05GJD001 / Core walkthrough</span>
        <p>A closer look at the core.</p>
        <span>Explore the measured intervals while the film is prepared.</span>
      </div>}
  </div>;
}

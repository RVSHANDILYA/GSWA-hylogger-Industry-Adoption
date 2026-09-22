import { Link } from "react-router-dom";
import { chart } from "../../styles/theme.js";
import { NAV_ITEMS } from "./navItems.js";
import styles from "./Footer.module.css";

/* The colour strip repeats the five mineral slots, so the palette is stated
   once at the bottom of every page rather than only inside a chart legend. */
function MineralStrip() {
  return (
    <div className={styles.strip} aria-hidden="true">
      {chart.series.map((colour) => (
        <span key={colour} style={{ background: colour }} />
      ))}
      <span style={{ background: chart.other }} />
    </div>
  );
}

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <MineralStrip />
      <div className={styles.inner}>
        <div className={styles.block}>
          <span className={styles.heading}>GSWA HyLogger</span>
          <p>
            CITS5553 Data Science Capstone Project
            <br />
            Group 6, Data Wranglers, Semester 2 2026
          </p>
        </div>

        <div className={styles.block}>
          <span className={styles.heading}>Pages</span>
          <div className={styles.links}>
            {NAV_ITEMS.map((item) => (
              <Link key={item.to} to={item.to}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className={styles.block}>
          <span className={styles.heading}>Data source</span>
          <p>
            National Virtual Core Library, via the Geological Survey of
            <br />
            Western Australia. Open data, no licence fee.
          </p>
        </div>
      </div>
    </footer>
  );
}

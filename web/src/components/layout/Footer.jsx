import { Link } from "react-router-dom";
import Brand from "./Brand.jsx";
import { NAV_ITEMS } from "./navItems.js";
import styles from "./Footer.module.css";

export default function Footer() {
  return <footer className={styles.footer}>
    <div className={styles.inner}>
      <div className={styles.brand}>
        <Link to="/" aria-label="CoreSense | HyLogger home"><Brand /></Link>
        <p>Western Australia / Core intelligence</p>
      </div>
      <div className={styles.block}><span className="eyebrow">Explore</span>
        {NAV_ITEMS.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}
      </div>
      <div className={styles.block}><span className="eyebrow">Data sources</span>
        <a href="https://www.auscope.org.au/nvcl" target="_blank" rel="noreferrer">National Virtual Core Library</a>
        <a href="https://www.dmpe.wa.gov.au" target="_blank" rel="noreferrer">Geological Survey of Western Australia</a>
      </div>
      <div className={styles.block}><span className="eyebrow">The project</span>
        <a href="https://github.com/RVSHANDILYA/GSWA-hylogger-Industry-Adoption" target="_blank" rel="noreferrer">Project repository</a>
        <p>Group 6 / Data Wranglers<br />CITS5553<br />The University of Western Australia</p>
      </div>
    </div>
    <div className={styles.bottom}><span>CoreSense | HyLogger / 2026</span>
      <span>Research aid. Provisional rules. Expert interpretation required.</span></div>
  </footer>;
}

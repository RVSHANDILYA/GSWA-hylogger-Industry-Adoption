import { Link } from "react-router-dom";
import Logo from "./Logo.jsx";
import { NAV_ITEMS } from "./navItems.js";
import styles from "./Footer.module.css";
export default function Footer() {
  return <footer className={styles.footer}><div className={styles.inner}>
    <div className={styles.brand}><Logo size={34} /><div><strong>HyLogger.</strong><p>Open core. Clearer understanding.</p></div></div>
    <div className={styles.block}><span className="eyebrow">Explore</span><div className={styles.links}>
      {NAV_ITEMS.map(item => <Link key={item.to} to={item.to}>{item.label}</Link>)}</div></div>
    <div className={styles.block}><span className="eyebrow">Built on open science</span>
      <a href="https://www.auscope.org.au/nvcl" target="_blank" rel="noreferrer">National Virtual Core Library</a>
      <a href="https://www.dmpe.wa.gov.au" target="_blank" rel="noreferrer">Geological Survey of Western Australia</a>
      <p>Group 6 / Data Wranglers<br />CITS5553 / The University of Western Australia</p></div>
  </div><div className={styles.bottom}><span>GSWA HyLogger Industry Adoption / 2026</span>
    <span>Research aid. Provisional rules. Expert interpretation required.</span></div></footer>;
}

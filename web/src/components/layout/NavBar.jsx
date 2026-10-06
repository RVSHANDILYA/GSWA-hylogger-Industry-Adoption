import { Link, NavLink } from "react-router-dom";
import Logo from "./Logo.jsx";
import { NAV_ITEMS } from "./navItems.js";
import Icon from "../ui/Icon.jsx";
import styles from "./NavBar.module.css";
export default function NavBar() {
  return <header className={styles.nav}><nav className={styles.inner} aria-label="Primary">
    <Link to="/" className={styles.brand}><Logo size={36} /><span className={styles.brandText}>
      <span className={styles.brandName}>HyLogger<span className={styles.brandDot}>.</span></span>
      <span className={styles.brandSub}>Western Australia / Core intelligence</span></span></Link>
    <div className={styles.links}>{NAV_ITEMS.map(item => <NavLink key={item.to} to={item.to} end={item.end}
      className={({isActive}) => `${styles.link} ${isActive ? styles.active : ""}`}>{item.label}</NavLink>)}</div>
    <a className={styles.cta} href="https://github.com/RVSHANDILYA/GSWA-hylogger-Industry-Adoption" target="_blank" rel="noreferrer">
      Project repository <Icon name="arrowUpRight" size={16} /></a>
  </nav></header>;
}

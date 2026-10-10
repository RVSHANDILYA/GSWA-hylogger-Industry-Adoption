import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Brand from "./Brand.jsx";
import { NAV_ITEMS } from "./navItems.js";
import Icon from "../ui/Icon.jsx";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import { easeOut } from "../../styles/theme.js";
import styles from "./NavBar.module.css";

const repository = "https://github.com/RVSHANDILYA/GSWA-hylogger-Industry-Adoption";
const subscribeScroll = listener => {
  window.addEventListener("scroll", listener, {passive:true});
  return () => window.removeEventListener("scroll", listener);
};
const hasScrolled = () => window.scrollY > 8;
const subscribeCompact = listener => {
  const media = window.matchMedia("(max-width: 899px)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
};
const isCompact = () => window.matchMedia("(max-width: 899px)").matches;
const serverSnapshot = () => false;

export default function NavBar() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef(null);
  const buttonRef = useRef(null);
  const reduced = useMotionPreference();
  const scrolled = useSyncExternalStore(subscribeScroll, hasScrolled, serverSnapshot);
  const compact = useSyncExternalStore(subscribeCompact, isCompact, serverSnapshot);

  useEffect(() => {
    if (!open) return undefined;
    const dismiss = event => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const outside = event => {
      if (!headerRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  return <motion.header ref={headerRef} className={styles.nav} initial={false}
    animate={{boxShadow:scrolled ? "0 4px 16px rgba(23,43,37,0.06)" : "0 0px 0px rgba(23,43,37,0)"}}
    transition={{duration:reduced ? 0 : .2}}>
    <nav className={styles.inner} aria-label="Primary">
      <Link to="/" className={styles.brand} aria-label="CoreSense | HyLogger home" onClick={() => setOpen(false)}><Brand /></Link>
      <button ref={buttonRef} className={styles.menuButton} type="button" aria-expanded={open}
        aria-controls="primary-links" aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        onClick={() => setOpen(value => !value)}>
        {open ? <Icon name="x" size={22} /> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg>}
        <span>Menu</span>
      </button>
      <motion.div id="primary-links" className={styles.links} hidden={compact && !open} initial={false}
        animate={{opacity:compact && !open ? 0 : 1, y:compact && !open ? -6 : 0}}
        transition={{duration:reduced ? 0 : .2, ease:easeOut}}>
        {NAV_ITEMS.map(item => <NavLink key={item.to} to={item.to} end={item.end}
          onClick={() => setOpen(false)} className={({isActive}) => `${styles.link} ${isActive ? styles.active : ""}`}>
          {({isActive}) => <>{item.label}<motion.span className={styles.underline} aria-hidden="true"
            initial={false} animate={{scaleX:isActive ? 1 : 0}} transition={{duration:reduced ? 0 : .2, ease:easeOut}} /></>}
        </NavLink>)}
        <a className={styles.mobileRepository} href={repository} target="_blank" rel="noreferrer">
          Project repository <Icon name="arrowUpRight" size={17} /></a>
      </motion.div>
      <a className={styles.repository} href={repository} target="_blank" rel="noreferrer">
        Project repository <Icon name="arrowUpRight" size={17} /></a>
    </nav>
  </motion.header>;
}

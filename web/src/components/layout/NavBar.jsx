import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "./Logo.jsx";
import { NAV_ITEMS } from "./navItems.js";
import { Button } from "../ui/index.js";
import styles from "./NavBar.module.css";

export default function NavBar() {
  return (
    <header className={styles.nav}>
      <nav className={styles.inner} aria-label="Primary">
        <Link to="/" className={styles.brand}>
          <Logo size={30} />
          <span className={styles.brandText}>
            <span className={styles.brandName}>HyLogger</span>
            <span className={styles.brandSub}>GSWA industry adoption</span>
          </span>
        </Link>

        <div className={styles.links}>
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.active : ""}`.trim()
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className={styles.pill}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className={styles.label}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* Points out of the site rather than repeating a nav item. Handy in
            a demo when someone asks where the code lives. */}
        <Button
          href="https://github.com/RVSHANDILYA/GSWA-hylogger-Industry-Adoption"
          size="sm"
          variant="secondary"
          className={styles.cta}
          target="_blank"
          rel="noreferrer"
        >
          Repository
        </Button>
      </nav>
    </header>
  );
}

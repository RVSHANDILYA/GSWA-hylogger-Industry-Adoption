import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";
import AnimatedOutlet from "./AnimatedOutlet.jsx";
import styles from "./Layout.module.css";

/*
  The frame every route renders inside: one nav bar, one footer, one content
  width. Routes render into AnimatedOutlet, which handles the transition
  between them.
*/
export default function Layout() {
  const { pathname } = useLocation();

  /* Land at the top of a new page rather than halfway down it, which is
     where the browser leaves you after a client side navigation. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <NavBar />
      <main id="main" className={styles.main}>
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  );
}

/* Standard page width. Import this next to PageTransition when building a new
   page so it lines up with the others. */
export function Container({ children, bleed = false, className = "" }) {
  const classes = [styles.container, bleed && styles.bleed, className]
    .filter(Boolean)
    .join(" ");
  return <div className={classes}>{children}</div>;
}

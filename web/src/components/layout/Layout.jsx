import { Suspense, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NavBar from "./NavBar.jsx";
import Footer from "./Footer.jsx";
import AnimatedOutlet from "./AnimatedOutlet.jsx";
import DataSourceBanner from "./DataSourceBanner.jsx";
import { Loading } from "../ui/index.js";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import styles from "./Layout.module.css";

const PAGE_NAMES = { "/": "", "/explorer": "Hole Explorer", "/results": "Results", "/about": "About" };

/*
  The frame every route renders inside: one nav bar, one footer, one content
  width. Routes render into AnimatedOutlet, which handles the transition
  between them.
*/
export default function Layout() {
  const { pathname, search, hash } = useLocation();
  const reduced = useMotionPreference();
  const pagePath = pathname.replace(/\/+$/, "") || "/";
  const holeId = new URLSearchParams(search).get("hole");
  const pageName = pagePath === "/results" && holeId
    ? `${holeId} Results`
    : PAGE_NAMES[pagePath] ?? "Page not found";

  useEffect(() => {
    document.title = pageName ? `${pageName} | CoreSense | HyLogger` : "CoreSense | HyLogger";
  }, [pageName]);

  /* Land at the top of a new page rather than halfway down it, which is
     where the browser leaves you after a client side navigation. */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  useEffect(() => {
    if (!hash) return undefined;
    const scroll = () => {
      const target = document.getElementById(hash.slice(1));
      if (!target) return false;
      target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
      return true;
    };
    if (scroll()) return undefined;
    // Lazy pages may not have mounted their anchored section yet.
    const observer = new MutationObserver(() => { if (scroll()) observer.disconnect(); });
    observer.observe(document.getElementById("main"), { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [pathname, hash, reduced]);

  return (
    <div className={styles.shell}>
      <Link to={{ pathname, search, hash: "#main" }} className={styles.skipLink}>
        Skip to content
      </Link>
      <NavBar />
      <DataSourceBanner />
      <main id="main" className={styles.main} tabIndex={-1}>
        <Suspense fallback={<div className={styles.container} style={{paddingBlock: "60px", minHeight: "60vh"}}><Loading>Opening the workspace</Loading></div>}>
          <AnimatedOutlet />
        </Suspense>
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

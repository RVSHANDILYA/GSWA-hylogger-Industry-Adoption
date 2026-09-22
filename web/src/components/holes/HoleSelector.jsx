import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import HoleCard from "./HoleCard.jsx";
import { SearchField, Skeleton, StateMessage, Button } from "../ui/index.js";
import { easeOut } from "../../styles/theme.js";
import styles from "./HoleSelector.module.css";

/*
  Search plus an animated list of holes.

  Both the Hole Explorer and the Classification page pick a hole, so they use
  this one component rather than each growing their own. If you need a
  different shape of list, add a variant here, do not copy the file.

  variant "grid" the card grid on the Hole Explorer
  variant "rail" the narrow column beside the Classification results

  It takes `holes`, `loading` and `error` as props and does no fetching of its
  own, so it works the same whether the rows came from the placeholder module
  or from the API.
*/
export default function HoleSelector({
  holes = [],
  loading = false,
  error = null,
  onRetry,
  selectedHoleId = null,
  onSelect,
  variant = "grid",
  searchPlaceholder = "Search by hole ID or region",
  emptyHint = "No holes match that search.",
}) {
  const [query, setQuery] = useState("");
  const reduceMotion = useReducedMotion();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return holes;
    return holes.filter(
      (hole) =>
        hole.hole_id.toLowerCase().includes(needle) ||
        hole.region.toLowerCase().includes(needle)
    );
  }, [holes, query]);

  if (error) {
    return (
      <StateMessage
        icon="plug"
        tone="problem"
        title="Could not load the hole list"
        action={
          onRetry ? (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              Try again
            </Button>
          ) : null
        }
      >
        {error}
      </StateMessage>
    );
  }

  if (loading) {
    return (
      <ul className={variant === "rail" ? styles.rail : styles.grid}>
        {Array.from({ length: variant === "rail" ? 5 : 6 }).map((_, index) => (
          <li key={index} className={styles.skeletonCard}>
            <Skeleton width="55%" height="1.1rem" />
            <Skeleton width="38%" height="0.8rem" />
            <Skeleton width="100%" height="2.6rem" style={{ marginTop: "auto" }} />
          </li>
        ))}
      </ul>
    );
  }

  /* Stagger only on the first paint of a list. Re-staggering on every
     keystroke makes typing feel laggy, so filtering uses a plain fade. */
  const listVariants = {
    hidden: {},
    shown: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.045 },
    },
  };

  const itemVariants = reduceMotion
    ? { hidden: { opacity: 0 }, shown: { opacity: 1 }, gone: { opacity: 0 } }
    : {
        hidden: { opacity: 0, y: 14 },
        shown: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut } },
        gone: { opacity: 0, scale: 0.97, transition: { duration: 0.16, ease: easeOut } },
      };

  return (
    <div>
      <div className={styles.toolbar}>
        <SearchField
          id={`hole-search-${variant}`}
          value={query}
          onChange={setQuery}
          placeholder={searchPlaceholder}
          label="Search holes"
        />
        <p className={styles.count} aria-live="polite">
          {filtered.length} of {holes.length} holes
        </p>
      </div>

      {filtered.length === 0 ? (
        <StateMessage icon="search" title="Nothing found">
          {emptyHint}
        </StateMessage>
      ) : (
        <motion.ul
          className={variant === "rail" ? styles.rail : styles.grid}
          variants={listVariants}
          initial="hidden"
          animate="shown"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {filtered.map((hole) => (
              <motion.li
                key={hole.hole_id}
                className={styles.item}
                layout={!reduceMotion}
                variants={itemVariants}
                exit="gone"
              >
                <HoleCard
                  hole={hole}
                  variant={variant === "rail" ? "compact" : "full"}
                  selected={hole.hole_id === selectedHoleId}
                  onSelect={onSelect}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  );
}

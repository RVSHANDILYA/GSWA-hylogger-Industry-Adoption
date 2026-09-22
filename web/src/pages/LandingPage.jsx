import { Link } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Button, Card, Icon, Stat } from "../components/ui/index.js";
import { chart, easeOut } from "../styles/theme.js";
import { PROJECT_FIGURES } from "../data/placeholderData.js";
import styles from "./LandingPage.module.css";

/* The pipeline as the client sees it, left to right. Each step matches a real
   folder in the repository, so this doubles as a map of the codebase. */
const PIPELINE = [
  { name: "NVCL", note: "6,200 open drill holes, pulled with nvcl-kit" },
  { name: "ETL", note: "Final Mask filter, scans converted to percentages" },
  { name: "PostgreSQL", note: "Holes, intervals, classifications, validation" },
  { name: "Classifier", note: "Five SWIR rules, confidence judged on Error" },
  { name: "FastAPI", note: "Holes and intervals served over REST" },
  { name: "This site", note: "Explore a hole and read what the rules found" },
];

const ROUTES = [
  {
    to: "/explorer",
    icon: "core",
    name: "Hole Explorer",
    note: "Browse the processed holes, search by ID or region, and open one to see how deep it goes and how many intervals were classified.",
    cta: "Browse the holes",
  },
  {
    to: "/results",
    icon: "chart",
    name: "Classification results",
    note: "For a chosen hole, see which of the five rules fired at each depth, what the rock is made of, and how far each reading sits inside the error gate.",
    cta: "See the results view",
  },
  {
    to: "/about",
    icon: "info",
    name: "About the project",
    note: "What the HyLogger measures, what our classifier can and cannot tell you yet, and the questions still open with the client.",
    cta: "Read the background",
  },
];

/* A short section of core, banded with the five mineral colours. The bands
   grow downward on load, which is the same direction a hole is drilled. */
function CoreStrip() {
  const reduceMotion = useReducedMotion();
  const bands = [
    { colour: chart.series[0], height: 84 },
    { colour: chart.series[2], height: 46 },
    { colour: chart.series[1], height: 62 },
    { colour: chart.other, height: 28 },
    { colour: chart.series[3], height: 54 },
    { colour: chart.series[4], height: 38 },
    { colour: chart.series[0], height: 70 },
  ];

  return (
    <motion.div
      className={styles.core}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.25, ease: easeOut }}
      aria-hidden="true"
    >
      <div className={styles.coreCap} />
      <div className={styles.coreBody}>
        {bands.map((band, index) => (
          <motion.div
            key={index}
            className={styles.coreBand}
            style={{ background: band.colour }}
            initial={{ height: reduceMotion ? band.height : 0 }}
            animate={{ height: band.height }}
            transition={{
              duration: 0.45,
              delay: 0.35 + index * 0.07,
              ease: easeOut,
            }}
          />
        ))}
      </div>
      <div className={styles.coreFoot} />
      <div className={styles.coreScale}>
        <span>0 m</span>
        <span>382 m</span>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const reduceMotion = useReducedMotion();

  /* One shared rise used by every element in the hero, delayed down the
     column so the page assembles rather than appearing all at once. */
  const rise = (delay) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: easeOut },
  });

  /* The washes drift slowly and forever. Held still for reduced motion. */
  const drift = reduceMotion
    ? {}
    : {
        animate: { x: [0, 26, -14, 0], y: [0, -18, 12, 0] },
        transition: { duration: 26, repeat: Infinity, ease: "easeInOut" },
      };

  return (
    <PageTransition>
      <section className={styles.hero}>
        <motion.div
          className={`${styles.wash} ${styles.washWarm}`}
          {...drift}
          aria-hidden="true"
        />
        <motion.div
          className={`${styles.wash} ${styles.washCool}`}
          {...drift}
          transition={
            reduceMotion ? undefined : { duration: 32, repeat: Infinity, ease: "easeInOut", delay: 2 }
          }
          aria-hidden="true"
        />
        <div className={styles.grid} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div>
            <motion.div className={styles.eyebrowRow} {...rise(0)}>
              <span className={styles.rule} />
              <span className="eyebrow">Geological Survey of Western Australia</span>
            </motion.div>

            <motion.h1 className={styles.title} {...rise(0.08)}>
              GSWA HyLogger <span className={styles.titleAccent}>Industry Adoption</span>
            </motion.h1>

            <motion.p className={styles.tagline} {...rise(0.16)}>
              Western Australia has hyperspectral scans of thousands of drill
              holes, free to anyone who wants them, and almost nobody uses them.
              They arrive as raw mineral readings rather than answers. This is
              the pipeline that turns those readings into a call on every metre
              of core: ore, waste, altered, or not yet worth guessing.
            </motion.p>

            <motion.div className={styles.actions} {...rise(0.24)}>
              <Button to="/explorer" size="lg" trailingIcon="arrowRight">
                Open the Hole Explorer
              </Button>
              <Button to="/about" size="lg" variant="secondary">
                How this works
              </Button>
            </motion.div>
          </div>

          <CoreStrip />
        </div>
      </section>

      <motion.section
        className={styles.figures}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.35, ease: easeOut }}
      >
        <div className={styles.figuresInner}>
          <Stat
            value={PROJECT_FIGURES.holesProcessed}
            label="Holes pulled and processed"
            note="Capped at twenty while NVCL rate limits"
          />
          <Stat
            value={PROJECT_FIGURES.depthIntervals}
            label="Depth intervals classified"
          />
          <Stat
            value={PROJECT_FIGURES.mineralsDetected}
            label="Minerals detected in SWIR"
            note="Five carry almost all the weight"
          />
          <Stat
            value={PROJECT_FIGURES.classifierRules}
            label="Rules in the baseline classifier"
            note="Thresholds still provisional"
          />
        </div>
      </motion.section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">The pipeline</p>
          <h2 className={styles.sectionTitle}>From a government archive to a call on the rock</h2>
          <p className={styles.sectionLede}>
            Six stages, each one a folder in the repository. Nothing here is a
            black box: if a result looks wrong you can follow it back to the
            scan it came from.
          </p>
        </div>

        <ul className={styles.pipeline}>
          {PIPELINE.map((step, index) => (
            <motion.li
              key={step.name}
              className={styles.step}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: index * 0.06, ease: easeOut }}
            >
              <span className={styles.stepIndex}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.stepName}>{step.name}</span>
              <span className={styles.stepNote}>{step.note}</span>
            </motion.li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <p className="eyebrow">Where to go next</p>
          <h2 className={styles.sectionTitle}>Three ways into the data</h2>
        </div>

        <ul className={styles.routes}>
          {ROUTES.map((route, index) => (
            <motion.li
              key={route.to}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.08, ease: easeOut }}
            >
              <Card as={Link} to={route.to} interactive className={styles.routeCard}>
                <span className={styles.routeIcon}>
                  <Icon name={route.icon} size={18} />
                </span>
                <span className={styles.routeName}>{route.name}</span>
                <span className={styles.routeNote}>{route.note}</span>
                <span className={styles.routeLink}>
                  {route.cta}
                  <Icon name="arrowRight" size={15} />
                </span>
              </Card>
            </motion.li>
          ))}
        </ul>
      </section>
    </PageTransition>
  );
}

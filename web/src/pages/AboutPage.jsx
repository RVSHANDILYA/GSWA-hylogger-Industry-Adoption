import { motion, useReducedMotion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import { Badge, Card, PageHeader } from "../components/ui/index.js";
import { EXPECTED_MAX_ERROR } from "../data/classification.js";
import { easeOut } from "../styles/theme.js";
import styles from "./AboutPage.module.css";

const TEAM = [
  { name: "Raja Venkata Shandilya Puram", role: "Classifier" },
  { name: "Zhenghao Cui", role: "Database, API" },
  { name: "Likhita Chowdary Moparthi", role: "Validation" },
  { name: "Simrat Sandhu", role: "Web app, design" },
  { name: "Sahaj Jayeshbhai Patel", role: "Web, API link" },
  { name: "Dulya Murage", role: "Results view" },
];

const STACK = [
  "React",
  "Vite",
  "React Router",
  "Framer Motion",
  "Recharts",
  "Axios",
  "FastAPI",
  "PostgreSQL",
  "Docker Compose",
  "pandas",
  "nvcl-kit",
];

const OPEN_QUESTIONS = [
  {
    marker: "Q1",
    text: "The five rule thresholds are our own numbers, not the client's. We need real abundance cutoffs before any label here means what it says.",
  },
  {
    marker: "Q2",
    text: "Hematite and goethite never appear in the SWIR data, so oxide based ore indication is out of reach. That needs thermal infrared, which is a later sprint.",
  },
  {
    marker: "Q3",
    text: "We have no expert labelled holes, so we can measure how often the rules refuse to answer but not how often they answer wrongly.",
  },
  {
    marker: "Q4",
    text: `The error ceiling of ${EXPECTED_MAX_ERROR} is the seventy fifth percentile of what we observed, not a spectroscopy standard. It controls coverage, so it needs confirming.`,
  },
];

export default function AboutPage() {
  const reduceMotion = useReducedMotion();

  const block = (index) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-60px" },
    transition: { duration: 0.4, delay: index * 0.05, ease: easeOut },
  });

  return (
    <PageTransition>
      <Container>
        <PageHeader
          eyebrow="About"
          title="What this project is, and what it can honestly tell you"
          lede="A capstone project with the Geological Survey of Western Australia, turning an open hyperspectral archive into something a practising geologist would actually open."
        />

        <div className={styles.prose}>
          <div className={styles.body}>
            <motion.section className={styles.block} {...block(0)}>
              <h2>The problem</h2>
              <p>
                The Geological Survey of Western Australia runs a HyLogger, an
                instrument that scans drill core and works out which minerals
                sit at each depth. It has done this for more than six thousand
                holes, and every one of those scans is public and free.
              </p>
              <p>
                Almost nobody in industry uses them. The data comes out as raw
                mineral readings rather than answers, so a geologist who wants
                to know whether a section of core is worth a second look has to
                do the interpretation themselves, hole by hole.
              </p>
            </motion.section>

            <motion.section className={styles.block} {...block(1)}>
              <h2>What we built</h2>
              <p>
                An end to end pipeline. It pulls scans from the National Virtual
                Core Library, drops the intervals the survey's own Final Mask
                marks as unusable, converts raw mineral counts to percentages,
                stores the result in PostgreSQL, and runs a five rule classifier
                over every depth interval. A FastAPI service puts the result
                behind a REST endpoint, and this site is the front of it.
              </p>
              <p>
                The classifier is deliberately simple and deliberately readable.
                Every label it hands back arrives with the rule that produced it
                and a plain English reason, so a disagreement is a conversation
                about a threshold rather than an argument with a black box.
              </p>
            </motion.section>

            <motion.section className={styles.block} {...block(2)}>
              <h2>How confidence is judged</h2>
              <p>
                On the Error scalar, and only on the Error scalar. We previously
                read Wt1 as a quality score, which was wrong: the client
                confirmed that a Wt1 of 1.0 simply means a single dominant
                mineral was found, so it says nothing about whether the reading
                can be trusted. Lower Error is a better reading, and anything
                past {EXPECTED_MAX_ERROR} does not pass the gate.
              </p>
            </motion.section>

            <motion.section className={styles.block} {...block(3)}>
              <h2>What is still open</h2>
              <p>
                Worth reading before quoting a number from this site anywhere
                that matters.
              </p>
              <ul className={styles.list}>
                {OPEN_QUESTIONS.map((item) => (
                  <li key={item.marker} className={styles.listItem}>
                    <span className={styles.listMarker}>{item.marker}</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
          </div>

          <aside className={styles.aside}>
            <Card>
              <p className={`eyebrow ${styles.cardTitle}`}>Group 6, Data Wranglers</p>
              <ul className={styles.team}>
                {TEAM.map((member) => (
                  <li key={member.name} className={styles.member}>
                    <span className={styles.memberName}>{member.name}</span>
                    <span className={styles.memberTask}>{member.role}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card>
              <p className={`eyebrow ${styles.cardTitle}`}>Stack</p>
              <div className={styles.stackList}>
                {STACK.map((tool) => (
                  <Badge key={tool} tone="neutral">
                    {tool}
                  </Badge>
                ))}
              </div>
            </Card>
          </aside>
        </div>
      </Container>
    </PageTransition>
  );
}

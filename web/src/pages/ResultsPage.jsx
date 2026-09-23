import { Suspense, lazy, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import HoleSelector from "../components/holes/HoleSelector.jsx";
import {
  Badge,
  Card,
  Loading,
  Notice,
  PageHeader,
  Stat,
  StateMessage,
} from "../components/ui/index.js";
import {
  confidenceState,
  labelTone,
  ruleName,
  ruleShort,
} from "../data/classification.js";
import { dominantMineral, mineralColour, mineralLabel } from "../data/minerals.js";
import useAsyncData from "../hooks/useAsyncData.js";
import { fetchHoles, fetchIntervals } from "../api/client.js";
import { easeOut } from "../styles/theme.js";
import styles from "./ResultsPage.module.css";

/* Recharts is roughly half the weight of the whole bundle and this is the
   only page that draws a chart, so it loads on demand rather than sitting in
   the landing page's payload. */
const MineralBreakdownChart = lazy(
  () => import("../components/charts/MineralBreakdownChart.jsx")
);

/*
  Classification results.

  Task 8 stands this page up: the hole rail on the left reuses the same
  HoleSelector as the Hole Explorer, and the right hand panel shows one
  worked example of every piece Task 10 needs, against placeholder data.

  Task 10 (Dulya) owns the finished version. What is already here and worth
  building on rather than replacing:
  - the interval row, including the treatment for a flagged or masked reading
  - MineralBreakdownChart, a reusable stacked chart with a hover tooltip
  - the confidence helpers in src/data/classification.js

  Still to build: the depth against mineral timeline for the whole hole, and
  a per interval donut if that reads better than the stack.
*/
export default function ResultsPage() {
  /* The chosen hole lives in the URL rather than in component state, so the
     Hole Explorer can link straight to a hole and the address bar is worth
     copying and sending to someone. */
  const [searchParams, setSearchParams] = useSearchParams();
  const chosenHoleId = searchParams.get("hole");
  const setChosenHoleId = (holeId) =>
    setSearchParams({ hole: holeId }, { replace: true });

  const reduceMotion = useReducedMotion();

  /* Task 9 and 10: swap these two loaders for the Axios client. */
  const holesRequest = useAsyncData(fetchHoles, []);
  const holes = holesRequest.data?.holes ?? [];

  /* Land on the first hole so the page has something to show rather than an
     empty panel, but let a click override it. */
  const selected =
    holes.find((hole) => hole.hole_id === chosenHoleId) ?? holes[0] ?? null;
  const holeId = selected?.hole_id ?? null;

  const loadIntervals = useCallback(() => fetchIntervals(holeId), [holeId]);
  const intervalsRequest = useAsyncData(loadIntervals, [holeId], { skip: !holeId });
  const intervals = intervalsRequest.data?.intervals ?? [];

  const classified = intervals.filter((row) => row.label !== "Unclassified");
  const flagged = intervals.filter(
    (row) => confidenceState(row.confidence_error, row.final_mask).state !== "good"
  );

  return (
    <PageTransition>
      <Container>
        <PageHeader
          eyebrow="Classification results"
          title="What the rules found, metre by metre"
          lede="Pick a hole on the left. Each interval shows the rule that fired, what the rock is made of, and how far the reading sits inside the error gate."
          meta={
            <Badge tone="neutral" mono>
              Confidence judged on Error, not Wt1
            </Badge>
          }
        />

        <div style={{ marginBottom: "var(--space-6)" }}>
          <Notice title="Live classification results">
            Intervals below are generated from the GSWA HyLogger classification pipeline.
          </Notice>
        </div>

        <div className={styles.layout}>
          <aside className={styles.rail}>
            <div className={styles.railHead}>
              <p className="eyebrow">Select a hole</p>
            </div>
            <HoleSelector
              variant="rail"
              holes={holes}
              loading={holesRequest.loading}
              error={holesRequest.error}
              onRetry={holesRequest.retry}
              selectedHoleId={holeId}
              onSelect={(hole) => setChosenHoleId(hole.hole_id)}
              searchPlaceholder="Filter holes"
            />
          </aside>

          <div className={styles.panel}>
            {!selected ? (
              <Card>
                <div className={styles.empty}>
                  <StateMessage icon="compass" title="No hole selected">
                    Pick a hole from the list to see its classified intervals.
                  </StateMessage>
                </div>
              </Card>
            ) : intervalsRequest.loading ? (
              <Card>
                <Loading>Reading intervals for {selected.hole_id}</Loading>
              </Card>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.hole_id}
                  className={styles.panel}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.26, ease: easeOut }}
                >
                  <Card>
                    <div className={styles.summary}>
                      <Stat value={selected.hole_id} label="Hole" />
                      <Stat value={intervals.length} label="Intervals" />
                      <Stat
                        value={classified.length}
                        label="Given a label"
                        note={`${intervals.length - classified.length} unclassified`}
                      />
                      <Stat
                        value={flagged.length}
                        label="Flagged readings"
                        note="Marginal or outside the gate"
                      />
                    </div>
                  </Card>

                  <Card>
                    <Suspense fallback={<Loading>Drawing the breakdown</Loading>}>
                      <MineralBreakdownChart
                        intervals={intervals}
                        title={`Mineral breakdown, ${selected.hole_id}`}
                        subtitle="Share of each interval, SWIR minerals only"
                      />
                    </Suspense>
                  </Card>

                  <ul className={styles.intervals}>
                    {intervals.map((interval, index) => {
                      const flag = confidenceState(
                        interval.confidence_error,
                        interval.final_mask
                      );
                      const dominant = dominantMineral(interval.minerals);
                      const rowStyle =
                        flag.state === "problem"
                          ? styles.excluded
                          : flag.state === "caution"
                            ? styles.flagged
                            : undefined;

                      return (
                        <motion.li
                          key={`${interval.depth_from_m}-${interval.depth_to_m}`}
                          initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: reduceMotion ? 0 : index * 0.035,
                            ease: easeOut,
                          }}
                        >
                          <Card padding="compact" className={rowStyle}>
                            <div className={styles.interval}>
                              <div className={styles.depth}>
                                <span className={styles.depthRange}>
                                  {interval.depth_from_m} to {interval.depth_to_m} m
                                </span>
                                <span className={styles.depthSpan}>
                                  {interval.depth_to_m - interval.depth_from_m} m span
                                </span>
                              </div>

                              <div className={styles.body}>
                                <div className={styles.badges}>
                                  <Badge tone={labelTone(interval.label)}>
                                    {interval.label}
                                  </Badge>
                                  <Badge tone="neutral" mono>
                                    {ruleShort(interval.rule_fired)}{" "}
                                    {ruleName(interval.rule_fired)}
                                  </Badge>
                                  <Badge tone={flag.state} icon={flag.icon} mono>
                                    {flag.text}, Error {interval.confidence_error}
                                  </Badge>
                                </div>

                                {dominant && (
                                  <p className={styles.dominant}>
                                    <span
                                      className={styles.dot}
                                      style={{ background: mineralColour(dominant.name) }}
                                    />
                                    {mineralLabel(dominant.name)} dominant at{" "}
                                    {dominant.percentage.toFixed(1)}%
                                  </p>
                                )}

                                <p className={styles.reason}>{interval.reason}</p>
                              </div>
                            </div>
                          </Card>
                        </motion.li>
                      );
                    })}
                  </ul>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </Container>
    </PageTransition>
  );
}

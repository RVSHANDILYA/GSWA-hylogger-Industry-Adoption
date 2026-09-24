import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
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
const DepthMineralTimeline = lazy(
  () => import("../components/charts/DepthMineralTimeline.jsx")
);

/*
  Classification results.

  The hole rail on the left reuses the same HoleSelector as the Hole
  Explorer. The right hand panel: a summary strip, the whole-hole depth
  timeline, the per-interval mineral breakdown, then the interval list
  itself with its confidence and mask treatment.

  The timeline and the interval list are linked through hoveredDepth: hover
  a point on the timeline and the matching card gets a white ring and tint
  (deliberately unlike the orange flagged edge), click it and the list
  scrolls that card into view. Neither side needs to know how the other is
  drawn, they only agree on a depth number.
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
  /* Memoised so the empty fallback is one stable array, not a new one every
     render, which would keep invalidating the hover handlers below. */
  const intervals = useMemo(
    () => intervalsRequest.data?.intervals ?? [],
    [intervalsRequest.data]
  );

  const classified = intervals.filter((row) => row.label !== "Unclassified");
  const flagged = intervals.filter(
    (row) => confidenceState(row.confidence_error, row.final_mask).state !== "good"
  );

  /* Links the timeline chart to the interval list below it. The timeline
     only knows a depth number; finding which card that belongs to, and
     scrolling to it, is the list's job. */
  const [hoveredDepth, setHoveredDepth] = useState(null);
  const cardRefs = useRef({});

  const intervalKey = (row) => `${row.depth_from_m}-${row.depth_to_m}`;

  const intervalAtDepth = useCallback(
    (depth) =>
      intervals.find(
        (row) => depth >= row.depth_from_m && depth < row.depth_to_m
      ),
    [intervals]
  );

  const handleSelectDepth = useCallback(
    (depth) => {
      const match = intervalAtDepth(depth);
      const node = match && cardRefs.current[intervalKey(match)];
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    },
    [intervalAtDepth]
  );

  const highlightedKey = useMemo(() => {
    if (hoveredDepth == null) return null;
    const match = intervalAtDepth(hoveredDepth);
    return match ? intervalKey(match) : null;
  }, [hoveredDepth, intervalAtDepth]);

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
                    <Suspense fallback={<Loading>Drawing the depth profile</Loading>}>
                      <DepthMineralTimeline
                        intervals={intervals}
                        title={`Mineral composition by depth, ${selected.hole_id}`}
                        subtitle="Hover to trace a depth, click to jump to that interval below"
                        onHoverDepth={setHoveredDepth}
                        onSelectDepth={handleSelectDepth}
                      />
                    </Suspense>
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
                      const key = intervalKey(interval);
                      const rowStyle = [
                        flag.state === "problem"
                          ? styles.excluded
                          : flag.state === "caution"
                            ? styles.flagged
                            : "",
                        key === highlightedKey ? styles.highlighted : "",
                      ]
                        .filter(Boolean)
                        .join(" ");

                      return (
                        <motion.li
                          key={key}
                          ref={(node) => {
                            cardRefs.current[key] = node;
                          }}
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
                                    {flag.text}, Error{" "}
                                    {interval.confidence_error == null
                                      ? "n/a"
                                      : Number(interval.confidence_error).toFixed(1)}
                                  </Badge>
                                </div>

                                {dominant && (
                                  <p className={styles.dominant}>
                                    <span
                                      className={styles.dot}
                                      style={{ background: mineralColour(dominant.name) }}
                                    />
                                    {mineralLabel(dominant.name)} dominant at{" "}
                                    {Number(dominant.percentage).toFixed(1)}%
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

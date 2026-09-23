import { useCallback, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import PageTransition from "../components/layout/PageTransition.jsx";
import { Container } from "../components/layout/Layout.jsx";
import HoleSelector from "../components/holes/HoleSelector.jsx";
import {
  Badge,
  Button,
  Card,
  Icon,
  Loading,
  Notice,
  PageHeader,
  Stat,
} from "../components/ui/index.js";
import useAsyncData from "../hooks/useAsyncData.js";
import { confidenceState, labelTone, ruleShort } from "../data/classification.js";
import { fetchHoles, fetchIntervals } from "../api/client.js";
import { easeOut } from "../styles/theme.js";
import styles from "./ExplorerPage.module.css";

/*
  Hole Explorer.

  Task 8 builds the shell: the layout, the selection component, the detail
  panel and every visual state the page can be in. The data comes from
  src/data/placeholderData.js.

  Task 9 (Sahaj) swaps the two imports below for the Axios client and keeps
  everything else. The loading and error branches are already wired, so a slow
  or unreachable API shows something sensible rather than a blank page.
*/
export default function ExplorerPage() {
  const [selected, setSelected] = useState(null);
  const reduceMotion = useReducedMotion();

  /* Task 9: swap these two loaders for the Axios client. Everything below
     reads from the hook, so nothing else on the page has to change. */
  const holesRequest = useAsyncData(fetchHoles, []);
  const holes = holesRequest.data?.holes ?? [];

  const holeId = selected?.hole_id ?? null;
  const loadIntervals = useCallback(
    () => fetchIntervals(holeId),
    [holeId]
  );
  const intervalsRequest = useAsyncData(loadIntervals, [holeId], { skip: !holeId });
  const intervals = intervalsRequest.data?.intervals ?? [];

  return (
    <PageTransition>
      <Container>
        <PageHeader
          eyebrow="Hole Explorer"
          title="Every hole we have processed"
          lede="Search the holes pulled from the National Virtual Core Library, then open one to see how deep it goes and how the classifier read it."
          meta={
            <>
              <Badge tone="accent" mono>
                {holes.length} holes
              </Badge>
              <Badge tone="neutral" mono>
                SWIR only
              </Badge>
            </>
          }
        />

        <div className={styles.notice}>
          <Notice title="Live GSWA HyLogger data">
            Boreholes are loaded from the FastAPI backend using processed NVCL HyLogger data.
          </Notice>
        </div>

        <div
          className={`${styles.split} ${selected ? styles.withDetail : ""}`.trim()}
        >
          <HoleSelector
            holes={holes}
            loading={holesRequest.loading}
            error={holesRequest.error}
            onRetry={holesRequest.retry}
            selectedHoleId={selected?.hole_id ?? null}
            onSelect={(hole) =>
              setSelected((current) =>
                current?.hole_id === hole.hole_id ? null : hole
              )
            }
          />

          <AnimatePresence mode="wait">
            {selected && (
              <motion.div
                key={selected.hole_id}
                className={styles.detail}
                initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                transition={{ duration: 0.26, ease: easeOut }}
              >
                <Card>
                  <div className={styles.detailHead}>
                    <div>
                      <p className={styles.detailId}>{selected.hole_id}</p>
                      <p className={styles.detailRegion}>{selected.region}</p>
                    </div>
                    <button
                      type="button"
                      className={styles.close}
                      onClick={() => setSelected(null)}
                      aria-label={`Close details for ${selected.hole_id}`}
                    >
                      <Icon name="x" size={15} strokeWidth={2} />
                    </button>
                  </div>

                  <div className={styles.detailGrid}>
                    <Stat value={selected.total_depth_m} unit="m" label="Logged depth" />
                    <Stat
                      value={selected.intervals_classified}
                      label="Intervals classified"
                    />
                    <Stat value={selected.latitude.toFixed(3)} label="Latitude" />
                    <Stat value={selected.longitude.toFixed(3)} label="Longitude" />
                  </div>

                  <div className={styles.sectionLabel}>
                    <span className="eyebrow">Classified intervals</span>
                    <span className="eyebrow">Rule, confidence</span>
                  </div>

                  {intervalsRequest.loading ? (
                    <Loading>Reading intervals</Loading>
                  ) : (
                    <ul className={styles.intervalList}>
                      {intervals.map((interval) => {
                        const flag = confidenceState(
                          interval.confidence_error,
                          interval.final_mask
                        );
                        return (
                          <li
                            key={`${interval.depth_from_m}-${interval.depth_to_m}`}
                            className={styles.intervalRow}
                          >
                            <span className={styles.intervalDepth}>
                              {interval.depth_from_m} to {interval.depth_to_m} m
                            </span>
                            <span className={styles.intervalLabel}>
                              <Badge tone={labelTone(interval.label)}>
                                {interval.label}
                              </Badge>
                            </span>
                            <span>
                              <Badge tone={flag.state} icon={flag.icon} mono>
                                {ruleShort(interval.rule_fired)}, Error{" "}
                                {interval.confidence_error}
                              </Badge>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  <div className={styles.detailFoot}>
                    {/* Carry the selection across so the two pages behave
                        like one site rather than two separate tools. */}
                    <Button
                      to={`/results?hole=${encodeURIComponent(selected.hole_id)}`}
                      size="sm"
                      variant="secondary"
                      trailingIcon="arrowRight"
                    >
                      Open in Classification
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </PageTransition>
  );
}

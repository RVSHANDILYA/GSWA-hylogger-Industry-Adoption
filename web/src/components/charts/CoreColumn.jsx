import { useId, useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import {
  dominantMineral,
  mineralColour,
  mineralLabel,
} from "../../data/minerals.js";
import { easeOut } from "../../styles/theme.js";
import styles from "./CoreColumn.module.css";

function bandDescription(interval, dominant) {
  return [
    `${interval.depth_from_m} to ${interval.depth_to_m} m`,
    interval.label,
    dominant
      ? `${mineralLabel(dominant.name)} dominant at ${Number(dominant.percentage).toFixed(1)}%`
      : "No mineral data",
    interval.final_mask === false ? "Excluded by mask" : null,
    interval.confidence_error == null
      ? "Error unavailable"
      : `Error ${Number(interval.confidence_error).toFixed(1)}`,
    interval.rule_fired,
    interval.reason,
  ]
    .filter(Boolean)
    .join("\n");
}

export default function CoreColumn({
  intervals = [],
  height,
  highlightDepth,
  showRuler = true,
  showMaskExcluded = true,
  activeIntervalKeys,
  onSelectDepth,
  onHoverDepth,
}) {
  const reduceMotion = useReducedMotion();
  const instanceId = useId();
  const filterId = `core-grain-${instanceId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const bands = useMemo(
    () =>
      (Array.isArray(intervals) ? intervals : [])
        .filter(
          (interval) =>
            Number.isFinite(interval.depth_from_m) &&
            Number.isFinite(interval.depth_to_m) &&
            interval.depth_to_m > interval.depth_from_m
        )
        .slice()
        .sort((a, b) => a.depth_from_m - b.depth_from_m),
    [intervals]
  );

  const startDepth = bands[0]?.depth_from_m ?? 0;
  const endDepth = bands.reduce(
    (deepest, interval) => Math.max(deepest, interval.depth_to_m),
    startDepth
  );
  const depthRange = endDepth - startDepth;
  const firstTick = Math.ceil(startDepth / 50) * 50;
  const tickCount = Math.max(0, Math.floor((endDepth - firstTick) / 50) + 1);

  if (bands.length === 0) {
    return (
      <div className={styles.empty} style={{ height }} role="status">
        No depth intervals available
      </div>
    );
  }

  return (
    <div className={styles.wrap} style={{ height }}>
      <svg
        className={styles.filter}
        width="0"
        height="0"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="100%"
            height="100%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              seed="7"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {showRuler && (
        <div className={styles.ruler} aria-hidden="true">
          {Array.from({ length: tickCount }, (_, index) => {
            const depth = firstTick + index * 50;
            return (
              <span
                key={depth}
                className={styles.tick}
                style={{
                  top: `${((depth - startDepth) / depthRange) * 100}%`,
                  transform:
                    depth === startDepth
                      ? "none"
                      : depth === endDepth
                        ? "translateY(-100%)"
                        : undefined,
                }}
              >
                {depth} m
              </span>
            );
          })}
        </div>
      )}

      <div
        className={styles.column}
        role="list"
        aria-label={`Drill core intervals, ${startDepth} to ${endDepth} m`}
      >
        {bands.map((interval, index) => {
          const dominant = dominantMineral(interval.minerals);
          const description = bandDescription(interval, dominant);
          const highlighted =
            Number.isFinite(highlightDepth) &&
            highlightDepth >= interval.depth_from_m &&
            (highlightDepth < interval.depth_to_m ||
              (highlightDepth === endDepth && interval.depth_to_m === endDepth));
          const dimmed = activeIntervalKeys && !activeIntervalKeys.has(`${interval.depth_from_m}-${interval.depth_to_m}`);
          const depth = (interval.depth_from_m + interval.depth_to_m) / 2;

          return (
            <div
              key={`${interval.depth_from_m}-${interval.depth_to_m}-${index}`}
              className={`${styles.band}${highlighted ? ` ${styles.highlighted}` : ""}${dimmed ? ` ${styles.dimmed}` : ""}`}
              role="listitem"
              aria-label={onSelectDepth ? undefined : description}
              title={description}
              onMouseEnter={() => onHoverDepth?.(depth)}
              onMouseLeave={() => onHoverDepth?.(null)}
              style={{
                top: `${((interval.depth_from_m - startDepth) / depthRange) * 100}%`,
                height: `${((interval.depth_to_m - interval.depth_from_m) / depthRange) * 100}%`,
                backgroundColor: mineralColour(dominant?.name ?? "OTHER"),
              }}
            >
              <span
                className={styles.grain}
                style={{ filter: `url(#${filterId})` }}
                aria-hidden="true"
              />
              {showMaskExcluded && interval.final_mask === false && (
                <span className={styles.hatch} aria-hidden="true" />
              )}
              {onSelectDepth && <button type="button" className={styles.bandButton}
                aria-label={description + (dimmed ? "\nOutside active filters. Select to clear filters and inspect." : "\nSelect to inspect interval.")}
                onClick={() => onSelectDepth(depth)} onFocus={() => onHoverDepth?.(depth)} onBlur={() => onHoverDepth?.(null)} />}
            </div>
          );
        })}

        {!reduceMotion && (
          <span
            className={styles.scan}
            style={{ animationTimingFunction: `cubic-bezier(${easeOut.join(",")})` }}
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

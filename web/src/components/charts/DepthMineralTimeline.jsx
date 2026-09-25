import { memo, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chart } from "../../styles/theme.js";

import {
  MINERAL_ORDER,
  groupMinerals,
  mineralColour,
  mineralLabel,
} from "../../data/minerals.js";

import styles from "./DepthMineralTimeline.module.css";

/* Recharts' own tooltip is pinned to the nearest data point's edge, and a
   box beside the cursor covers the very blocks being pointed at on a chart
   this short. The chart's own tooltip is kept mounted, but drawn empty, only
   so the chart keeps reporting hover events; a compact card of our own
   follows the cursor along a strip above the chart instead. */
function NoTooltip() {
  return null;
}

/*
  Mineral composition down the whole hole, as one continuous depth profile.

  MineralBreakdownChart answers "what is this one interval made of". This
  answers a different question: "how does the rock change as you go deeper,
  across the whole hole, in one view". Depth is a real continuous axis here,
  not one category per interval, so it reads like a strip log a geologist
  could scroll through. The Brush underneath lets a long hole be zoomed into
  one section without losing the overview of the rest.

  Hover and click both report the start depth of the interval under the
  cursor, through onHoverDepth and onSelectDepth, so a parent can highlight
  or jump to the matching interval card without this component knowing
  anything about how cards are laid out.

  The hovered interval is shaded by this component's own state, and the
  component is memoised, so the parent's hover state changing never
  re-renders the chart while the mouse is on it. The floating card is moved
  with a transform straight onto the page, never through React state, so
  following the cursor re-renders nothing.
*/
function DepthMineralTimeline({
  intervals = [],
  title = "Mineral composition by depth",
  subtitle,
  height = 260,
  onHoverDepth,
  onSelectDepth,
}) {
  const [activeRange, setActiveRange] = useState(null);
  const lastBrushChange = useRef(0);
  const areaRef = useRef(null);
  const tipRef = useRef(null);
  const mouseX = useRef(0);

  /* Each interval is one composition held across its whole depth range, so
     the chart must step at each boundary rather than smooth between points,
     which would invent values that were never measured.

     Every interval contributes two points, one at its top and one just above
     its bottom. Recharts snaps a hover to the nearest data point, so with
     only one point per interval the right half of every block would report
     the next interval. With a point at both ends, the nearest point to any
     depth always belongs to the interval under the cursor. */
  const data = useMemo(
    () =>
      intervals
        .slice()
        .sort((a, b) => a.depth_from_m - b.depth_from_m)
        .flatMap((interval) => {
          const row = {
            depthFrom: interval.depth_from_m,
            depthTo: interval.depth_to_m,
            excluded: interval.final_mask === false,
            ...groupMinerals(interval.minerals),
          };
          return [
            { ...row, depth: interval.depth_from_m },
            { ...row, depth: interval.depth_to_m - 0.001 },
          ];
        }),
    [intervals]
  );

  const activePoint = useMemo(
    () =>
      activeRange
        ? data.find((row) => row.depthFrom === activeRange.from)
        : undefined,
    [activeRange, data]
  );

  /* Centre the card on the cursor, kept inside the chart's width. It only
     ever moves sideways: it lives in a strip above the plot, so it cannot
     cover the blocks being pointed at. */
  const placeTip = () => {
    const tip = tipRef.current;
    const area = areaRef.current;
    if (!tip || !area) return;

    const maxLeft = Math.max(0, area.clientWidth - tip.offsetWidth);
    const left = Math.min(Math.max(mouseX.current - tip.offsetWidth / 2, 0), maxLeft);
    tip.style.transform = `translateX(${Math.round(left)}px)`;
  };

  /* The card mounts on the first move over a new block, after the move
     handler has already run, so place it once it exists. */
  useLayoutEffect(placeTip, [activePoint]);

  if (data.length === 0) {
    return null;
  }

  /* Recharts 3 reports the hovered position as a depth value and an index,
     not as a payload, so look the point up ourselves. The depth is used
     first because the index may be relative to the zoomed slice once the
     Brush is dragged, while each point's depth is unique. */
  const pointFromEvent = (state) => {
    /* Over the margins, the axes or the zoom strip there is no hovered
       block. Recharts reports that as null, and Number(null) is 0, which
       would read as the first interval, so check for null explicitly. */
    if (state?.isTooltipActive === false) return undefined;

    const label = state?.activeLabel;
    if (label != null && Number.isFinite(Number(label))) {
      return data.find((row) => row.depth === Number(label));
    }

    const raw = state?.activeTooltipIndex ?? state?.activeIndex;
    if (raw == null) return undefined;

    const index = Number(raw);
    return Number.isInteger(index) ? data[index] : undefined;
  };

  const handleMove = (state, event) => {
    const rect = areaRef.current?.getBoundingClientRect();
    if (rect && event) {
      mouseX.current = event.clientX - rect.left;
      placeTip();
    }

    const point = pointFromEvent(state);
    if (!point) {
      handleLeave();
      return;
    }

    setActiveRange((current) =>
      current?.from === point.depthFrom
        ? current
        : { from: point.depthFrom, to: point.depthTo }
    );
    onHoverDepth?.(point.depthFrom);
  };

  const handleLeave = () => {
    setActiveRange(null);
    onHoverDepth?.(null);
  };

  /* Releasing the mouse after dragging the zoom strip also arrives here as
     a click on the chart. Ignore clicks on the strip itself, and any click
     right after the strip moved, so zooming never jumps the page to a card. */
  const handleClick = (state, event) => {
    if (event?.target?.closest?.(".recharts-brush")) return;
    if (Date.now() - lastBrushChange.current < 400) return;

    /* A click goes to the block that is being hovered, the one shaded on the
       chart. Outside the plot nothing is hovered, so nothing happens. That
       is deliberate: Recharts' own position for a click in the margins reads
       as the first interval. */
    if (activeRange) onSelectDepth?.(activeRange.from);
  };

  return (
    <figure className={styles.wrap}>
      <figcaption className={styles.head}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </figcaption>

      <div className={styles.plotArea} ref={areaRef}>
        {activePoint && (
          <div ref={tipRef} className={styles.floatingTip}>
            <TipBody point={activePoint} />
          </div>
        )}

        <div className={styles.plot} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 44, bottom: 4, left: 4 }}
            onMouseMove={handleMove}
            onMouseLeave={handleLeave}
            onClick={handleClick}
          >
            <CartesianGrid stroke={chart.grid} strokeDasharray="2 4" vertical={false} />

            <XAxis
              dataKey="depth"
              type="number"
              domain={["dataMin", "dataMax"]}
              tickFormatter={(value) => `${Math.round(value)}m`}
              stroke={chart.grid}
              tick={{ fill: chart.axis, fontSize: 11, fontFamily: "IBM Plex Mono" }}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke={chart.grid}
              tick={{ fill: chart.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={56}
            />

            <Tooltip content={<NoTooltip />} cursor={false} />

            {MINERAL_ORDER.map((mineral) => (
              <Area
                key={mineral}
                type="linear"
                dataKey={mineral}
                activeDot={false}
                stackId="minerals"
                stroke={mineralColour(mineral)}
                fill={mineralColour(mineral)}
                fillOpacity={0.85}
                isAnimationActive={false}
              />
            ))}

            {activeRange && (
              <ReferenceArea
                x1={activeRange.from}
                x2={activeRange.to}
                fill={chart.textStrong}
                fillOpacity={0.18}
                stroke={chart.textStrong}
                strokeOpacity={0.6}
                ifOverflow="hidden"
                style={{ pointerEvents: "none" }}
              />
            )}

            <Brush
              dataKey="depth"
              height={22}
              travellerWidth={8}
              onChange={() => {
                lastBrushChange.current = Date.now();
              }}
              stroke={chart.axis}
              fill={chart.surface}
              tickFormatter={(index) =>
                data[index] ? `${Math.round(data[index].depth)}m` : ""
              }
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.legend}>
        {MINERAL_ORDER.map((mineral) => (
          <span key={mineral} className={styles.legendItem}>
            <span className={styles.swatch} style={{ background: mineralColour(mineral) }} />
            {mineralLabel(mineral)}
          </span>
        ))}
        <span className={styles.hint}>Drag the strip below the chart to zoom into a section</span>
      </div>
    </figure>
  );
}

export default memo(DepthMineralTimeline);

/* Depth range and the three largest minerals. The full composition is in the
   breakdown chart below, so the card stays one short line. */
function TipBody({ point }) {
  const rows = MINERAL_ORDER.map((mineral) => ({
    mineral,
    value: point[mineral] ?? 0,
  }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  return (
    <>
      <span className={styles.tipDepth}>
        {point.depthFrom} to {point.depthTo} m
      </span>

      {point.excluded && <span className={styles.tipExcluded}>Excluded by mask</span>}

      {rows.map((row, rank) => (
        <span key={row.mineral} className={styles.tipItem} data-rank={rank}>
          <span className={styles.swatch} style={{ background: mineralColour(row.mineral) }} />
          {mineralLabel(row.mineral)}
          <span className={styles.tipValue}>{row.value.toFixed(1)}%</span>
        </span>
      ))}
    </>
  );
}

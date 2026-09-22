import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chart } from "../../styles/theme.js";
import {
  MINERAL_ORDER,
  mineralColour,
  mineralLabel,
} from "../../data/minerals.js";
import styles from "./MineralBreakdownChart.module.css";

/*
  Mineral composition down a hole, as a stacked strip.

  Why this form: each interval's minerals already sum to one hundred percent,
  so the question is "what is this rock made of and how does that change with
  depth", which is part to whole across an ordered axis. A stacked bar per
  interval, stacked left to right with depth running down the side, is the
  digital version of the strip log a geologist already reads.

  Rules this chart follows, worth keeping if you extend it:
  - Six categories at most. The five tracked minerals keep their fixed colour
    slot and everything else folds into Other. Never add a seventh hue.
  - A mineral is the same colour on every chart on the site.
  - One x axis, always zero to one hundred, so two holes can be compared.
  - Grid and axes stay recessive, the marks carry the chart.
  - A one pixel surface coloured stroke separates the stacked segments, which
    keeps adjacent fills from bleeding into one another.
  - The legend is always rendered, so colour is never the only way to tell the
    series apart.
  - Recharts' own bar animation is off on purpose. On a stacked bar it replays
    on every re-render and the segments slide over each other, which is the
    exact thing Task 10 has to avoid. The chart is animated in as a block by
    its parent with Framer Motion instead.
*/

function MineralTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const rows = [...payload]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className={styles.tooltip}>
      <div className={styles.tooltipHead}>
        <span className={styles.tooltipDepth}>{label} m</span>
        <span className={styles.tooltipLabel}>Mineral share</span>
      </div>
      {rows.map((entry) => (
        <div key={entry.dataKey} className={styles.tooltipRow}>
          <span className={styles.swatch} style={{ background: entry.color }} />
          <span>{mineralLabel(entry.dataKey)}</span>
          <span className={styles.tooltipValue}>{entry.value.toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

export default function MineralBreakdownChart({
  intervals = [],
  title = "Mineral breakdown by depth",
  subtitle,
  height,
}) {
  const data = intervals.map((interval) => ({
    depth: `${interval.depth_from_m} to ${interval.depth_to_m}`,
    ...interval.minerals,
  }));

  /* Give every bar the same room rather than squashing a long hole into a
     fixed height, so bars stay thick enough to hover comfortably. */
  const plotHeight = height ?? Math.max(220, data.length * 38 + 48);

  if (data.length === 0) return null;

  return (
    <figure className={styles.wrap}>
      <figcaption className={styles.head}>
        <span className={styles.title}>{title}</span>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </figcaption>

      <div className={styles.plot} style={{ height: plotHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 4, right: 12, bottom: 4, left: 4 }}
            barCategoryGap="22%"
          >
            <CartesianGrid
              horizontal={false}
              stroke={chart.grid}
              strokeDasharray="2 4"
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke={chart.grid}
              tick={{ fill: chart.axis, fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="category"
              dataKey="depth"
              width={92}
              stroke={chart.grid}
              tick={{ fill: chart.axis, fontSize: 11, fontFamily: "IBM Plex Mono" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<MineralTooltip />}
              cursor={{ fill: "rgba(255, 255, 255, 0.035)" }}
            />
            {MINERAL_ORDER.map((mineral, index) => (
              <Bar
                key={mineral}
                dataKey={mineral}
                stackId="minerals"
                fill={mineralColour(mineral)}
                stroke={chart.surface}
                strokeWidth={1}
                radius={
                  index === 0
                    ? [3, 0, 0, 3]
                    : index === MINERAL_ORDER.length - 1
                      ? [0, 3, 3, 0]
                      : 0
                }
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.legend}>
        {MINERAL_ORDER.map((mineral) => (
          <span key={mineral} className={styles.legendItem}>
            <span
              className={styles.swatch}
              style={{ background: mineralColour(mineral) }}
            />
            {mineralLabel(mineral)}
          </span>
        ))}
      </div>
    </figure>
  );
}

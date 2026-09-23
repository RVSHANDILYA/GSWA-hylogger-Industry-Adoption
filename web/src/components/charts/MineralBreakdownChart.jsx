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
  TRACKED_MINERALS,
  OTHER_MINERAL,
  mineralColour,
  mineralLabel,
} from "../../data/minerals.js";

import styles from "./MineralBreakdownChart.module.css";


function MineralTooltip({ active, payload, label }) {

  if (!active || !payload?.length) {
    return null;
  }


  const rows = [...payload]
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);


  return (
    <div className={styles.tooltip}>

      <div className={styles.tooltipHead}>
        <span className={styles.tooltipDepth}>
          {label} m
        </span>

        <span className={styles.tooltipLabel}>
          Mineral share
        </span>
      </div>


      {rows.map((entry) => (

        <div
          key={entry.dataKey}
          className={styles.tooltipRow}
        >

          <span
            className={styles.swatch}
            style={{
              background: entry.color
            }}
          />

          <span>
            {mineralLabel(entry.dataKey)}
          </span>

          <span className={styles.tooltipValue}>
            {entry.value.toFixed(1)}%
          </span>

        </div>

      ))}

    </div>
  );
}



function formatMinerals(minerals = []) {

  const result = {};

  let otherTotal = 0;


  minerals.forEach((mineral) => {

    const name = mineral.name;
    const percentage = Number(mineral.percentage) || 0;


    if (TRACKED_MINERALS.includes(name)) {

      result[name] = percentage;

    } else {

      otherTotal += percentage;

    }

  });


  result[OTHER_MINERAL] = otherTotal;


  return result;
}




export default function MineralBreakdownChart({
  intervals = [],
  title = "Mineral breakdown by depth",
  subtitle,
  height,
}) {


  const data = intervals.map((interval) => ({

    depth:
      `${interval.depth_from_m} to ${interval.depth_to_m}`,

    ...formatMinerals(interval.minerals),

  }));


  const plotHeight =
    height ?? Math.max(220, data.length * 38 + 48);



  if (data.length === 0) {
    return null;
  }



  return (

    <figure className={styles.wrap}>


      <figcaption className={styles.head}>

        <span className={styles.title}>
          {title}
        </span>

        {subtitle && (

          <span className={styles.subtitle}>
            {subtitle}
          </span>

        )}

      </figcaption>



      <div
        className={styles.plot}
        style={{
          height: plotHeight
        }}
      >


        <ResponsiveContainer
          width="100%"
          height="100%"
        >

          <BarChart

            layout="vertical"

            data={data}

            margin={{
              top: 4,
              right: 12,
              bottom: 4,
              left: 4
            }}

            barCategoryGap="22%"

          >


            <CartesianGrid

              horizontal={false}

              stroke={chart.grid}

              strokeDasharray="2 4"

            />



            <XAxis

              type="number"

              domain={[0,100]}

              ticks={[
                0,
                25,
                50,
                75,
                100
              ]}

              tickFormatter={
                (value)=>`${value}%`
              }

              stroke={chart.grid}

              tick={{
                fill: chart.axis,
                fontSize:11
              }}

              tickLine={false}

              axisLine={false}

            />



            <YAxis

              type="category"

              dataKey="depth"

              width={92}

              stroke={chart.grid}

              tick={{
                fill: chart.axis,
                fontSize:11,
                fontFamily:"IBM Plex Mono"
              }}

              tickLine={false}

              axisLine={false}

            />



            <Tooltip

              content={<MineralTooltip />}

              cursor={{
                fill:"rgba(255,255,255,0.035)"
              }}

            />



            {MINERAL_ORDER.map((mineral,index)=>(

              <Bar

                key={mineral}

                dataKey={mineral}

                stackId="minerals"

                fill={mineralColour(mineral)}

                stroke={chart.surface}

                strokeWidth={1}

                radius={
                  index === 0
                  ? [3,0,0,3]
                  :
                  index === MINERAL_ORDER.length-1
                  ? [0,3,3,0]
                  :
                  0
                }

                isAnimationActive={false}

              />

            ))}


          </BarChart>


        </ResponsiveContainer>


      </div>




      <div className={styles.legend}>

        {MINERAL_ORDER.map((mineral)=>(

          <span
            key={mineral}
            className={styles.legendItem}
          >

            <span

              className={styles.swatch}

              style={{
                background:
                  mineralColour(mineral)
              }}

            />

            {mineralLabel(mineral)}

          </span>

        ))}

      </div>



    </figure>

  );

}
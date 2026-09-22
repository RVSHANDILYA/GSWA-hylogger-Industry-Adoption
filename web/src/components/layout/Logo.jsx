/*
  Project mark.

  A drill core cylinder seen slightly from above, cut by five bands. The bands
  are the five mineral series colours in their fixed slot order, so the mark is
  literally the thing the site does: a core, read as a stack of minerals.
*/
import { chart } from "../../styles/theme.js";

export default function Logo({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label="GSWA HyLogger"
      focusable="false"
    >
      <defs>
        <clipPath id="logo-core-clip">
          <path d="M7 7.5 h18 v17 a9 3.4 0 0 1 -18 0 Z" />
        </clipPath>
      </defs>

      <g clipPath="url(#logo-core-clip)">
        <rect x="7" y="7.5" width="18" height="3.6" fill={chart.series[0]} />
        <rect x="7" y="11.1" width="18" height="3.6" fill={chart.series[1]} />
        <rect x="7" y="14.7" width="18" height="3.6" fill={chart.series[2]} />
        <rect x="7" y="18.3" width="18" height="3.6" fill={chart.series[3]} />
        <rect x="7" y="21.9" width="18" height="6" fill={chart.series[4]} />
      </g>

      <ellipse
        cx="16"
        cy="7.5"
        rx="9"
        ry="3.4"
        fill="var(--surface-page)"
        stroke="var(--accent)"
        strokeWidth="1.6"
      />
      <path
        d="M7 7.5 v17 a9 3.4 0 0 0 18 0 v-17"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

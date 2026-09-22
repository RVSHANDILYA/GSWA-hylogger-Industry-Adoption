/*
  The whole icon set, drawn inline rather than pulled from a package.

  There are only a dozen of them and they all share one grid and one stroke
  weight, so a dependency would cost more than it saves and would not match
  the rest of the interface. Every icon inherits currentColor, so it takes the
  colour of whatever it sits inside.

  Add a new one by adding a key to PATHS. Keep it on the 24 unit grid with a
  1.6 stroke so it sits beside the others without looking out of place.
*/

const PATHS = {
  check: <polyline points="4 12.5 9.5 18 20 6.5" />,
  alert: (
    <>
      <path d="M12 3.5 22 20H2L12 3.5Z" />
      <path d="M12 10v4.5" />
      <path d="M12 17.4v.2" />
    </>
  ),
  x: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <polyline points="13 6 19 12 13 18" />
    </>
  ),
  chevronRight: <polyline points="9 5 16 12 9 19" />,
  core: (
    <>
      <path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11" />
      <ellipse cx="12" cy="6.5" rx="7" ry="2.5" />
      <path d="M5 11.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" />
      <path d="m3 12.5 9 4.5 9-4.5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M8.5 20v-6" />
      <path d="M13 20V8.5" />
      <path d="M17.5 20v-9" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.6v.2" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v6" />
      <path d="M15 3v6" />
      <path d="M6 9h12v2.5a6 6 0 0 1-12 0V9Z" />
      <path d="M12 17.5V21" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polygon points="15.5 8.5 13.2 13.2 8.5 15.5 10.8 10.8" />
    </>
  ),
};

export default function Icon({ name, size = 18, label, strokeWidth = 1.6, ...rest }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? "img" : "presentation"}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
      {...rest}
    >
      {path}
    </svg>
  );
}

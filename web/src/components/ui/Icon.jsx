const PATHS = {
  check: <polyline points="4 12.5 9.5 18 20 6.5" />,
  alert: <><path d="M12 3.5 22 20H2L12 3.5Z" /><path d="M12 10v4.5M12 17.4v.2" /></>,
  x: <><path d="M6 6l12 12M18 6 6 18" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 4.5 4.5" /></>,
  arrowRight: <><path d="M4 12h15" /><polyline points="13 6 19 12 13 18" /></>,
  arrowUpRight: <><path d="M6 18 18 6M6 6h12v12" /></>,
  arrowDown: <><path d="M12 4v15" /><polyline points="6 13 12 19 18 13" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>,
  sliders: <><path d="M5 3v7m0 4v7M12 3v3m0 4v11M19 3v11m0 4v3M2 10h6M9 6h6M16 14h6" /></>,
  chevronRight: <polyline points="9 5 16 12 9 19" />,
  chevronDown: <polyline points="5 9 12 16 19 9" />,
  core: <><path d="M5 6.5v11c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-11" /><ellipse cx="12" cy="6.5" rx="7" ry="2.5" /><path d="M5 11.5c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5" /></>,
  layers: <><path d="m12 3 9 4.5-9 4.5-9-4.5L12 3Z" /><path d="m3 12.5 9 4.5 9-4.5M3 17l9 4 9-4" /></>,
  chart: <><path d="M4 4v16h16M8.5 20v-6M13 20V8.5M17.5 20V4" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.6v.2" /></>,
  plug: <><path d="M9 3v6M15 3v6M6 9h12v2.5a6 6 0 0 1-12 0V9ZM12 17.5V21" /></>,
  compass: <><circle cx="12" cy="12" r="9" /><polygon points="15.5 8.5 13.2 13.2 8.5 15.5 10.8 10.8" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6ZM9 3v15M15 6v15" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
  table: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 9h18M3 14h18M9 9v11" /></>,
  list: <><path d="M9 5h12M9 12h12M9 19h12M3 5h.1M3 12h.1M3 19h.1" /></>,
  filter: <><path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" /></>,
  crosshair: <><circle cx="12" cy="12" r="6" /><path d="M12 2v5M12 17v5M2 12h5M17 12h5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l4 2" /></>,
};
export default function Icon({name, size = 18, label, strokeWidth = 1.6, ...rest}) {
  if (!PATHS[name]) return null;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" role={label ? "img" : "presentation"}
    aria-label={label || undefined} aria-hidden={label ? undefined : true} focusable="false" {...rest}>{PATHS[name]}</svg>;
}

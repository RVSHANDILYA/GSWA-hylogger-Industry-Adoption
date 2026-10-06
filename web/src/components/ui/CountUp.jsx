import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import { easeOut } from "../../styles/theme.js";
export default function CountUp({ value, decimals = 0, suffix = "" }) {
  const ref = useRef(null);
  const visible = useInView(ref, {once: true});
  const reduced = useMotionPreference();
  const format = number => Number(number).toLocaleString("en-AU", {minimumFractionDigits: decimals, maximumFractionDigits: decimals}) + suffix;
  useEffect(() => {
    if (!ref.current || !visible || reduced) return undefined;
    const control = animate(0, value, {duration: 1.15, ease: easeOut,
      onUpdate: current => { if (ref.current) ref.current.textContent = format(current); }});
    return () => { control.stop(); if (ref.current) ref.current.textContent = format(value); };
    // Formatting is determined by these primitive values.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, decimals, suffix, visible, reduced]);
  return <span ref={ref} aria-label={format(value)}>{format(value)}</span>;
}

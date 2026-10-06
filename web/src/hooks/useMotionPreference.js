import { useSyncExternalStore } from "react";
import { useReducedMotion } from "framer-motion";
const query = "(prefers-reduced-motion: reduce)";
const subscribe = callback => {
  const media = window.matchMedia(query);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
};
const snapshot = () => window.matchMedia(query).matches;
export default function useMotionPreference() {
  const initialPreference = useReducedMotion();
  return useSyncExternalStore(subscribe, snapshot, () => true) || initialPreference === true;
}

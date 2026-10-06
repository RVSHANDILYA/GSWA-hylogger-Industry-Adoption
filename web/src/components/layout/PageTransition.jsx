import { motion } from "framer-motion";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import { easeOut } from "../../styles/theme.js";
export default function PageTransition({ children }) {
  const reduced = useMotionPreference();
  return <motion.div initial={reduced ? false : {opacity: 0, y: 8}} animate={{opacity: 1, y: 0}}
    exit={reduced ? undefined : {opacity: 0, y: -4}} transition={{duration: reduced ? 0 : .3, ease: easeOut}}>{children}</motion.div>;
}

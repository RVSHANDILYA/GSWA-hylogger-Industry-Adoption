import { motion, useReducedMotion } from "framer-motion";
import { easeOut } from "../../styles/theme.js";

/*
  Wrap every page in this. AnimatePresence in App.jsx keys on the pathname, so
  the outgoing page finishes its exit before the incoming one starts, which is
  what stops a route change reading as a jump cut.

  Keep the movement small. A page that slides a long way reads as a slideshow,
  not a site. Eight pixels and a fade is enough to say "this is a new page".

  Anyone who has asked their system to reduce motion gets the same pages with
  the movement removed rather than a different layout.
*/
export default function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();

  const variants = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.28, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}

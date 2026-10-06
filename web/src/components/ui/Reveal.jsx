import { motion } from "framer-motion";
import useMotionPreference from "../../hooks/useMotionPreference.js";
import { easeOut } from "../../styles/theme.js";
export default function Reveal({ children, className, delay = 0, ...rest }) {
  const reduced = useMotionPreference();
  return <motion.section className={className} data-reveal {...rest}
    initial={reduced ? false : {opacity: 0, y: 18}} whileInView={{opacity: 1, y: 0}}
    viewport={{once: true, amount: .08}} transition={{duration: reduced ? 0 : .55, delay: reduced ? 0 : delay, ease: easeOut}}>
    {children}</motion.section>;
}

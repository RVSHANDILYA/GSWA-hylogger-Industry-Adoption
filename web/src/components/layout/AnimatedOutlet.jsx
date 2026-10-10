import { cloneElement } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

/*
  The one place page transitions are wired up.

  useOutlet gives us the matched page as an element, and re-keying it on the
  pathname is what tells AnimatePresence a page has been swapped. mode="wait"
  holds the incoming page until the outgoing one has finished leaving, so the
  two never overlap and the layout does not jump.

  This sits inside Layout rather than around the whole router on purpose. If
  the nav bar were inside AnimatePresence it would unmount on every route
  change instead of staying available during navigation.
*/
export default function AnimatedOutlet() {
  const location = useLocation();
  const element = useOutlet();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {element && cloneElement(element, { key: location.pathname })}
    </AnimatePresence>
  );
}

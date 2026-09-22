import styles from "./Card.module.css";

/*
  The one surface every panel on the site is built from.

  `as` lets a card become a button when it is clickable, so keyboard users get
  the behaviour they expect rather than a div that happens to have an onClick.
*/
export default function Card({
  children,
  as: Component = "div",
  padding = "padded",
  interactive = false,
  selected = false,
  className = "",
  ...rest
}) {
  const classes = [
    styles.card,
    styles[padding],
    interactive && styles.interactive,
    selected && styles.selected,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes} {...rest}>
      {children}
    </Component>
  );
}

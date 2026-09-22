import { Link } from "react-router-dom";
import Icon from "./Icon.jsx";
import styles from "./Button.module.css";

/*
  One button, three variants, three sizes.

  Pass `to` and it renders a router Link, pass nothing and it renders a real
  <button>. That keeps navigation as links (middle click, open in new tab and
  the back button all keep working) without every caller having to think
  about it.
*/
export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  trailingIcon,
  leadingIcon,
  className = "",
  ...rest
}) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {leadingIcon && <Icon name={leadingIcon} size={17} className={styles.icon} />}
      {children}
      {trailingIcon && (
        <Icon
          name={trailingIcon}
          size={17}
          className={`${styles.icon} ${styles.trailing}`}
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}

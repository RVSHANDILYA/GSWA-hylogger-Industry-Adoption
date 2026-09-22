import Icon from "./Icon.jsx";
import styles from "./SearchField.module.css";

/*
  Controlled search input. The caller owns the value, this only renders it.

  It carries a visible label through aria-label rather than a floating one,
  because the field sits in a toolbar row where a stacked label would push
  the controls out of line.
*/
export default function SearchField({
  value,
  onChange,
  placeholder = "Search",
  label = "Search",
  id = "search-field",
  className = "",
}) {
  return (
    <div className={`${styles.wrapper} ${className}`.trim()}>
      <Icon name="search" size={17} className={styles.icon} />
      <input
        id={id}
        type="search"
        className={styles.input}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <Icon name="x" size={15} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

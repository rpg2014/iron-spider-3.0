import styles from "./Switch.module.css";

export const Switch = (props: { state: boolean; setState: (arg0: boolean) => void }) => {
  return (
    <label className={styles.switch}>
      <input type={"checkbox"} checked={props.state} onChange={() => props.setState(!props.state)} />
      <span className={`${styles.slider} ${styles.round}`}></span>
    </label>
  );
};

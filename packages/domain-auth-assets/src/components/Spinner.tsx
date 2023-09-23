import styles from "./Spinner.module.scss";

export default function Spinner(props: {className?: string}) {
  return (
        <div className={`${styles.ldsRing} ${props.className}`}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  );
}

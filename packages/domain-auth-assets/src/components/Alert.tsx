import styles from "./Alert.module.scss";

const ErrorAlert = ({
  children,
  style,
  variant,
}: {
  children: any;
  style?: React.CSSProperties;
  variant?: "danger" | "success" | "grey";
}) => {
  const alertStyle = {
    ...style, // Merge with additional styles if provided
  };

  switch (variant) {
    case "danger":
      // no change to style needed
      break;
    case "grey": // green
      alertStyle.backgroundColor = "rgba(109, 109, 109,0.1)";
      alertStyle.borderColor = "rgb(109, 109, 109)";
      break;
    case "success": // grey
      alertStyle.backgroundColor = "rgba(0,255,0,0.1)";
      alertStyle.borderColor = "rgb(0,255,0)";
      break;
  }

  return (
    <div className={styles.alert} style={alertStyle}>
      {children}
    </div>
  );
};

export default ErrorAlert;

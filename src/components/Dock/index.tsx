import classNames from "classnames";
import styles from "./Dock.module.scss";

export default function Dock() {
  const containerClasses = classNames("fixed bottom-1 flex px-4 left-1/2 -translate-x-1/2", styles.container);

  return (
    <footer className={containerClasses}>
      <button>
        <img src="https://rauno.me/static/bg.png" alt="" />
      </button>
    </footer>
  );
}

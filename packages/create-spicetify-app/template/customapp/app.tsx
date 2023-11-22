import React from "react";
import styles from "./css/app.module.scss";

class App extends React.Component<{}, { count: number }> {
  state = {
    count: 0,
  };

  onButtonClick = () => {
    this.setState((state) => {
      return {
        count: state.count + 1,
      };
    });
  };

  render() {
    return (
      <>
        <div className={styles.container}>
          <div className={styles.title}>{"My Custom App!"}</div>
          <button className={styles.button} onClick={this.onButtonClick}>
            {"Count up"}
          </button>
          <div className={styles.counter}>{this.state.count}</div>
        </div>
      </>
    );
  }
}

export default App;

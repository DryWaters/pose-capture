import React from "react";
import styles from "./Layout.module.css";

const Layout = props => (
  <div className={styles.layoutContainer}>
    {props.children}
  </div>
);

export default Layout;

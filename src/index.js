import React from "react";
import ReactDOM from "react-dom";
import CapturePosePage from '../src/pages/CapturePosePage/CapturePosePage';
import Layout from '../src/components/Layout/Layout';

import "bootstrap/dist/css/bootstrap.min.css";

const jsx = (
  <Layout>
    <CapturePosePage />
  </Layout>
);

ReactDOM.render(jsx, document.getElementById("root"));

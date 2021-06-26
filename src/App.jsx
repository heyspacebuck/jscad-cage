import React, { useState, createRef } from "react";
import { Renderer } from "jscad-react";
import { Row, Col } from "react-bootstrap";

import STLExport from "./components/STLExport.jsx";
import ParamSliders from "./components/ParamSliders.jsx";

import { makeCage, makeBase } from "./components/cage.js";

export const App = () => {
  // State variables, parameters, output geometry
  const [cageParams, setCageParams] = useState({
    penisLength: 90,
    cageBarCount: 8,
    slitWidth: 12,
    bendPointX: 50,
    bendPointZ: 15
  });
  const [baseParams, setBaseParams] = useState({
    baseRingDiameter: 45,
    baseRingThickness: 6,
    wavyBase: true,
    waveAngle: 12
  });
  const [sharedParams, setSharedParams] = useState({
    renderQuality: "Low",
    separateParts: false,
    cageDiameter: 35,
    cageBarThickness: 4,
    gap: 10,
    cageTilt: 15,
    lockMargin: 0.1,
    partMargin: 0.2
  });
  const [cageParts, setCageParts] = useState(
    makeCage(cageParams, sharedParams)
  );
  const [baseParts, setBaseParts] = useState(
    makeBase(baseParams, sharedParams)
  );
  const [renderWidth, setRenderWidth] = useState(500);
  const renderRef = createRef();

  // On any parameter change:
  const updateParam = (newParam) => {
    let key = Object.keys(newParam)[0];
    if (Object.keys(cageParams).includes(key)) {
      updateCageParams(newParam);
    } else if (Object.keys(baseParams).includes(key)) {
      updateBaseParams(newParam);
    } else if (Object.keys(sharedParams).includes(key)) {
      updateSharedParams(newParam);
    }
  };

  // On specific parameter changes
  const updateCageParams = (newParams) => {
    setCageParams({ ...cageParams, ...newParams });
    setCageParts(makeCage({ ...cageParams, ...newParams }, sharedParams));
  };
  const updateBaseParams = (newParams) => {
    setBaseParams({ ...baseParams, ...newParams });
    setBaseParts(makeBase({ ...baseParams, ...newParams }, sharedParams));
  };
  const updateSharedParams = (newParams) => {
    setSharedParams({ ...sharedParams, ...newParams });
    setCageParts(makeCage(cageParams, { ...sharedParams, ...newParams }));
    setBaseParts(makeBase(baseParams, { ...sharedParams, ...newParams }));
  };

  // Add a vanilla JS event listener to recompute renderer width on window resize
  const resizeColumn = (e) => {
    setRenderWidth(renderRef.current?.getBoundingClientRect().width * 0.9);
  };
  window.onresize = resizeColumn;
  window.onload = resizeColumn;

  return (
    <div
      className="App"
      style={{
        overflowX: "hidden"
      }}
    >
      <Row>
        <Col ref={renderRef} md="6" id="renderer">
          <header className="App-header">
            <h1>Parametric Cage Playground</h1>
            <h3>Extremely alpha release</h3>
          </header>
          <Renderer
            solids={[...cageParts, ...baseParts]}
            width={renderWidth}
            options={{
              gridOptions: {
                show: true,
                subColor: [0, 0, 0, 0.5],
                color: [0, 0, 0, 1],
                size: [160, 160],
                ticks: [10, 2.5]
              }, // Worth noting that color/subColor seems to be broken on Chrome for some values
              viewerOptions: { initialPosition: [40, -160, 160] }
            }}
          />
          <STLExport input={[...cageParts, ...baseParts]} />{" "}
          {/* TODO ADD A LOADING BUTTON OR SOMETHING*/}
        </Col>
        <Col
          md="6"
          style={{
            maxHeight: "100vh",
            overflowX: "hidden",
            overflowY: "scroll"
          }}
        >
          <ParamSliders
            params={{ ...cageParams, ...baseParams, ...sharedParams }}
            onChange={updateParam}
          />
        </Col>
      </Row>
    </div>
  );
};

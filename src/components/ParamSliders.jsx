import React, { Fragment } from "react";
import { Form, Col, Row } from "react-bootstrap";
import BootstrapSlider from "./BootstrapSlider.jsx";
import BootstrapCheckbox from "./BootstrapCheckbox.jsx";

const ParamSliders = (props) => {
  return (
    <Fragment>
      <Form style={{ width: "40em", padding: "1em" }}>
        <Form.Group>
          <Row>
            <Form.Label>{"Render quality"}</Form.Label>
            <Form.Control
              as="select"
              defaultValue="Low"
              onChange={(e) =>
                props.onChange({ renderQuality: e.target.value })
              }
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </Form.Control>
          </Row>
        </Form.Group>
      </Form>
      <BootstrapCheckbox
        label="Cage and base ring separated"
        value={props.params.separateParts}
        onChange={(e) => props.onChange({ separateParts: !!e })}
      />
      <BootstrapSlider
        label={"Cage diameter"}
        min={25}
        max={50}
        step={0.1}
        value={props.params.cageDiameter}
        onChange={(e) => props.onChange({ cageDiameter: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Length from base ring to cage tip"}
        min={30}
        max={180}
        step={1}
        value={props.params.penisLength}
        onChange={(e) => props.onChange({ penisLength: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Base ring diameter"}
        min={30}
        max={60}
        step={1}
        value={props.params.baseRingDiameter}
        onChange={(e) => props.onChange({ baseRingDiameter: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Base ring thickness"}
        min={4}
        max={10}
        step={0.1}
        value={props.params.baseRingThickness}
        onChange={(e) => props.onChange({ baseRingThickness: parseFloat(e) })}
      />
      <BootstrapCheckbox
        label="Contoured base ring"
        value={props.params.wavyBase}
        onChange={(e) => props.onChange({ wavyBase: !!e })}
      />
      {props.params.wavyBase && (
        <BootstrapSlider
          label={"Contour angle (degrees)"}
          min={0}
          max={45}
          step={0.1}
          value={props.params.waveAngle}
          onChange={(e) => props.onChange({ waveAngle: parseFloat(e) })}
        />
      )}
      <BootstrapSlider
        label={"Gap between cage and base ring"}
        min={5}
        max={20}
        step={0.1}
        value={props.params.gap}
        onChange={(e) => props.onChange({ gap: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Cage bar thickness"}
        min={3}
        max={8}
        step={0.1}
        value={props.params.cageBarThickness}
        onChange={(e) => props.onChange({ cageBarThickness: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Number of cage bars"}
        min={1}
        max={24}
        step={1}
        value={props.params.cageBarCount}
        onChange={(e) => props.onChange({ cageBarCount: parseInt(e) })}
      />
      <BootstrapSlider
        label={"Front opening slit width"}
        min={0}
        max={40}
        step={0.1}
        value={props.params.slitWidth}
        onChange={(e) => props.onChange({ slitWidth: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Cage tilt angle (degrees)"}
        min={0}
        max={45}
        step={0.1}
        value={props.params.cageTilt}
        onChange={(e) => props.onChange({ cageTilt: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Extra play around the lock slot"}
        min={0}
        max={1}
        step={0.01}
        value={props.params.lockMargin}
        onChange={(e) => props.onChange({ lockMargin: parseFloat(e) })}
      />
      <BootstrapSlider
        label={"Extra play at interface of cage and base ring"}
        min={0}
        max={1}
        step={0.01}
        value={props.params.partMargin}
        onChange={(e) => props.onChange({ partMargin: parseFloat(e) })}
      />
      <BootstrapSlider
        label={
          "X-axis coordinate of the bend point (the center of the arc the cage bends around)"
        }
        min={0}
        max={200}
        step={0.1}
        value={props.params.bendPointX}
        onChange={(e) => props.onChange({ bendPointX: parseFloat(e) })}
      />
      <BootstrapSlider
        label={
          "Z-axis coordinate of the bend point (the center of the arc the cage bends around)"
        }
        min={0}
        max={200}
        step={0.1}
        value={props.params.bendPointZ}
        onChange={(e) => props.onChange({ bendPointZ: parseFloat(e) })}
      />
    </Fragment>
  );
};

export default ParamSliders;

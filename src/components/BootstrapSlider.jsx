import React from "react";
import { Form, Col, Row } from "react-bootstrap";

const BootstrapSlider = (props) => {
  const [value, setValue] = React.useState(props.value);

  const onChange = (event) => {
    setValue(event.target.value);
    props.onChange(event.target.value);
  };

  return (
    <Form style={{ width: "40em", padding: "1em" }}>
      <Form.Group>
        <Row>
          <Form.Label>{props.label}</Form.Label>
        </Row>
        <Row>
          <Col xs="9">
            <Form.Control
              type="range"
              min={props.min}
              max={props.max}
              step={props.step}
              value={value}
              onChange={onChange}
            />
          </Col>
          <Col xs="3">
            <Form.Control value={value} onChange={onChange} />
          </Col>
        </Row>
      </Form.Group>
    </Form>
  );
};

export default BootstrapSlider;

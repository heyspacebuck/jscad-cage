import React from "react";
import { Form, Col, Row } from "react-bootstrap";

const BootstrapCheckbox = (props) => {
  const [value, setValue] = React.useState(props.value);

  const onChange = (event) => {
    setValue(event.target.checked);
    props.onChange(event.target.checked);
  };

  return (
    <Form style={{ width: "40em", padding: "1em" }}>
      <Form.Group>
        <Row>
          <Form.Check
            type="checkbox"
            label={props.label + "TODO: FIX THIS LABEL TO BE CLICKABLE"}
            onChange={onChange}
            checked={value}
          />
        </Row>
      </Form.Group>
    </Form>
  );
};

export default BootstrapCheckbox;

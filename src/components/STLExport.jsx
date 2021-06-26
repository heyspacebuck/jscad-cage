import React from "react";
import { Button } from "react-bootstrap";
import { booleans } from "@jscad/modeling";
import stlSerializer from "@jscad/stl-serializer";

const STLExport = (props) => {
  // We receive an array of polyhedra, we need to union them and then export as AMF
  const exportFile = () => {
    // TODO: add a loading indicator or something
    if (!props.input || props.input.length < 1) return;
    const union = booleans.union(...props.input);
    const rawData = stlSerializer.serialize({ binary: true }, union);
    const blob = new Blob(rawData, { type: "application/sla" });

    // How can I instigate a download without doing all this vanilla JS and ending it with a.click()?
    const a = document.createElement("a");
    const url = window.URL.createObjectURL(blob);
    a.style.display = "none";
    a.href = url;
    a.download = "cage.stl";
    a.click();
    window.URL.revokeObjectURL(url);
    document.activeElement.blur();
  };

  return (
    <Button variant="primary" size="lg" onClick={exportFile}>
      Export .stl
    </Button>
  );
};

export default STLExport;

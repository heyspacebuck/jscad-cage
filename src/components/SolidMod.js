"use strict";

import {
  transforms,
  extrusions,
  primitives,
  geometries,
  booleans,
  maths
} from "@jscad/modeling";

const toRad = Math.PI / 180;
const toDeg = 180 / Math.PI;
const sin = (degrees) => Math.sin(degrees * toRad);
const cos = (degrees) => Math.cos(degrees * toRad);

// Vector class
class SolidMod {
  constructor(basicObject) {
    this.isRetesselated = basicObject.isRetesselated;
    this.polygons = basicObject.polygons;
    this.transforms = basicObject.transforms;
  }

  rX = (deg) => new SolidMod(transforms.rotateX(deg * toRad, this));
  rY = (deg) => new SolidMod(transforms.rotateY(deg * toRad, this));
  rZ = (deg) => new SolidMod(transforms.rotateZ(deg * toRad, this));
  dX = (x) => new SolidMod(transforms.translateX(x, this));
  dY = (y) => new SolidMod(transforms.translateY(y, this));
  dZ = (z) => new SolidMod(transforms.translateZ(z, this));
  mX = () => new SolidMod(transforms.mirrorX(this));
  mY = () => new SolidMod(transforms.mirrorY(this));
  mZ = () => new SolidMod(transforms.mirrorZ(this));
  sY = (y) => new SolidMod(transforms.scaleY(y, this));
  translate = (v) => new SolidMod(transforms.translate(v, this));

  skewXZ = (n) =>
    new SolidMod(
      transforms.transform(
        maths.mat4.fromValues(1, 0, 0, 0, 0, 1, 0, 0, n, 0, 1, 0, 0, 0, 0, 1),
        this
      )
    ); // THE MATRIX IS COLUMN-MAJOR

  union = (array) => new SolidMod(booleans.union(this, ...array));
}

export default SolidMod;

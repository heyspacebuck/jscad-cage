"use strict";

const toRad = Math.PI / 180;
const toDeg = 180 / Math.PI;
const sin = (degrees) => Math.sin(degrees * toRad);
const cos = (degrees) => Math.cos(degrees * toRad);

// Vector class
class V3 extends Array {
  constructor(x = 0, y = 0, z = 0) {
    super(x, y, z);
    this.x = x;
    this.y = y;
    this.z = z;
  }

  norm = () => Math.hypot(...this);

  plus = (that) => new V3(this.x + that[0], this.y + that[1], this.z + that[2]);
  minus = (that) =>
    new V3(this.x - that[0], this.y - that[1], this.z - that[2]);
  dot = (that) => this.x * that[0] + this.y * that[1] + this.z * that[2];
  translate = (that) => this.plus(that);
  dX = (x) => this.plus([x, 0, 0]);
  dY = (y) => this.plus([0, y, 0]);
  dZ = (z) => this.plus([0, 0, z]);
  sX = (x) => new V3(this.x * x, this.y, this.z);
  sY = (y) => new V3(this.x, this.y * y, this.z);
  sZ = (z) => new V3(this.x, this.y, this.z * z);
  mX = () => this.sX(-1);
  mY = () => this.sY(-1);
  mZ = () => this.sZ(-1);
  rX = (θ) =>
    new V3(
      this.x,
      this.y * cos(θ) - this.z * sin(θ),
      this.y * sin(θ) + this.z * cos(θ)
    );
  rY = (θ) =>
    new V3(
      this.x * cos(θ) + this.z * sin(θ),
      this.y,
      -this.x * sin(θ) + this.z * cos(θ)
    );
  rZ = (θ) =>
    new V3(
      this.x * cos(θ) - this.y * sin(θ),
      this.x * sin(θ) + this.y * cos(θ),
      this.z
    );
  skewXY = (n) => this.plus([n * this.y, 0, 0]);
  skewXZ = (n) => this.plus([n * this.z, 0, 0]);
  skewYX = (n) => this.plus([0, n * this.x, 0]);
  skewYZ = (n) => this.plus([0, n * this.z, 0]);
  skewZX = (n) => this.plus([0, 0, this.x * n]);
  skewZY = (n) => this.plus([0, 0, this.y * n]);
}

export default V3;

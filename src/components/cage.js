"use strict";

import { extrusions, primitives, booleans, hulls } from "@jscad/modeling";
import V3 from "./V3.js";
import SolidMod from "./SolidMod.js";
//import { torus } from "@jscad/modeling/src/primitives";

const render = { Low: 12, Medium: 32, High: 64 };

// Define sin, cos, tan in degrees
const toRad = Math.PI / 180;
const toDeg = 180 / Math.PI;
const sin = (degrees) => Math.sin(degrees * toRad);
const cos = (degrees) => Math.cos(degrees * toRad);
const tan = (degrees) => Math.tan(degrees * toRad);
const norm = (vector) => Math.hypot(...vector);

const stealthLock = (margin, segments, unioned = false) => {
  let part1 = new SolidMod(
    primitives.cylinder({
      radius: 3.1 + margin,
      height: 19,
      center: [0, 0, 19 / 2],
      segments
    })
  ).rX(90);
  let part2 = new SolidMod(
    primitives.cuboid({ size: [3.2 + 2 * margin, 19, 8.1 + margin] })
  )
    .dZ(-(8.1 + margin) / 2)
    .dY(-19 / 2);
  let part3 = new SolidMod(
    extrusions.extrudeRotate(
      { angle: 75 * toRad, startAngle: -75 * toRad, segments },
      primitives.rectangle({
        size: [8.1 + margin, 7 + margin],
        center: [(8.1 + margin) / 2, (7 + margin) / 2]
      })
    )
  )
    .rX(90)
    .rY(90);
  return unioned
    ? new SolidMod(booleans.union(part1, part2, part3))
    : [part1, part2, part3];
};
const torus = (
  R,
  r,
  segments,
  startAngle = 0,
  arcLength = 360,
  rounded = false
) => {
  let part = [
    new SolidMod(
      primitives.torus({
        outerRadius: R,
        innerRadius: r,
        startAngle: startAngle * toRad,
        outerRotation: arcLength * toRad,
        innerSegments: segments,
        outerSegments: segments
      })
    )
  ];
  if (rounded) {
    part.push(
      new SolidMod(primitives.sphere({ radius: r, segments }))
        .dX(R)
        .rZ(startAngle),
      new SolidMod(primitives.sphere({ radius: r, segments }))
        .dX(R)
        .rZ(startAngle + arcLength)
    );
  }
  return part;
};

const makeCage = (cageParams, sharedParams) => {
  let { penisLength, cageBarCount, slitWidth, bendPointX, bendPointZ } =
    cageParams;
  let {
    renderQuality,
    separateParts,
    cageBarThickness,
    cageDiameter,
    cageTilt,
    lockMargin,
    partMargin,
    gap
  } = sharedParams;
  let segments = render[renderQuality];

  let cageRingThickness = 1.2 * cageBarThickness;
  let cageBarAngle = 360 / cageBarCount;
  let R1 = cageDiameter / 2;
  let r1 = cageBarThickness / 2;
  let r3 = cageRingThickness / 2;
  let cageLength = Math.max(penisLength - gap, R1 + (R1 + r1) * sin(cageTilt));

  let rounding = 1; // Hard-coded for now, could be made a parameter

  // Some lock-case stuff that should probably change
  let lockCaseUpperRadius = 9;
  let lockCaseLowerRadius = 4;
  let mountWidth = 5;
  let mountHeight = 18;
  let mountLength = 24;
  let lockPlacement = new V3(5.6, 0, mountHeight / 2 + 1.5);

  // Some point geometry
  // P: Bend point
  // Q: upper endpoint of the straight segment of the cage
  // φ: arc length of curved cage segment (degrees)
  // R: Endpoint of curved cage segment
  let P = new V3(bendPointX, 0, bendPointZ);
  let dP = P.norm();
  let ψ = Math.atan2(P.z, P.x) * toDeg;
  let dQ = Math.min(dP * cos(90 - cageTilt - ψ), cageLength - R1);
  let Q = new V3(0, 0, dQ).rY(cageTilt);
  let curveRadius = P.minus(Q).norm();
  let φ = ((cageLength - dQ - R1) / curveRadius) * toDeg;
  let R = Q.minus(P).rY(φ).plus(P);

  // Begin various modules that use the above params

  const cageBarSegments = () => {
    let parts = [];
    for (let θ = cageBarAngle / 2; θ < 360; θ += cageBarAngle) {
      // Straight segment begins at a point along the base ring, and ends at a point a distance R1 from point Q
      let straightSegStart = new V3(R1 + r1, 0, 0).rZ(θ);
      let straightSegEnd = Q.plus(straightSegStart.rY(cageTilt));
      let curveSegEnd = straightSegEnd.minus(P).rY(φ).plus(P);

      // Compute cylinder properties
      let segmentAngle =
        90 -
        Math.atan2(
          straightSegEnd.z - straightSegStart.z,
          straightSegEnd.x - straightSegStart.x
        ) *
          toDeg;
      let segmentLength = straightSegEnd.minus(straightSegStart).norm();
      let newPart = new SolidMod(
        primitives.cylinder({
          height: segmentLength,
          radius: r1,
          center: [0, 0, segmentLength / 2],
          segments
        })
      )
        .rY(segmentAngle)
        .translate(straightSegStart);
      parts.push(newPart);
      // Make a partial torus between straightSegEnd and curveSegEnd, if necessary
      if (φ > 0) {
        // First, find the angle between the ends of the curve
        let v1 = straightSegEnd.minus(P);
        let v2 = curveSegEnd.minus(P);
        //let curveAngle = Math.acos(v1.dot(v2) / (v1.norm() * v2.norm())); // RADIANS
        let curveAngle =
          Math.acos(v1.dot(v2) / (v1.norm() * v2.norm())) * toDeg;
        let curveRadius = v1.norm();

        let curve = torus(curveRadius, r1, segments, 0, curveAngle, true);
        curve = curve.map((part) =>
          part
            .rX(-90)
            .dX(-curveRadius)
            .rY(-180 + cageTilt)
            .translate(straightSegEnd)
        );
        parts.push(...curve);
      }
    }
    return parts;
  };

  const glansCap = () => {
    // First, ensure the slit width is within the bounds of the cage geometry
    let realSlitWidth = Math.max(Math.min(slitWidth, cageDiameter), 0.1);
    let parts = [];
    // Add the ring around the base of glans cap
    parts.push(torus(R1 + r1, r1, segments, 0, 360)[0]);
    // Calculate start and end points of front slit bars
    let slitRadius =
      (R1 + r1) * cos(Math.asin(realSlitWidth / 2 / (R1 + r1)) * toDeg);
    let slitStart = new V3(slitRadius, -realSlitWidth / 2, 0);
    let slitEnd = slitStart.mX();
    // Add slit bars
    parts.push(
      torus(slitRadius, r1, segments, 0, 180)[0]
        .rX(90)
        .dY(-realSlitWidth / 2)
    );
    parts.push(
      torus(slitRadius, r1, segments, 0, 180)[0]
        .rX(90)
        .dY(realSlitWidth / 2)
    );
    // Add each cage bar (minus the part that would intersect the slit area)
    for (let θ = cageBarAngle / 2; θ < 180; θ += cageBarAngle) {
      // Skip bar if it is contained by slit area
      if ((R1 + r1) * sin(θ) > realSlitWidth / 2) {
        let distanceInSlit = realSlitWidth / 2 / sin(θ);
        let arcLength = Math.acos(distanceInSlit / (R1 + r1)) * toDeg;
        let bar = torus(R1 + r1, r1, segments, 0, arcLength, true);
        let bar1 = bar.map((part) => part.rX(90).rZ(θ));
        let bar2 = bar.map((part) => part.rX(90).rZ(180 + θ));
        parts.push(...bar1, ...bar2);
      }
    }
    // Rotate and translate all parts to the correct orientation
    parts = parts.map((solid) => solid.rY(φ + cageTilt).translate(R));
    return parts;
  };

  const cageLock = () => {
    let parts = [];
    // Create the solid arc that interfaces with the mating parts
    // Create a rounded rectangle profile to rotate-extrude
    let profile = Array.from(new Array(segments), (_, i) => {
      let [x, y] = [
        rounding * cos((360 / segments) * i),
        rounding * sin((360 / segments) * i)
      ];
      let dx = x < 0 ? rounding : cageBarThickness - rounding;
      let dy = y < 0 ? rounding : mountHeight * cos(cageTilt) - rounding;
      return [x + dx + R1, y + dy];
    });
    let arcLength = 60;
    let arcParts = [
      new SolidMod(
        extrusions.extrudeRotate(
          { angle: arcLength * toRad, segments },
          primitives.polygon({ points: profile, closed: true })
        )
      ),
      new SolidMod(
        primitives.roundedCylinder({
          height: mountHeight * cos(cageTilt),
          radius: r1,
          roundRadius: rounding,
          segments
        })
      )
        .dZ((mountHeight * cos(cageTilt)) / 2)
        .dX(R1 + r1),
      new SolidMod(
        primitives.roundedCylinder({
          height: mountHeight * cos(cageTilt),
          radius: r1,
          roundRadius: rounding,
          segments
        })
      )
        .dZ((mountHeight * cos(cageTilt)) / 2)
        .dX(R1 + r1)
        .rZ(arcLength)
    ];
    arcParts = arcParts.map((part) =>
      part.rZ(180 - arcLength / 2).skewXZ(tan(cageTilt))
    );

    parts.push(...arcParts);

    // Create the flat plane on which the mating parts slide
    let bulk = primitives.roundedCuboid({
      size: [mountWidth, mountLength, mountHeight * cos(cageTilt) + r3],
      center: [-R1 - r3, 0, (mountHeight * cos(cageTilt) + r3) / 2],
      roundRadius: rounding,
      segments
    });
    let cut = primitives.cylinder({ radius: R1 + r3, height: 400, segments });
    let mountFlat = new SolidMod(booleans.subtract(bulk, cut))
      .skewXZ(tan(cageTilt))
      .dZ(-r3);
    parts.push(mountFlat);

    // Create the cage's piece of the lock
    let innerDovetailLength = mountLength / 3 - partMargin;
    let bulkParts = [
      new SolidMod(
        primitives.roundedCylinder({
          radius: lockCaseLowerRadius,
          height: innerDovetailLength,
          roundRadius: rounding,
          segments
        })
      )
        .rX(90)
        .dZ(lockCaseLowerRadius - r3)
        .dX(
          -R1 - r3 - mountWidth / 2 - lockCaseUpperRadius + lockCaseLowerRadius
        ),
      new SolidMod(
        primitives.roundedCylinder({
          radius: lockCaseUpperRadius,
          height: innerDovetailLength,
          roundRadius: rounding,
          segments
        })
      )
        .rX(90)
        .dZ(mountHeight * cos(cageTilt) - lockCaseUpperRadius)
        .dX(-R1 - r3 - mountWidth / 2),
      new SolidMod(
        primitives.roundedCylinder({
          radius: lockCaseLowerRadius,
          height: innerDovetailLength,
          roundRadius: rounding,
          segments
        })
      )
        .rX(90)
        .dZ(lockCaseLowerRadius - r3),
      new SolidMod(
        primitives.roundedCylinder({
          radius: lockCaseLowerRadius,
          height: innerDovetailLength,
          roundRadius: rounding,
          segments
        })
      )
        .rX(90)
        .dZ(mountHeight * cos(cageTilt - lockCaseLowerRadius))
    ];

    bulk = new SolidMod(hulls.hull(...bulkParts)); // lockCaseShape
    let cut1 = new SolidMod(
      primitives.cylinder({ radius: R1 + r3, height: 400, segments })
    )
      .skewXZ(tan(cageTilt))
      .dZ(-r3);
    let cut2 = new SolidMod(
      primitives.cylinder({
        radius: 3.1 + lockMargin,
        height: mountLength - 19,
        segments
      })
    )
      .rX(-90)
      .dZ(lockPlacement.z)
      .rY(cageTilt)
      .dX(-R1 - r3 - mountWidth / 2 - lockPlacement.x);
    let cut3 = stealthLock(lockMargin, segments); // This is an array!
    cut3 = cut3.map((part) =>
      part
        .dY(19 - mountLength / 2)
        .dZ(lockPlacement.z)
        .rY(cageTilt)
        .dX(-R1 - r3 - mountWidth / 2 - lockPlacement.x)
    );
    parts.push(new SolidMod(booleans.subtract(bulk, cut1, cut2, ...cut3)));

    return parts;
  };

  const cageBaseRing = () => {
    return torus(R1 + r1, r3, segments);
  };

  let xShift = separateParts ? cageDiameter : 0; //
  //xShift += -20 + R1 + r1 + gap * tan(cageTilt);
  let zShift = separateParts ? r3 : gap; // TODO raise this

  return [
    ...cageBarSegments(),
    ...glansCap(),
    ...cageLock(),
    ...cageBaseRing()
  ].map((part) => part.dZ(zShift).dX(xShift));
};

const makeBase = (baseParams, sharedParams) => {
  let { baseRingDiameter, baseRingThickness, wavyBase, waveAngle } = baseParams;
  let {
    renderQuality,
    separateParts,
    cageBarThickness,
    cageDiameter,
    cageTilt,
    lockMargin,
    partMargin,
    gap
  } = sharedParams;
  let segments = render[renderQuality];

  // Other values calculated from parameters above
  let cageRingThickness = 1.2 * cageBarThickness;
  let R1 = cageDiameter / 2;
  let r1 = cageBarThickness / 2;
  let R2 = baseRingDiameter / 2;
  let r2 = baseRingThickness / 2;
  let r3 = cageRingThickness / 2;

  let rounding = 1; // Hard-coded for now, could be made a parameter

  // Some lock-case stuff that should probably change
  let lockCaseUpperRadius = 9;
  let lockCaseLowerRadius = 4;
  let baseLockBridgeWidth = 11;
  let mountWidth = 5;
  let mountHeight = 18;
  let mountLength = 24;
  let lockPlacement = new V3(5.6, 0, mountHeight / 2 + 1.5);

  let parts = [];
  // This is an exciting opportunity to build the wavy base in a proper parametric way that OpenSCAD couldn't really do!
  const wavyTorus = () => {};

  // Base ring
  let base = new SolidMod(torus(R2 + r2, r2, segments)[0]);
  let amplitude = wavyBase ? tan(waveAngle / 2) * R2 : 0;
  if (wavyBase) {
    // base.polygons is an array of triangles; each triangle is an object with key "vertices" and value (array of 3 vertices); each vertex is an array of 3 floats
    // Compute amplitude of wave
    base.polygons.forEach((polygon) => {
      polygon.vertices = polygon.vertices.map((vertex) => {
        let [x, y, z] = vertex;
        let θ = Math.atan2(y, x) * toDeg;
        return [x, y, z + amplitude * cos(2 * (θ + 90))];
      });
    });
  }
  base = base.dX(R2 + r2 - R1 - r1 - gap * tan(cageTilt)).dZ(-gap);
  parts.push(base);

  // Outer part of lock slot
  // Build a hull like in cageLock() above
  let dovetailLength = mountLength / 3;
  let lockParts = [
    new SolidMod(
      primitives.roundedCylinder({
        radius: lockCaseLowerRadius,
        height: dovetailLength,
        roundRadius: rounding,
        segments
      })
    )
      .rX(90)
      .dZ(lockCaseLowerRadius - 2 * r3)
      .dX(
        -R1 - r3 - mountWidth / 2 - lockCaseUpperRadius + lockCaseLowerRadius
      ),
    new SolidMod(
      primitives.roundedCylinder({
        radius: lockCaseUpperRadius,
        height: dovetailLength,
        roundRadius: rounding,
        segments
      })
    )
      .rX(90)
      .dZ(mountHeight * cos(cageTilt) - lockCaseUpperRadius)
      .dX(-R1 - r3 - mountWidth / 2),
    new SolidMod(
      primitives.roundedCylinder({
        radius: lockCaseLowerRadius,
        height: dovetailLength,
        roundRadius: rounding,
        segments
      })
    )
      .rX(90)
      .dZ(lockCaseLowerRadius - 2 * r3),
    new SolidMod(
      primitives.roundedCylinder({
        radius: lockCaseLowerRadius,
        height: dovetailLength,
        roundRadius: rounding,
        segments
      })
    )
      .rX(90)
      .dZ(mountHeight * cos(cageTilt - lockCaseLowerRadius))
  ];

  // Assemble lock case
  let lockCase1 = new SolidMod(hulls.hull(...lockParts)).dY(mountLength / 3);
  let lockCase2 = new SolidMod(hulls.hull(...lockParts)).dY(-mountLength / 3);
  let lockCase = new SolidMod(booleans.union(lockCase1, lockCase2));

  // Remove the mortise lock from lock case
  let toRemove = [
    ...stealthLock(lockMargin, segments),
    new SolidMod(
      primitives.cylinder({
        radius: 3.1 + lockMargin,
        height: mountLength - 19,
        center: [0, 0, (mountLength - 19) / 2],
        segments
      })
    ).rX(-90)
  ].map((part) =>
    part
      .dY(19 - mountLength / 2)
      .dZ(lockPlacement.z)
      .rY(cageTilt)
      .dX(-R1 - r3 - mountWidth / 2 - lockPlacement.x)
      .sY(1.01)
  );
  lockCase = new SolidMod(booleans.subtract(lockCase, ...toRemove));

  // Only keep the lock case where it intersects with...whatever this is down here
  let cube = new SolidMod(
    primitives.roundedCuboid({
      size: [50, mountLength / 3, mountHeight * cos(cageTilt) + 2 * r3],
      center: [25, mountLength / 6, (mountHeight * cos(cageTilt)) / 2 + r3],
      roundRadius: rounding,
      segments
    })
  );
  let toIntersect = new SolidMod(
    booleans.union(
      cube
        .dY(-mountLength / 2)
        .dX(R1 + r3 + mountWidth / 2 + partMargin)
        .rZ(180)
        .dZ(-r3)
        .skewXZ(tan(cageTilt))
        .dZ(-r3),
      cube
        .dY(mountLength / 6)
        .dX(R1 + r3 + mountWidth / 2 + partMargin)
        .rZ(180)
        .dZ(-r3)
        .skewXZ(tan(cageTilt))
        .dZ(-r3)
    )
  );
  lockCase = new SolidMod(booleans.intersect(lockCase, toIntersect));

  parts.push(lockCase); /// Whyyyyy is lockCase too low

  // Add connecting block between lock part and base ring
  let borders = [
    new SolidMod(
      primitives.roundedCuboid({
        size: [baseLockBridgeWidth, mountLength, r3 - partMargin],
        center: [
          baseLockBridgeWidth / 2,
          mountLength / 2,
          (r3 - partMargin) / 2
        ],
        roundRadius: (r3 - partMargin) / 2.1,
        segments
      })
    )
      .dX(R1 + 2 * r3 * sin(cageTilt) + partMargin)
      .rZ(180)
      .dY(mountLength / 2)
      .dZ(-2 * r3),
    new SolidMod(
      primitives.cylinder({ radius: r3 / 2, height: mountLength, segments })
    )
      .rX(90)
      .dX(-R1 - r3 - gap * sin(cageTilt))
      .dZ(-gap),
    ...torus(R2 + 2 * r2, r3 / 2, segments, 0, 30).map((part) =>
      part
        .rZ(165)
        .dZ(-gap)
        .dX(R2 + 2 * r2 - R2 - r3 - r2 - gap * sin(cageTilt))
    )
  ];
  parts.push(new SolidMod(hulls.hull(...borders)));

  let xShift = separateParts ? -R2 - baseRingThickness : 0;
  let zShift = separateParts ? r2 + amplitude + gap : gap; // TODO: THESE VALUES NEED TUNING I THINK
  return parts.map((part) => part.dZ(zShift).dX(xShift));
};

module.exports = { makeCage, makeBase };

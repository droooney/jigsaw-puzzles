import {
  CUBIC_TANGENT_RATIO_1,
  CUBIC_TANGENT_RATIO_2,
  JUT_ANGLE,
  JUT_CUT_SIZE,
  JUT_DISTANCE,
  JUT_RADIUS,
  PIECE_SIZE,
} from 'constants/puzzle';

import { Side } from 'types/puzzle';

class Point {
  x: number;
  y: number;

  constructor(x: number, y: number, side: Side, isOuter: boolean) {
    y = isOuter ? y : -y;

    ({ x: this.x, y: this.y } = (
      side === Side.TOP
        ? { x, y }
        : side === Side.RIGHT
          ? { x: -y, y: x }
          : side === Side.BOTTOM
            ? { x: -x, y: -y }
            : { x: y, y: -x }
    ));
  }

  toString() {
    return `${this.x},${this.y}`;
  }
}

interface Options {
  isOuter: boolean;
  isEdge: boolean;
  xOffset: number;
}

export const drawPieceSide = (side: Side, options: Options): string => {
  const X = options.xOffset * PIECE_SIZE;
  const e = JUT_RADIUS * Math.sin(JUT_ANGLE / 2);
  const v = JUT_CUT_SIZE / 2 - e;
  const c = JUT_DISTANCE / Math.tan(JUT_ANGLE / 2);
  const k = (v + c) * (1 - CUBIC_TANGENT_RATIO_1);
  const d = JUT_DISTANCE * CUBIC_TANGENT_RATIO_2;
  const f = c * CUBIC_TANGENT_RATIO_2;
  const s = v + c - f;

  if (options.isEdge) {
    return `l ${new Point(PIECE_SIZE, 0, side, false)}`;
  }

  const firstCubicStartPoint = new Point(X, 0, side, options.isOuter);
  const firstCubicFirstPoint = new Point(k, 0, side, options.isOuter);
  const firstCubicSecondPoint = new Point(s, -d, side, options.isOuter);
  const startArcPoint = new Point(v, -JUT_DISTANCE, side, options.isOuter);
  const endArcPoint = new Point(2 * e, 0, side, options.isOuter);
  const secondCubicFirstPoint = new Point(v - s, JUT_DISTANCE - d, side, options.isOuter);
  const secondCubicSecondPoint = new Point(v - k, JUT_DISTANCE, side, options.isOuter);
  const secondCubicEndPoint = new Point(v, JUT_DISTANCE, side, options.isOuter);
  const endPoint = new Point(PIECE_SIZE - X - JUT_CUT_SIZE, 0, side, options.isOuter);

  return `
    l ${firstCubicStartPoint}
    c ${firstCubicFirstPoint} ${firstCubicSecondPoint} ${startArcPoint}
    a ${JUT_RADIUS},${JUT_RADIUS} 0 1 ${options.isOuter ? 1 : 0} ${endArcPoint}
    c ${secondCubicFirstPoint} ${secondCubicSecondPoint} ${secondCubicEndPoint}
    l ${endPoint}
  `;
};

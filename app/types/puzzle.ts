export interface Workspace<T> {
  id: number;
  name: string;
  groups: PieceGroup<T>[];
}

export interface PieceGroup<T> {
  id: number;
  zIndex: number;
  pieces: T[];
}

export enum Side {
  TOP,
  RIGHT,
  BOTTOM,
  LEFT,
}

export interface SideInfo {
  path: string;
  isOuter: boolean;
}

export interface DBPiece {
  // id
  i: number;

  // isOuter
  o: boolean[];
  x: number;
  y: number;

  // top side
  t: Side;
}

export interface Piece {
  id: number;
  sidesInfo: SideInfo[];
  x: number;
  y: number;
  row: number;
  col: number;
  topSide: Side;
}

export interface Dimensions {
  width: number;
  height: number;
}

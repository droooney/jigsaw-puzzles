export interface DBWorkspace {
  name: string;
  groups: DBPieceGroup[];
}

export interface Workspace {
  id: number;
  name: string;
  groups: PieceGroup[];
}

export interface DBPieceGroup {
  z: number;
  p: DBPiece[];
}

export interface PieceGroup {
  id: number;
  pieces: Piece[];
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
  groupId: number;
  sidesInfo: SideInfo[];
  x: number;
  y: number;
  row: number;
  col: number;
  topSide: Side;
}

import { Dimensions } from 'types/common';

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
  x: number;
  y: number;
  t: Side;
  p: DBPiece[];
}

export interface PieceGroup {
  id: number;
  x: number;
  y: number;
  topSide: Side;
  dimensions: Dimensions;
  minRow: number;
  minCol: number;
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
  i: number;
  o: number[];
}

export interface Piece {
  id: number;
  groupId: number;
  sidesInfo: SideInfo[];
  row: number;
  col: number;
}

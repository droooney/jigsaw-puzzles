export interface Workspace {
  id: number;
  name: string;
  groups: PieceGroup[];
}

export interface PieceGroup {
  id: number;
  zIndex: number;
  pieces: Piece[];
}

export interface Piece {
  id: number;
  paths: {
    top: string;
    right: string;
    bottom: string;
    left: string;
  };
  x: number;
  y: number;
  puzzleX: number;
  puzzleY: number;
  workspaceX: number;
  workspaceY: number;
  rotation: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

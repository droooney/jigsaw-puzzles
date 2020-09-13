import { Model } from 'idb-model';
import times from 'lodash/times';
import Parallel from 'paralleljs';

import { JUT_OFFSET, PIECE_SIZE } from 'constants/puzzle';

import { DBPiece, DBWorkspace, Side, Workspace } from 'types/puzzle';
import { Dimensions } from 'types/common';

import { db } from 'helpers/db';
import { drawPieceSide } from 'helpers/paths';

export interface PuzzleAttributes {
  id: string;
  dimensions: Dimensions;
  image: Blob;
  dbWorkspaces: DBWorkspace[];
}

// eslint-disable-next-line semi
export default interface Puzzle extends PuzzleAttributes {}

// eslint-disable-next-line no-redeclare
export default class Puzzle extends Model<PuzzleAttributes, 'id', 'dbWorkspaces'> {
  static modelName = 'puzzles';
  static primaryKey: 'id' = 'id';
  static defaultValues = {
    get dbWorkspaces(): DBWorkspace[] {
      return [];
    },
  };
  static fields = [
    'id',
    'image',
    'dimensions',
    'dbWorkspaces',
  ];

  static async generateId(): Promise<string> {
    while (true) {
      const id = times(10, () => (
        String.fromCharCode(97 + Math.floor(Math.random() * 26))
      )).join('');

      if (!await Puzzle.findByPrimary(id)) {
        return id;
      }
    }
  }

  static async getBestDimensions(width: number, height: number): Promise<{ dimensions: Dimensions; pieceSize: number; }> {
    return new Parallel({ width, height }).spawn(({ width, height }: Dimensions) => {
      const gcd = (x: number, y: number): number => {
        if (x === 0 || y === 0) {
          return x || y;
        }

        const min = Math.min(x, y);
        const max = Math.max(x, y);

        return gcd(min, max % min);
      };

      const lcd = (x: number, y: number) => x * y / gcd(x, y);

      const widthLowerBoundary = width * 0.95;
      const heightLowerBoundary = height * 0.95;
      const widthUpperBoundary = width * 1.05;
      const heightUpperBoundary = height * 1.05;

      let eventualWidth = width;
      let eventualHeight = height;

      for (let w = width; w >= widthLowerBoundary; w--) {
        for (let h = height; h >= heightLowerBoundary; h--) {
          if (lcd(w, h) < lcd(eventualWidth, eventualHeight)) {
            eventualWidth = w;
            eventualHeight = h;
          }
        }
      }

      for (let w = width; w <= widthUpperBoundary; w++) {
        for (let h = height; h <= heightUpperBoundary; h++) {
          if (lcd(w, h) < lcd(eventualWidth, eventualHeight)) {
            eventualWidth = w;
            eventualHeight = h;
          }
        }
      }

      const pieceSize = gcd(eventualWidth, eventualHeight);

      return {
        dimensions: {
          width: eventualWidth / pieceSize,
          height: eventualHeight / pieceSize,
        },
        pieceSize,
      };
    });
  }

  imageUrl: string | null = null;
  imageDimensions: Dimensions = { width: 0, height: 0 };
  workspaces: Workspace[] = [];

  beforeSave() {
    if (!this.workspaces.length) {
      return;
    }

    this.dbWorkspaces = this.workspaces.map((workspace) => ({
      name: workspace.name,
      groups: workspace.groups.map((group, groupIndex) => ({
        z: groupIndex,
        p: group.pieces.map((piece) => ({
          i: piece.id,
          o: piece.sidesInfo.map(({ isOuter }) => isOuter),
          x: piece.x,
          y: piece.y,
          t: piece.topSide,
        })),
      })),
    }));
  }

  calculateWorkspaces() {
    this.workspaces = this.dbWorkspaces.map((workspace, workspaceId) => ({
      id: workspaceId,
      name: workspace.name,
      groups: workspace.groups.map((group, groupId) => ({
        id: groupId,
        zIndex: group.z,
        pieces: group.p.map((piece) => {
          const row = Math.floor(piece.i / this.dimensions.width);
          const col = piece.i % this.dimensions.width;

          return {
            id: piece.i,
            groupId,
            sidesInfo: piece.o.map((isOuter, side) => ({
              path: drawPieceSide(side as Side, {
                isOuter,
                isEdge: this.isEdge(row, col, side as Side),
                xOffset: JUT_OFFSET,
              }),
              isOuter,
            })),
            x: piece.x,
            y: piece.y,
            row,
            col,
            topSide: piece.t,
          };
        }),
      })),
    }));
  }

  isEdge(row: number, col: number, side: Side): boolean {
    if (side === Side.TOP) {
      return row === 0;
    }

    if (side === Side.RIGHT) {
      return col === this.dimensions.width - 1;
    }

    if (side === Side.BOTTOM) {
      return row === this.dimensions.height - 1;
    }

    return col === 0;
  }

  generatePieces() {
    const pieces: DBPiece[] = [];
    const piecesTable: DBPiece[][] = [];

    for (let row = 0; row < this.dimensions.height; row++) {
      piecesTable.push([]);

      for (let col = 0; col < this.dimensions.width; col++) {
        const piece: DBPiece = {
          i: row * this.dimensions.width + col,
          o: times(4, (side) => (
            (
              (side === Side.TOP && row !== 0)
              || (side === Side.LEFT && col !== 0)
            )
              ? side === Side.TOP
                ? !piecesTable[row - 1][col].o[Side.BOTTOM]
                : !piecesTable[row][col - 1].o[Side.RIGHT]
              : this.isEdge(row, col, side)
                ? false
                : Math.random() >= 0.5
          )),
          x: col * PIECE_SIZE * 1.5,
          y: row * PIECE_SIZE * 1.5,
          t: Math.floor(Math.random() * 4) as Side,
        };

        pieces.push(piece);
        piecesTable[row].push(piece);
      }
    }

    this.dbWorkspaces = [{
      name: 'Main',
      groups: pieces.map((piece, index) => ({
        z: index,
        p: [piece],
      })),
    }];
  }

  async loadImage() {
    this.imageUrl = URL.createObjectURL(this.image);

    await new Promise((resolve) => {
      const image = new Image();
      const url = URL.createObjectURL(this.image);

      image.addEventListener('load', () => {
        this.imageDimensions = {
          width: image.width,
          height: image.height,
        };

        resolve();
      });

      image.src = url;
    });
  }

  revokeImageUrl() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }
}

db.model(Puzzle);

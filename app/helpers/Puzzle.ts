import { Model } from 'idb-model';
import times from 'lodash/times';
import Parallel from 'paralleljs';

import { Dimensions, Workspace } from 'types/puzzle';

import { db } from 'helpers/db';

export interface PuzzleAttributes {
  id: string;
  image: Blob;
  workspaces: Workspace[];
}

export interface Puzzle extends PuzzleAttributes {}

// eslint-disable-next-line no-redeclare
export class Puzzle extends Model<PuzzleAttributes, 'id', 'workspaces'> {
  static modelName = 'puzzles';
  static primaryKey: 'id' = 'id';
  static defaultValues = {
    get workspaces(): Workspace[] {
      return [];
    },
  };
  static fields = [
    'id',
    'image',
    'workspaces',
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

  createImageUrl() {
    this.imageUrl = URL.createObjectURL(this.image);
  }

  revokeImageUrl() {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl);
    }
  }
}

db.model(Puzzle);

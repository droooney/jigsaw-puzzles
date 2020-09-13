import React from 'react';

import { JUT_SIZE, PIECE_SIZE } from 'constants/puzzle';

import { Side } from 'types/puzzle';

import Puzzle from 'helpers/Puzzle';

interface Props {
  puzzle: Puzzle;
  workspaceIndex: number;
}

const WorkspaceMetadata: React.FC<Props> = (props) => {
  const {
    puzzle,
    workspaceIndex,
  } = props;

  return (
    <defs>
      {puzzle.workspaces[workspaceIndex].groups.map((pieceGroup) => (
        pieceGroup.pieces.map((piece) => (
          <pattern
            key={piece.id}
            id={`image-${piece.id}`}
            width="100%"
            height="100%"
            viewBox={`
              ${piece.col - (piece.sidesInfo[Side.LEFT].isOuter ? JUT_SIZE / PIECE_SIZE : 0)}
              ${piece.row - (piece.sidesInfo[Side.TOP].isOuter ? JUT_SIZE / PIECE_SIZE : 0)}
              ${1 + (+piece.sidesInfo[Side.LEFT].isOuter + +piece.sidesInfo[Side.RIGHT].isOuter) * JUT_SIZE / PIECE_SIZE}
              ${1 + (+piece.sidesInfo[Side.TOP].isOuter + +piece.sidesInfo[Side.BOTTOM].isOuter) * JUT_SIZE / PIECE_SIZE}
            `}
          >
            <image
              href={puzzle.imageUrl || ''}
              width={puzzle.dimensions.width}
              height={puzzle.dimensions.height}
              preserveAspectRatio="xMidYMid slice"
            />
          </pattern>
        ))
      ))}
    </defs>
  );
};

export default React.memo(WorkspaceMetadata);

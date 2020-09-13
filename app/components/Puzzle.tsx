import React, { useEffect, useState } from 'react';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';

import { JUT_SIZE, PIECE_SIZE } from 'constants/puzzle';

import { Side } from 'types/puzzle';

import Puzzle from 'helpers/Puzzle';

import LoadingOverlay from 'components/LoadingOverlay';

const Root = styled.div`
  height: 100%;

  .workspace {
    width: 100%;
    height: 100%;
  }
`;

const PuzzlePage: React.FC = () => {
  const {
    params: {
      puzzleId,
    },
  } = useRouteMatch<{ puzzleId: string; }>();
  const history = useHistory();
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const puzzle = await Puzzle.findByPrimary(puzzleId);

        if (!puzzle) {
          throw new Error('No puzzle found');
        }

        puzzle.calculateWorkspaces();

        await puzzle.loadImage();

        setPuzzle(puzzle);
      } catch {
        history.push('/');
      }
    })();
  }, [history, puzzleId]);

  useEffect(() => {
    return () => {
      puzzle?.revokeImageUrl();
    };
  }, [puzzle]);

  if (!puzzle) {
    return (
      <div>
        <LoadingOverlay />
      </div>
    );
  }

  return (
    <Root>
      <svg className="workspace">
        <defs>
          {puzzle.workspaces[0].groups[0].pieces.map((piece) => (
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
          ))}
        </defs>

        {puzzle.workspaces[0].groups[0].pieces.map((piece) => (
          <path
            key={piece.id}
            d={`M 0,0 ${piece.sidesInfo.map(({ path }) => path).join(' ')}`}
            style={{
              transform: `translate(${piece.x}px, ${piece.y}px)`,
              // transform: `translate(${piece.x}px, ${piece.y}px) ${getRotationTransform(piece.topSide)}`,
              transformOrigin: `${PIECE_SIZE / 2}px ${PIECE_SIZE / 2}px`,
            }}
            fill={`url(#image-${piece.id})`}
          />
        ))}
      </svg>
    </Root>
  );
};

export default React.memo(PuzzlePage);

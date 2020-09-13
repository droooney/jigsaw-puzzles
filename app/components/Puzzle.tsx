import React, { useCallback, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import classNames from 'classnames';

import { PIECE_SIZE } from 'constants/puzzle';

import { Piece, PieceGroup, Side } from 'types/puzzle';
import { Point } from 'types/common';

import Puzzle from 'helpers/Puzzle';

import useGlobalListener from 'hooks/useGlobalListener';

import LoadingOverlay from 'components/LoadingOverlay';
import WorkspaceMetadata from 'components/WorkspaceMetadata';

interface DragFieldInfo {
  active: boolean;
  mode: 'field';
  currentPoint: Point;
}

interface DragPieceInfo {
  active: boolean;
  mode: 'pieceGroup';
  pieceGroup: PieceGroup;
  pieceGroupElement: SVGGElement;
  currentPoint: Point;
}

type DragInfo = DragFieldInfo | DragPieceInfo;

const Root = styled.div`
  height: 100%;

  .background {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: #f001;
    cursor: grab;

    &.isDragging {
      cursor: grabbing;
    }
  }
`;

const getZoom = (zoomCounter: number) => 1.1 ** zoomCounter;

const getFieldTransform = (offset: Point, zoomCounter: number): string => {
  return `
    translate(${-offset.x}px, ${-offset.y}px)
    scale(${getZoom(zoomCounter)})
  `;
};

const getPieceGroupTransform = (pieceGroup: PieceGroup): string => `
  translate(${pieceGroup.x}px, ${pieceGroup.y}px)
  rotate(${-90 * pieceGroup.topSide}deg)
`;

const getSVGPieceCoords = (piece: Piece, pieceGroup: PieceGroup): Point => {
  const relativeCoords = Puzzle.getPieceRelativeCoords(piece, pieceGroup);

  return {
    x: pieceGroup.x + relativeCoords.x,
    y: pieceGroup.y + relativeCoords.y,
  };
};

const PuzzlePage: React.FC = () => {
  const {
    params: {
      puzzleId,
    },
  } = useRouteMatch<{ puzzleId: string; }>();
  const history = useHistory();
  const fieldRef = useRef<SVGSVGElement>(null);
  const dragInfoRef = useRef<DragInfo>({
    active: false,
    mode: 'field',
    currentPoint: { x: 0, y: 0 },
  });
  const fieldOffsetRef = useRef<Point>({ x: 0, y: 0 });
  const zoomCounterRef = useRef<number>(0);

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [pieceGroups, setPieceGroups] = useState<PieceGroup[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const setFieldTransform = () => {
    if (fieldRef.current) {
      fieldRef.current.style.transform = getFieldTransform(
        fieldOffsetRef.current,
        zoomCounterRef.current,
      );
    }
  };

  const changePieceGroup = useCallback(<K extends keyof PieceGroup>(
    groupId: number,
    update: Pick<PieceGroup, K> | ((piece: PieceGroup) => Pick<PieceGroup, K>),
  ) => {
    const groupIndex = pieceGroups.findIndex(({ id }) => id === groupId);

    if (groupIndex === -1) {
      return;
    }

    setPieceGroups([
      ...pieceGroups.slice(0, groupIndex),
      {
        ...pieceGroups[groupIndex],
        ...(typeof update === 'function' ? update(pieceGroups[groupIndex]) : update),
      },
      ...pieceGroups.slice(groupIndex + 1),
    ]);
  }, [pieceGroups]);

  const rotatePieceGroup = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const pieceId = e.target instanceof SVGPathElement
      ? e.target.dataset.pieceId
      : null;
    const groupId = e.target instanceof SVGPathElement
      ? e.target.dataset.groupId
      : null;

    const dragInfo = dragInfoRef.current;

    if (pieceId && dragInfo.mode === 'pieceGroup' && dragInfo.pieceGroup.id === +pieceId) {
      dragInfo.pieceGroup.topSide = (dragInfo.pieceGroup.topSide + 3) % 4 as Side;
      dragInfo.pieceGroupElement.style.transform = getPieceGroupTransform(dragInfo.pieceGroup);
    } else if (pieceId && groupId) {
      changePieceGroup(+groupId, (pieceGroup) => ({
        topSide: (pieceGroup.topSide + 3) % 4 as Side,
      }));
    }
  }, [changePieceGroup]);

  const onDragStart = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }

    const pieceId = e.target instanceof SVGPathElement
      ? e.target.dataset.pieceId
      : null;
    const groupId = e.target instanceof SVGPathElement
      ? e.target.dataset.groupId
      : null;

    if (pieceId && groupId) {
      const pieceGroupIndex = pieceGroups.findIndex(({ id }) => id === +groupId);

      if (pieceGroupIndex !== -1) {
        const pieceGroup = pieceGroups[pieceGroupIndex];

        dragInfoRef.current = {
          active: true,
          mode: 'pieceGroup',
          pieceGroup,
          pieceGroupElement: (e.target as SVGPathElement).closest('g')!,
          currentPoint: { x: e.clientX, y: e.clientY },
        };

        batchedUpdates(() => {
          setIsDragging(true);
          setPieceGroups([
            ...pieceGroups.slice(0, pieceGroupIndex),
            ...pieceGroups.slice(pieceGroupIndex + 1),
            pieceGroup,
          ]);
        });
      }
    } else {
      dragInfoRef.current = {
        active: true,
        mode: 'field',
        currentPoint: { x: e.clientX, y: e.clientY },
      };

      setIsDragging(true);
    }
  }, [pieceGroups]);

  const onDrag = (e: MouseEvent) => {
    const dragInfo = dragInfoRef.current;

    if (!dragInfo.active) {
      return;
    }

    const zoom = getZoom(zoomCounterRef.current);
    const coeff = dragInfo.mode === 'field' ? 1 : zoom;
    const dx = (e.clientX - dragInfo.currentPoint.x) / coeff;
    const dy = (e.clientY - dragInfo.currentPoint.y) / coeff;

    dragInfo.currentPoint = {
      x: e.clientX,
      y: e.clientY,
    };

    if (dragInfo.mode === 'field') {
      fieldOffsetRef.current = {
        x: fieldOffsetRef.current.x - dx,
        y: fieldOffsetRef.current.y - dy,
      };

      setFieldTransform();
    } else {
      dragInfo.pieceGroup = {
        ...dragInfo.pieceGroup,
        x: dragInfo.pieceGroup.x + dx,
        y: dragInfo.pieceGroup.y + dy,
      };

      dragInfo.pieceGroupElement.style.transform = getPieceGroupTransform(dragInfo.pieceGroup);
    }
  };

  const onDragEnd = (e: MouseEvent) => {
    if (!dragInfoRef.current.active) {
      return;
    }

    // eslint-disable-next-line no-bitwise
    if (e.buttons & 1) {
      return;
    }

    const dragInfo = dragInfoRef.current;

    dragInfoRef.current = {
      active: false,
      mode: 'field',
      currentPoint: { x: 0, y: 0 },
    };

    batchedUpdates(() => {
      setIsDragging(false);

      if (dragInfo.mode === 'pieceGroup') {
        const pieceGroup = dragInfo.pieceGroup;

        changePieceGroup(pieceGroup.id, pieceGroup);

        if (puzzle) {
          pieces: for (const piece of pieceGroup.pieces) {
            for (let s = 0; s < 4; s++) {
              const side = s as Side;
              const isEdge = puzzle.isEdge(piece.row, piece.col, side);

              if (isEdge) {
                continue;
              }

              const neighborPieceId = piece.id + (
                side === Side.TOP
                  ? -puzzle.dimensions.width
                  : side === Side.RIGHT
                    ? +1
                    : side === Side.BOTTOM
                      ? +puzzle.dimensions.width
                      : -1
              );

              let neighborPiece: Piece | null = null;
              let neighborPieceGroup: PieceGroup | null = null;

              groups: for (const group of pieceGroups) {
                if (group.id === pieceGroup.id) {
                  continue;
                }

                for (const piece of group.pieces) {
                  if (piece.id === neighborPieceId) {
                    neighborPiece = piece;
                    neighborPieceGroup = group;

                    break groups;
                  }
                }
              }

              if (
                neighborPiece
                && neighborPieceGroup
                && pieceGroup.topSide === neighborPieceGroup.topSide
              ) {
                const svgPieceCoords = getSVGPieceCoords(piece, pieceGroup);
                const svgNeighborPieceCoords = getSVGPieceCoords(neighborPiece, neighborPieceGroup);

                if (side === Side.TOP) {
                  svgNeighborPieceCoords.y += PIECE_SIZE;
                } else if (side === Side.RIGHT) {
                  svgNeighborPieceCoords.x -= PIECE_SIZE;
                } else if (side === Side.BOTTOM) {
                  svgNeighborPieceCoords.y -= PIECE_SIZE;
                } else {
                  svgNeighborPieceCoords.x += PIECE_SIZE;
                }

                if (
                  Math.abs(svgNeighborPieceCoords.x - svgPieceCoords.x)
                  + Math.abs(svgNeighborPieceCoords.y - svgPieceCoords.y) <= 10
                ) {
                  neighborPieceGroup.pieces = [
                    ...neighborPieceGroup.pieces,
                    ...pieceGroup.pieces,
                  ];

                  Object.assign(neighborPieceGroup, puzzle.getPieceGroupInfo(neighborPieceGroup));

                  pieceGroup.pieces.forEach((piece) => {
                    piece.groupId = neighborPieceGroup!.id;
                  });

                  const pieceGroupIndex = pieceGroups.findIndex(({ id }) => id === pieceGroup.id);

                  if (pieceGroupIndex !== -1) {
                    setPieceGroups([
                      ...pieceGroups.slice(0, pieceGroupIndex),
                      ...pieceGroups.slice(pieceGroupIndex + 1),
                    ]);
                  }

                  break pieces;
                }
              }
            }
          }
        }
      }
    });
  };

  useEffect(() => {
    (async () => {
      try {
        const puzzle = await Puzzle.findByPrimary(puzzleId);

        if (!puzzle) {
          throw new Error('No puzzle found');
        }

        puzzle.calculateWorkspaces();

        await puzzle.loadImage();

        batchedUpdates(() => {
          setPuzzle(puzzle);
          setPieceGroups(puzzle.workspaces[0].groups);
        });
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

  useGlobalListener('wheel', document, (e) => {
    zoomCounterRef.current -= Math.sign(e.deltaY);

    setFieldTransform();
  });

  useGlobalListener('resize', window, () => {
    setFieldTransform();
  });

  useGlobalListener('mousemove', document, (e) => {
    onDrag(e);
  });

  useGlobalListener('mouseup', document, (e) => {
    onDragEnd(e);
  });

  if (!puzzle) {
    return (
      <LoadingOverlay />
    );
  }

  return (
    <Root>
      <div
        className={classNames('background', { isDragging })}
        onMouseDown={onDragStart}
        onContextMenu={rotatePieceGroup}
      >
        <svg
          className="field"
          ref={fieldRef}
          style={{
            width: puzzle.dimensions.width * PIECE_SIZE * 2,
            height: puzzle.dimensions.height * PIECE_SIZE * 2,
            transform: getFieldTransform(
              fieldOffsetRef.current,
              zoomCounterRef.current,
            ),
          }}
        >
          <WorkspaceMetadata
            puzzle={puzzle}
            workspaceIndex={0}
          />

          {pieceGroups.map((pieceGroup) => (
            <g
              key={pieceGroup.id}
              style={{
                transform: getPieceGroupTransform(pieceGroup),
                transformOrigin: `
                  ${pieceGroup.dimensions.width * PIECE_SIZE / 2}px
                  ${pieceGroup.dimensions.height * PIECE_SIZE / 2}px
                `,
              }}
            >
              {pieceGroup.pieces.map((piece) => {
                const relativeCoords = Puzzle.getPieceRelativeCoords(piece, pieceGroup);

                return (
                  <path
                    key={piece.id}
                    className="piece"
                    d={`M 0,0 ${piece.sidesInfo.map(({ path }) => path).join(' ')}`}
                    fill={`url(#image-${piece.id})`}
                    style={{
                      transform: `translate(${relativeCoords.x}px, ${relativeCoords.y}px)`,
                    }}
                    data-piece-id={piece.id}
                    data-group-id={piece.groupId}
                  />
                );
              })}
            </g>
          ))}
        </svg>
      </div>
    </Root>
  );
};

export default React.memo(PuzzlePage);

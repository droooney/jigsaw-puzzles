import React, { useCallback, useEffect, useRef, useState } from 'react';
import { unstable_batchedUpdates as batchedUpdates } from 'react-dom';
import { useHistory, useRouteMatch } from 'react-router-dom';
import styled from 'styled-components';
import classNames from 'classnames';

import { PIECE_SIZE } from 'constants/puzzle';

import { Piece, PieceGroup, Side } from 'types/puzzle';
import { Dimensions, Point } from 'types/common';

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
  mode: 'piece';
  piece: Piece;
  pieceElement: SVGPathElement;
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

    .field {
      cursor: grab;

      &.isDragging {
        cursor: grabbing;
      }
    }
  }
`;

const getZoom = (zoomCounter: number) => 1.1 ** zoomCounter;

const getViewBox = (offset: Point, dimensions: Dimensions, zoomCounter: number): string => {
  const zoom = getZoom(zoomCounter);

  return `${offset.x} ${offset.y} ${dimensions.width * zoom} ${dimensions.height * zoom}`;
};

const getPieceTransform = (piece: Piece): string => `
  translate(${piece.x}px, ${piece.y}px)
  rotate(${-90 * piece.topSide}deg)
`;

const PuzzlePage: React.FC = () => {
  const {
    params: {
      puzzleId,
    },
  } = useRouteMatch<{ puzzleId: string; }>();
  const history = useHistory();
  const backgroundRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<SVGSVGElement | null>(null);
  const dragInfoRef = useRef<DragInfo>({
    active: false,
    mode: 'field',
    currentPoint: { x: 0, y: 0 },
  });
  const fieldOffsetRef = useRef<Point>({ x: 0, y: 0 });

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [pieceGroups, setPieceGroups] = useState<PieceGroup[]>([]);
  const [zoomCounter, setZoomCounter] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const getViewSize = (): Dimensions => {
    return backgroundRef.current?.getBoundingClientRect() || {
      width: 0,
      height: 0,
    };
  };

  const setViewBox = useCallback(() => {
    if (fieldRef.current) {
      fieldRef.current.setAttribute(
        'viewBox',
        getViewBox(fieldOffsetRef.current, getViewSize(), zoomCounter),
      );
    }
  }, [zoomCounter]);

  const changePiece = useCallback(<K extends keyof Piece>(
    pieceId: number,
    groupId: number,
    update: Pick<Piece, K> | ((piece: Piece) => Pick<Piece, K>),
  ) => {
    const groupIndex = pieceGroups.findIndex(({ id }) => id === groupId);

    if (groupIndex === -1) {
      return;
    }

    const pieces = pieceGroups[groupIndex].pieces;
    const pieceIndex = pieces.findIndex(({ id }) => id === pieceId);

    if (pieceIndex === -1) {
      return;
    }

    const piece = pieces[pieceIndex];

    setPieceGroups([
      ...pieceGroups.slice(0, groupIndex),
      {
        ...pieceGroups[groupIndex],
        pieces: [
          ...pieces.slice(0, pieceIndex),
          {
            ...piece,
            ...(typeof update === 'function' ? update(piece) : update),
          },
          ...pieces.slice(pieceIndex + 1),
        ],
      },
      ...pieceGroups.slice(groupIndex + 1),
    ]);
  }, [pieceGroups]);

  const backgroundRefCallback = useCallback((background: HTMLDivElement | null) => {
    backgroundRef.current = background;

    setViewBox();
  }, [setViewBox]);

  const fieldRefCallback = useCallback((field: SVGSVGElement | null) => {
    fieldRef.current = field;

    setViewBox();
  }, [setViewBox]);

  const rotatePiece = useCallback((e: React.MouseEvent) => {
    e.preventDefault();

    const pieceId = e.target instanceof SVGPathElement
      ? e.target.dataset.pieceId
      : null;
    const groupId = e.target instanceof SVGPathElement
      ? e.target.dataset.groupId
      : null;

    const dragInfo = dragInfoRef.current;

    if (pieceId && dragInfo.mode === 'piece' && dragInfo.piece.id === +pieceId) {
      dragInfo.piece.topSide = (dragInfo.piece.topSide + 3) % 4 as Side;
      dragInfo.pieceElement.style.transform = getPieceTransform(dragInfo.piece);
    } else if (pieceId && groupId) {
      changePiece(+pieceId, +groupId, (piece) => ({
        topSide: (piece.topSide + 3) % 4 as Side,
      }));
    }
  }, [changePiece]);

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
      const pieceGroup = pieceGroups.find(({ id }) => id === +groupId);

      if (pieceGroup) {
        const piece = pieceGroup.pieces.find(({ id }) => id === +pieceId);

        if (piece) {
          dragInfoRef.current = {
            active: true,
            mode: 'piece',
            piece,
            pieceElement: e.target as SVGPathElement,
            currentPoint: { x: e.clientX, y: e.clientY },
          };

          setIsDragging(true);
        }
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

    const zoom = getZoom(zoomCounter);
    const dx = (e.clientX - dragInfo.currentPoint.x) * zoom;
    const dy = (e.clientY - dragInfo.currentPoint.y) * zoom;

    dragInfo.currentPoint = {
      x: e.clientX,
      y: e.clientY,
    };

    if (dragInfo.mode === 'field') {
      fieldOffsetRef.current = {
        x: fieldOffsetRef.current.x - dx,
        y: fieldOffsetRef.current.y - dy,
      };

      setViewBox();
    } else {
      dragInfo.piece = {
        ...dragInfo.piece,
        x: dragInfo.piece.x + dx,
        y: dragInfo.piece.y + dy,
      };

      dragInfo.pieceElement.style.transform = getPieceTransform(dragInfo.piece);
    }
  };

  const onDragEnd = (e: MouseEvent) => {
    if (!dragInfoRef.current.active) {
      return;
    }

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

      if (dragInfo.mode === 'piece') {
        changePiece(dragInfo.piece.id, dragInfo.piece.groupId, dragInfo.piece);
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
    setZoomCounter((counter) => counter + Math.sign(e.deltaY));
  });

  useGlobalListener('resize', window, () => {
    setViewBox();
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
      <div className="background" ref={backgroundRefCallback}>
        <svg
          className={classNames('field', { isDragging })}
          ref={fieldRefCallback}
          viewBox={getViewBox(fieldOffsetRef.current, getViewSize(), zoomCounter)}
          onMouseDown={onDragStart}
          onContextMenu={rotatePiece}
        >
          <WorkspaceMetadata
            puzzle={puzzle}
            workspaceIndex={0}
          />

          {pieceGroups.map((pieceGroup) => (
            <g key={pieceGroup.id}>
              {pieceGroup.pieces.map((piece) => (
                <path
                  key={piece.id}
                  d={`M 0,0 ${piece.sidesInfo.map(({ path }) => path).join(' ')}`}
                  style={{
                    transform: getPieceTransform(piece),
                    transformOrigin: `${PIECE_SIZE / 2}px ${PIECE_SIZE / 2}px`,
                  }}
                  fill={`url(#image-${piece.id})`}
                  data-piece-id={piece.id}
                  data-group-id={piece.groupId}
                />
              ))}
            </g>
          ))}
        </svg>
      </div>
    </Root>
  );
};

export default React.memo(PuzzlePage);

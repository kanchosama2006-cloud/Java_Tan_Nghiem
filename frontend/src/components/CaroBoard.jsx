import React from 'react';

export function CaroBoard({
  boardSize = 3,
  board = [],
  winningLine = null,
  dyingCoord = null,
  onCellClick,
  disabled = false,
  isMini = false,
  boardThemeClass = '',
  pieceSkinClass = '',
  boardThemeGradient = '',
  pieceSkinGradient = '',
  isLockedTurn = false,
  isMyTurn = false,
}) {
  const size = boardSize || 3;
  const boardMatrix =
    board && board.length === size
      ? board
      : Array.from({ length: size }, () => Array(size).fill(''));

  let boardCls = `board board-${size}`;
  if (isMini) boardCls += ' mini';
  if (boardThemeClass) boardCls += ` ${boardThemeClass}`;
  if (pieceSkinClass) boardCls += ` ${pieceSkinClass}`;
  if (isLockedTurn) boardCls += ' locked-turn';
  if (isMyTurn) boardCls += ' my-turn';

  const boardStyle = boardThemeGradient ? { background: boardThemeGradient } : undefined;

  const isWinningCell = (r, c) => {
    if (!winningLine || !Array.isArray(winningLine)) return false;
    return winningLine.some(([wr, wc]) => wr === r && wc === c);
  };

  const isDyingCell = (r, c) => {
    if (!dyingCoord) return false;
    return dyingCoord[0] === r && dyingCoord[1] === c;
  };

  return (
    <div className={boardCls} style={boardStyle}>
      {boardMatrix.map((rowArr, r) =>
        rowArr.map((cellVal, c) => {
          let cellCls = 'cell';
          if (cellVal) cellCls += ` ${cellVal}`;
          if (isWinningCell(r, c)) cellCls += ' win';
          if (isDyingCell(r, c)) cellCls += ' piece-dying';

          const isDisabled = disabled || !!cellVal;

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={cellCls}
              data-r={r}
              data-c={c}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled && onCellClick) {
                  onCellClick(r, c);
                }
              }}
            >
              {cellVal || ''}
            </button>
          );
        })
      )}
    </div>
  );
}

export default CaroBoard;

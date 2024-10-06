import React from 'react';

const Board = ({ board, setBoard }) => {
  const handleChange = (row, col, value) => {
    const newBoard = board.map((r, rowIndex) => 
      r.map((cell, colIndex) => 
        rowIndex === row && colIndex === col ? value : cell
      )
    );
    setBoard(newBoard);
  };

  return (
    <div>
      {board.map((row, rowIndex) => (
        <div key={rowIndex}>
          {row.map((cell, colIndex) => (
            <input
              key={colIndex}
              type="text"
              value={cell}
              onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
              maxLength="1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Board;

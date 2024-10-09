import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

const socket = io('http://localhost:8000');

const SudokuGame = () => {
  const [room, setRoom] = useState('');
  const [board, setBoard] = useState([]);
  const [joined, setJoined] = useState(false);
  const [timer, setTimer] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [duration, setDuration] = useState(300); // Default timer duration in seconds
  const [error, setError] = useState(''); // State for error messages
  const [createdRoom, setCreatedRoom] = useState(''); // Store created room number
  const [k, setK] = useState(0); // State to check board initialization

  // Initialize editable state for each cell
  const [initialCheck, setInitialCheck] = useState(Array.from({ length: 9 }, () => Array(9).fill(false)));

  // Function to generate a random room number
  const generateRandomRoomNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generate room number between 1000 and 9999
  };

  // Function to mark which cells are editable (not pre-filled)
  const create = (board) => {
    if (k === 0) {
      setK(1); // Ensure it runs only once
      const editable = board.map((row) =>
        row.map((cell) => cell === '') // Mark empty cells (editable)
      );
      setInitialCheck(editable); // Store editable status
    }
  };

  const createRoom = () => {
    const newRoom = generateRandomRoomNumber();
    setRoom(newRoom);
    socket.emit('create_room', newRoom, duration); // Emit create_room event
    setJoined(true);
    setCreatedRoom(newRoom); // Store created room
  };

  const joinRoom = () => {
    if (room) {
      socket.emit('join_room', room, duration);
      setJoined(true);
      setCreatedRoom(''); // Clear created room when joining
    }
  };

  // Function to check if a number can be placed (basic Sudoku validation)
  function check(row, col, num) {
    if (num === '') return true; // Empty cell is always valid
    if (num <= 0 || num > 9) return false;

    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num.toString() || board[x][col] === num.toString()) return false;
    }

    let m = 3, n = 3;
    let x = m * Math.floor(row / m);
    let y = n * Math.floor(col / n);
    for (let i = x; i < x + m; i++) {
      for (let j = y; j < y + n; j++) {
        if (board[i][j] === num.toString()) return false;
      }
    }
    return true;
  }
  const handleChange = (rowIndex, colIndex, value) => {
    if (!initialCheck[rowIndex][colIndex]) {
      alert('This cell is fixed and cannot be changed.');
      return;
    }
    if ((value === '' || (value >= 1 && value <= 9)) && check(rowIndex,colIndex,value)) {
      const newBoard = board.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          return row.map((cell, cIndex) => (cIndex === colIndex ? value : cell));
        }
        return row;
      });
      setBoard(newBoard);
      socket.emit('send_board', { room, board: newBoard });
    }
    else{
      alert("invalid")
    }
  };

  useEffect(() => {
    socket.on('initial_board', (initialBoard) => {
      setBoard(initialBoard);
      create(initialBoard);
    });

    socket.on('update_board', (newBoard) => {
      setBoard(newBoard);
    });

    socket.on('timer_update', (remainingTime) => {
      setTimer(remainingTime);
    });

    socket.on('game_over', ({ message }) => {
      alert(message); // Display game over message
      setJoined(false);
      setBoard([]); // Reset the board
    });

    socket.on('user_count_update', (count) => {
      setUsersCount(count);
    });

    socket.on('join_error', (message) => {
      setError(message); // Display error if room doesn't exist
    });

    return () => {
      socket.off('initial_board');
      socket.off('update_board');
      socket.off('timer_update');
      socket.off('game_over');
      socket.off('user_count_update');
      socket.off('join_error');
    };
  }, [room]);

  return (
    <div className="sudoku-container">
      <h1>Sudoku Game</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {!joined ? (
        <div>
          <input
            type="text"
            placeholder="Enter room number"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="room-input"
          />
          <button onClick={joinRoom} className="join-button">Join Room</button>
          <button onClick={createRoom} className="create-button">Create Room</button>
        </div>
      ) : (
        <div>
          <h2>Room: {room}</h2>
          <p>Players in the room: {usersCount}</p>
          <p>Time left: {timer ? `${timer} seconds` : 'Waiting for players...'}</p>
          <div className="sudoku-board">
            {board.map((row, rowIndex) => (
              <div className="sudoku-row" key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <input
                    key={colIndex}
                    type="text"
                    value={cell}
                    onChange={(e) => handleChange(rowIndex, colIndex, e.target.value)}
                    maxLength="1"
                    className={`sudoku-cell ${!initialCheck[rowIndex][colIndex] ? 'fixed-cell' : ''}`} // Add a class for fixed cells
                    disabled={!initialCheck[rowIndex][colIndex]} // Disable input for fixed cells
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SudokuGame;

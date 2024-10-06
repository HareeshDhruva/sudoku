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

  const generateRandomRoomNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString(); // Generate room number between 1000 and 9999
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

  const handleChange = (rowIndex, colIndex, value) => {
    if (board[rowIndex][colIndex] === '' && /^[1-9]?$/.test(value)) {
      const newBoard = board.map((row, rIndex) => {
        if (rIndex === rowIndex) {
          return row.map((cell, cIndex) => (cIndex === colIndex ? value : cell));
        }
        return row;
      });
      setBoard(newBoard);
      socket.emit('send_board', { room, board: newBoard });
    }
  };

  useEffect(() => {
    socket.on('initial_board', (initialBoard) => {
      setBoard(initialBoard);
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
                    className="sudoku-cell"
                    disabled={cell !== ''}
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

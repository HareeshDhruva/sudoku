import React, { useEffect, useState } from "react";
import io from "socket.io-client";
const socket = io("https://sudoku-pn4c.onrender.com");
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

const SudokuGame = () => {
  const [room, setRoom] = useState("");
  const [board, setBoard] = useState([]);
  const [join, setJoin] = useState(false);
  const [joined, setJoined] = useState(false);
  const [timer, setTimer] = useState(null);
  const [usersCount, setUsersCount] = useState(0);
  const [error, setError] = useState("");
  const [createdRoom, setCreatedRoom] = useState("");
  const [name, setName] = useState("");
  const [ready, setReady] = useState(true);
  const [admin, setAdmin] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [winner, setWinner] = useState("");
  const [solution, setSolution] = useState();
  const [viewSolution, setViewSolution] = useState(false);
  const duration = 300;
  
  const [initialCheck, setInitialCheck] = useState(
    Array.from({ length: 9 }, () => Array(9).fill(false))
  );
  const generateRandomRoomNumber = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const createEditableCells = (board) => {
    const editable = board.map((row) => row.map((cell) => cell === ""));
    setInitialCheck(editable);
  };


  const fullCheck = () => {
    const hasEmptyCells = board.some((row) => row.some((cell) => cell === ""));
    if (hasEmptyCells) {
      toast.error('Please fill all the fields before submitting.',{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }
    socket.emit("submit", name, room);
  };

  const createRoom = () => {
    const newRoom = generateRandomRoomNumber();
    setRoom(newRoom);
    socket.emit("create_room", newRoom, name, ready);
    setJoined(true);
    setCreatedRoom(newRoom);
  };

  const joinRoom = () => {
    if (room) {
      socket.emit("join_room", room);
      setJoined(true);
      setCreatedRoom("");
    }
    else{
      toast.error('Enter room id',{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const isValidInput = (row, col, num) => {
    if (num === "") return true;
    const value = parseInt(num);
    if (isNaN(value) || value <= 0 || value > 9) return false;

    for (let x = 0; x < 9; x++) {
      if (
        board[row][x] === value.toString() ||
        board[x][col] === value.toString()
      ) {
        return false;
      }
    }

    const boxRowStart = 3 * Math.floor(row / 3);
    const boxColStart = 3 * Math.floor(col / 3);
    for (let i = boxRowStart; i < boxRowStart + 3; i++) {
      for (let j = boxColStart; j < boxColStart + 3; j++) {
        if (board[i][j] === value.toString()) return false;
      }
    }
    return true;
  };

  const handleChange = (rowIndex, colIndex, value) => {
    if (!initialCheck[rowIndex][colIndex]) {
      toast.error('This cell is fixed and cannot be changed.',{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }
    if (isValidInput(rowIndex, colIndex, value)) {
      const newBoard = board.map((row, rIndex) =>
        rIndex === rowIndex
          ? row.map((cell, cIndex) => (cIndex === colIndex ? value : cell))
          : row
      );
      setBoard(newBoard);
    } else {
      toast.success("invalid input",{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const handleReadyChange = () => {
    socket.emit("start_room", room, duration);
  };

  const togglePopup = () => setIsOpen(!isOpen);

  const handleCloseRoom = () => {
    socket.emit("leave_room");
    setJoined(false);
    setRoom("");
    setBoard([]);
    setError("");
    setUsersCount(0);
    setTimer(null);
    setWinner("");
    setSolution();
    setViewSolution(false);
    setAdmin("");
    setIsOpen(false);
    setName("");
  };

  useEffect(() => {
    socket.on("initial_board", (initialBoard) => {
      setBoard(initialBoard);
      createEditableCells(initialBoard);
    });
    socket.on("update_board", (newBoard) => setBoard(newBoard));
    socket.on("timer_update", (remainingTime) => setTimer(remainingTime));
    socket.on("admin", (admin) => setAdmin(admin));
    socket.on("game_over", ({ message }) => {
      toast.success(message,{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      setJoined(false);
      setBoard([]);
    });
    socket.on("user_count_update", (count) => setUsersCount(count));
    socket.on("join_error", (message) =>{
      toast.error(message,{
        position: "bottom-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      handleCloseRoom();
    });
    socket.on("admin_started", (ready) => setReady(ready));
    socket.on("winner", (name, isWin, solution) => {
      setWinner(name);
      setIsOpen(isWin);
      setSolution(solution);
    });

    return () => {
      socket.off("initial_board");
      socket.off("update_board");
      socket.off("timer_update");
      socket.off("game_over");
      socket.off("user_count_update");
      socket.off("join_error");
      socket.off("admin_started");
    };
  }, [room]);

  const handleViewSolution = () => {
    setViewSolution((prev) => !prev);
  };

  const Popup = ({ closePopup }) => (
    <div className="popup-overlay">
      <div className="popup-content">
        <h2>Winner</h2>
        <p>Winner is {winner}</p>
        <button onClick={handleViewSolution} className="join-button">
          Show Solution
        </button>
        <button onClick={handleCloseRoom} className="join-button">
          Close
        </button>
        {viewSolution && (
          <div className="solution-grid">
            {solution.map((row, rowIndex) => (
              <div className="sudoku-row" key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <input
                    key={colIndex}
                    type="text"
                    value={cell}
                    maxLength="1"
                    className={`sudoku-cell ${
                      !initialCheck[rowIndex][colIndex] ? "fixed-cell" : ""
                    }`}
                    disabled={!initialCheck[rowIndex][colIndex]}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="sudoku-container">
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!joined ? (
        <div>
          <h1>Sudoku Game</h1>
          <input
            type="text"
            placeholder="Enter user name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="room-input"
          />

          {join === true ? (
            <>
              <input
                type="number"
                placeholder="Enter room number"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="room-input"
              />
              <button onClick={joinRoom} className="join-button">
                Join
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setJoin((prev) => !prev)}
                className="join-button"
              >
                Join Room
              </button>

              <button onClick={createRoom} className="create-button">
                Create Room
              </button>
            </>
          )}
        </div>
      ) : (
        <div>
          <h2>Room: {room}</h2>
          <p>Players in the room: {usersCount}</p>
          <p>Player name: {name}</p>
          <p>
            Time left: {timer ? `${timer} seconds` : "Waiting for players..."}
          </p>
          <p>Admin: {admin}</p>
          {ready ? (
            name !== admin ? (
              <button className="join-button" disabled>
                Waiting
              </button>
            ) : (
              <button onClick={handleReadyChange} className="join-button">
                Ready
              </button>
            )
          ) : (
            <div className="sudoku-board">
              {board.map((row, rowIndex) => (
                <div className="sudoku-row" key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <input
                      key={colIndex}
                      type="text"
                      value={cell}
                      onChange={(e) =>
                        handleChange(rowIndex, colIndex, e.target.value)
                      }
                      maxLength="1"
                      className={`sudoku-cell ${
                        !initialCheck[rowIndex][colIndex] ? "fixed-cell" : ""
                      }`}
                      disabled={!initialCheck[rowIndex][colIndex]}
                    />
                  ))}
                </div>
              ))}
              <button
                onClick={() => {
                  fullCheck() &&
                  togglePopup()
                }}
                className="create-button"
              >
                Submit
              </button>
              {isOpen && <Popup closePopup={togglePopup} />}
            </div>
          )}
        </div>
      )}
         <ToastContainer />
    </div>
  );
};

export default SudokuGame;

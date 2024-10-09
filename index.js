const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const a = 9; // Size of the Sudoku board (9x9)
app.use(express.json());
app.use(cors());

// Sudoku-related helper functions
function isValid(board, row, col, num) {
  if (num === '') return true;
  num = parseInt(num);
  if (isNaN(num) || num <= 0 || num > a) return false;

  for (let x = 0; x < a; x++) {
    if (board[row][x] === num.toString() || board[x][col] === num.toString()) {
      return false;
    }
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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function solveSudoku(board) {
  for (let i = 0; i < a; i++) {
    for (let j = 0; j < a; j++) {
      if (board[i][j] === '') {
        let m = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (let num of m) {
          if (isValid(board, i, j, num)) {
            board[i][j] = num.toString();
            if (solveSudoku(board)) {
              return true;
            }
            board[i][j] = '';
          }
        }
        return false;
      }
    }
  }
  return true;
}

const initialBoard = Array.from({ length: a }, () => Array(a).fill(''));

function generateNewBoard() {
  solveSudoku(initialBoard);
  for (let i = 0; i < 60; i++) {
    let r = Math.floor(Math.random() * a);
    let c = Math.floor(Math.random() * a);
    initialBoard[r][c] = '';
  }
  
  return initialBoard;
}


// Rooms object to store information about rooms
const rooms = {};

app.get("/", (req, res) => {
  res.send('Welcome to the Sudoku Solver API!');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_room', (room, duration) => {
    if (!rooms[room]) {
      const newBoard = generateNewBoard();
      rooms[room] = { boards: [newBoard], users: [], timer: null, interval: null };
    }

    socket.join(room);
    console.log(`User ${socket.id} created and joined room: ${room}`);

    rooms[room].users.push(socket.id);
    io.to(room).emit('user_count_update', rooms[room].users.length); // Update user count to all clients
    socket.emit('initial_board', rooms[room].boards[0]);

    // Start timer if two users have joined
    if (rooms[room].users.length === 2 && !rooms[room].timer) {
      startTimer(room, duration);
    }
  });

  socket.on('join_room', (room, duration) => {
    // Check if the room exists before joining
    if (!rooms[room]) {
      socket.emit('join_error', 'Room does not exist. Please create a room first.');
      return;
    }

    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);

    rooms[room].users.push(socket.id);
    io.to(room).emit('user_count_update', rooms[room].users.length);
    socket.emit('initial_board', rooms[room].boards[0]);

    // Start timer if two users have joined
    if (rooms[room].users.length === 2 && !rooms[room].timer) {
      startTimer(room, duration);
    }
  });

  socket.on('send_board', ({ room, board }) => {
    if (rooms[room]) {
      rooms[room].boards.push(board);
      socket.to(room).emit('update_board', board);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const room in rooms) {
      const index = rooms[room].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[room].users.splice(index, 1);
        io.to(room).emit('user_count_update', rooms[room].users.length);
        if (rooms[room].users.length < 2 && rooms[room].interval) {
          clearInterval(rooms[room].interval);
          rooms[room].timer = null;
        }
      }
    }
  });
});

function startTimer(room, duration) {
  if (rooms[room]) {
    rooms[room].timer = duration;
    const interval = setInterval(() => {
      rooms[room].timer -= 1;
      io.to(room).emit('timer_update', rooms[room].timer);

      if (rooms[room].timer <= 0) {
        clearInterval(interval);
        io.to(room).emit('game_over', { winner: null, message: 'Time is up!' });
      }
    }, 1000);
    rooms[room].interval = interval;
  }
}

const PORT = 8000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

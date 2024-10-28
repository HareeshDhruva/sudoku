const express = require('express');
const config = require('dotenv')
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

config.config();

const a = 9;
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname,"/client/dist")))

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});


function isValid(board, row, col, num) {
  if (num === '') return true;
  num = parseInt(num);
  if (isNaN(num) || num <= 0 || num > a) return false;

  for (let x = 0; x < a; x++) {
    if (board[row][x] === num.toString() || board[x][col] === num.toString()) {
      return false;
    }
  }

  const boxStartRow = Math.floor(row / 3) * 3;
  const boxStartCol = Math.floor(col / 3) * 3;
  for (let i = boxStartRow; i < boxStartRow + 3; i++) {
    for (let j = boxStartCol; j < boxStartCol + 3; j++) {
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
        const m = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of m) {
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
let solution = [];

function generateNewBoard() {
  solveSudoku(initialBoard);
  solution = JSON.parse(JSON.stringify(initialBoard));

  for (let i = 0; i < 50; i++) {
    const r = Math.floor(Math.random() * a);
    const c = Math.floor(Math.random() * a);
    initialBoard[r][c] = '';
  }

  return initialBoard;
}

const rooms = {};


io.on('connection', (socket) => {
  socket.on('create_room', (room, name, ready) => {
    if (!rooms[room]) {
      const newBoard = generateNewBoard();
      rooms[room] = { boards: [newBoard], users: [], timer: null, interval: null, admin: name, state: ready, win: false };
    }
    socket.join(room);
    rooms[room].users.push(socket.id);
    io.to(room).emit('user_count_update', rooms[room].users.length);
    socket.emit('admin', rooms[room].admin);
    socket.emit('initial_board', rooms[room].boards[0]);
  });

  socket.on('start_room', (room, duration) => {
    rooms[room].state = !rooms[room].state;
    io.to(room).emit('admin_started', rooms[room].state);
    if (!rooms[room].state) {
      startTimer(room, duration);
    }
  });

  socket.on('join_room', (room) => {
    if (!rooms[room]) {
      socket.emit('join_error', 'Room does not exist. Please create a room first.');
      return;
    }
    socket.join(room);
    rooms[room].users.push(socket.id);
    socket.emit('admin', rooms[room].admin);
    io.to(room).emit('user_count_update', rooms[room].users.length);
    socket.emit('initial_board', rooms[room].boards[0]);
  });

  socket.on('send_board', ({ room, board }) => {
    if (rooms[room]) {
      rooms[room].boards.push(board);
      socket.to(room).emit('update_board', board);
    }
  });

  socket.on('submit', (name, room) => {
    rooms[room].win = !rooms[room].win;
    io.to(room).emit('winner', name, rooms[room].win, solution);
  });

  socket.on('leave_room', (room) => {
    if (rooms[room]) {
      const index = rooms[room].users.indexOf(socket.id);
      if (index !== -1) {
        rooms[room].users.splice(index, 1);
        io.to(room).emit('user_count_update', rooms[room].users.length);
        if (rooms[room].users.length < 2 && rooms[room].interval) {
          clearInterval(rooms[room].interval);
          rooms[room].timer = null;
        }
        socket.leave(room);
      }
    }
  });

  socket.on('disconnect', () => {
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
    rooms[room].interval = setInterval(() => {
      rooms[room].timer -= 1;
      io.to(room).emit('timer_update', rooms[room].timer);
      if (rooms[room].timer <= 0) {
        clearInterval(rooms[room].interval);
        io.to(room).emit('game_over', { winner: null, message: 'Time is up!' });
      }
    }, 1000);
  }
}

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server running`);
});

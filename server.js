// server.js (Node.js + Socket.IO signaling server)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let waitingUser = null;

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  if (waitingUser) {
    // Pair with the waiting user
    socket.emit('peer', { peerId: waitingUser });
    io.to(waitingUser).emit('peer', { peerId: socket.id });
    waitingUser = null;
  } else {
    waitingUser = socket.id;
  }

  socket.on('signal', ({ to, data }) => {
    io.to(to).emit('signal', { from: socket.id, data });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Signaling server running on port', PORT);
});
io.on("connection", (socket) => {
  socket.on("message", ({ to, text }) => {
    io.to(to).emit("message", { text });
  });

  socket.on("signal", ({ to, data }) => {
    io.to(to).emit("signal", { from: socket.id, data });
  });

  socket.emit("peer", { peerId: socket.id });
  socket.join(socket.id);
});

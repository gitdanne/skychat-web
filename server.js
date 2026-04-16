const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users
let users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('login', (username) => {
    users[socket.id] = {
      username: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };
    
    // Broadcast updated user list
    io.emit('user_list', Object.values(users));
    
    // Notify others
    socket.broadcast.emit('system_message', {
      text: `${username} joined the Sky`,
      type: 'join'
    });
  });

  socket.on('send_message', (data) => {
    const messageData = {
      user: users[socket.id],
      text: data.text,
      image: data.image,
      audio: data.audio,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      id: Date.now()
    };
    io.emit('receive_message', messageData);
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      delete users[socket.id];
      io.emit('user_list', Object.values(users));
      io.emit('system_message', {
        text: `${username} left the Sky`,
        type: 'leave'
      });
    }
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SkyChat Server running on http://localhost:${PORT}`);
  console.log(`Accessible from your network at: http://YOUR_IP:${PORT}`);
});

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
  },
  maxHttpBufferSize: 1e7, // 10MB limit for audio/image data
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Store connected users and rooms
let users = {};
let rooms = {
  "General": { name: "General", createdBy: "System", members: 0, isSystem: true },
  "Tech Talk": { name: "Tech Talk", createdBy: "System", members: 0, isSystem: true },
  "Music": { name: "Music", createdBy: "System", members: 0, isSystem: true }
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentRoom = null;

  socket.on('login', (username) => {
    users[socket.id] = {
      username: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };
    
    // Send room list once logged in
    socket.emit('room_list', Object.values(rooms));
  });

  socket.on('get_rooms', () => {
    socket.emit('room_list', Object.values(rooms));
  });

  socket.on('create_room', (roomName) => {
    if (!rooms[roomName]) {
      rooms[roomName] = { 
        name: roomName, 
        createdBy: users[socket.id]?.username || "Unknown",
        ownerId: socket.id,
        members: 0,
        isSystem: false
      };
      io.emit('room_list', Object.values(rooms));
    }
  });

  socket.on('join_room', (roomName) => {
    const previousRoom = currentRoom;
    if (previousRoom) {
      socket.leave(previousRoom);
      if (rooms[previousRoom]) {
        rooms[previousRoom].members--;
        
        // If owner leaves their own room, close it
        if (rooms[previousRoom].ownerId === socket.id && !rooms[previousRoom].isSystem) {
          io.to(previousRoom).emit('room_closed', { room: previousRoom });
          delete rooms[previousRoom];
        } else {
          socket.to(previousRoom).emit('system_message', {
            text: `${users[socket.id]?.username} left the room`,
            type: 'leave'
          });
        }
      }
    }
    
    socket.join(roomName);
    currentRoom = roomName;
    if (rooms[roomName]) rooms[roomName].members++;
    
    // Broadcast updated list to everyone (counts changed)
    io.emit('room_list', Object.values(rooms));
    
    // Notify room members
    socket.to(roomName).emit('system_message', {
      text: `${users[socket.id]?.username} joined the room`,
      type: 'join'
    });
    
    socket.emit('room_joined', rooms[roomName]);
  });

  socket.on('send_message', (data, callback) => {
    try {
      const messageData = {
        user: users[socket.id],
        text: data.text,
        image: data.image,
        audio: data.audio,
        room: data.room,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: data.id || Date.now()
      };
      
      // Emit ONLY to the specific room
      io.to(data.room).emit('receive_message', messageData);
      
      if (typeof callback === 'function') {
        callback({ status: 'ok', id: messageData.id });
      }
    } catch (err) {
      console.error("Error broadcast message:", err);
      if (typeof callback === 'function') {
        callback({ status: 'error', message: 'Server failed to relay message' });
      }
    }
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const username = users[socket.id].username;
      
      if (currentRoom && rooms[currentRoom]) {
        rooms[currentRoom].members--;
        
        // If owner disconnects, close the room
        if (rooms[currentRoom].ownerId === socket.id && !rooms[currentRoom].isSystem) {
          io.to(currentRoom).emit('room_closed', { room: currentRoom });
          delete rooms[currentRoom];
        } else {
          socket.to(currentRoom).emit('system_message', {
            text: `${username} left the room`,
            type: 'leave'
          });
        }
      }
      
      delete users[socket.id];
      io.emit('room_list', Object.values(rooms));
    }
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`SkyChat Server running on http://localhost:${PORT}`);
  console.log(`Accessible from your network at: http://YOUR_IP:${PORT}`);
});

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
  "General": { name: "General", createdBy: "System", members: 0, isSystem: true, messages: [] },
  "Tech Talk": { name: "Tech Talk", createdBy: "System", members: 0, isSystem: true, messages: [] },
  "Music": { name: "Music", createdBy: "System", members: 0, isSystem: true, messages: [] }
};

// Map to track which room each socket is in
let socketToRoom = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  let currentRoom = null;

  socket.on('login', (username) => {
    users[socket.id] = {
      username: username,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };
    
    // Broadcast global online count (if needed)
    io.emit('online_count_update', Object.keys(users).length);
    
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
        isSystem: false,
        messages: []
      };
      io.emit('room_list', Object.values(rooms));
    }
  });

  const updateRoomUsers = (roomName) => {
    if (!rooms[roomName]) return;
    
    // Get all socket IDs in the room
    const room = io.sockets.adapter.rooms.get(roomName);
    const roomUserList = [];
    if (room) {
      for (const socketId of room) {
        if (users[socketId]) {
          roomUserList.push(users[socketId]);
        }
      }
    }
    io.to(roomName).emit('room_users', roomUserList);
  };

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
          // Update user list for people staying in the old room
          updateRoomUsers(previousRoom);
        }
      }
    }
    
    socket.join(roomName);
    currentRoom = roomName;
    socketToRoom[socket.id] = roomName;

    if (rooms[roomName]) {
      rooms[roomName].members++;
      
      // Send history
      socket.emit('load_history', rooms[roomName].messages);
    }
    
    // Broadcast updated list to everyone (counts changed)
    io.emit('room_list', Object.values(rooms));
    
    // Notify room members
    socket.to(roomName).emit('system_message', {
      text: `${users[socket.id]?.username} joined the room`,
      type: 'join'
    });
    
    socket.emit('room_joined', rooms[roomName]);
    
    // Update user list for the new room
    updateRoomUsers(roomName);
  });

  socket.on('send_message', (data, callback) => {
    try {
      if (!data.room || !rooms[data.room]) return;

      const messageData = {
        user: users[socket.id],
        text: data.text,
        image: data.image,
        audio: data.audio,
        room: data.room,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        id: data.id || Date.now()
      };
      
      // Save to history (limit to last 50)
      rooms[data.room].messages.push(messageData);
      if (rooms[data.room].messages.length > 50) {
        rooms[data.room].messages.shift();
      }

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
      const roomToUpdate = currentRoom;

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
          // Update room user list
          updateRoomUsers(roomToUpdate);
        }
      }
      
      delete users[socket.id];
      delete socketToRoom[socket.id];
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

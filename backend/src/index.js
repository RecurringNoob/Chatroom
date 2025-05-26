// backend index.js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app); 

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true,
}));

// Attach socket.io to the HTTP server
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', 
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

/*io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('message', (data) => {
    console.log('Received message:', data);
    io.emit('message', data); // Broadcast to everyone
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});*/

httpServer.listen(8001, () => {
  console.log('Socket.IO server is running on http://localhost:8001');
});

const emailToSocketId = new Map();
const socketIdToEmail = new Map();
const roomUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ email, roomId }) => {
    console.log(`${email} joining room ${roomId}`);
    
    // Store mappings
    emailToSocketId.set(email, socket.id);
    socketIdToEmail.set(socket.id, email);
    
    // Add user to room
    if (!roomUsers.has(roomId)) {
      roomUsers.set(roomId, new Set());
    }
    roomUsers.get(roomId).add(email);
    
    // Join socket.io room
    socket.join(roomId);
    
    // Notify user they've joined
    socket.emit('joined-room', { roomId });
    
    // Notify other users in the room
    socket.to(roomId).emit('user-joined', { email });
    
    console.log(`Users in room ${roomId}:`, [...roomUsers.get(roomId)]);
  });

  socket.on('call-user', ({ email, offer }) => {
    const socketId = emailToSocketId.get(email);
    if (socketId) {
      socket.to(socketId).emit('incoming-call', {
        offer,
        email: socketIdToEmail.get(socket.id)
      });
    }
  });

  socket.on('call-answered', ({ email, answer }) => {
    const socketId = emailToSocketId.get(email);
    if (socketId) {
      socket.to(socketId).emit('call-answered', {
        answer,
        email: socketIdToEmail.get(socket.id)
      });
    }
  });

  socket.on('ice-candidate', ({ roomId, candidate }) => {
    socket.to(roomId).emit('ice-candidate', {
      candidate,
      email: socketIdToEmail.get(socket.id)
    });
  });

  socket.on('disconnect', () => {
    const email = socketIdToEmail.get(socket.id);
    if (email) {
      // Remove user from rooms
      roomUsers.forEach((users, roomId) => {
        if (users.has(email)) {
          users.delete(email);
          socket.to(roomId).emit('user-left', { email });
        }
      });
      
      // Clean up mappings
      emailToSocketId.delete(email);
      socketIdToEmail.delete(socket.id);
    }
    
    console.log('User disconnected:', socket.id);
  });
});
import express from 'express';
import multer from 'multer';
import path from 'path';
import routes from './routes';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { handleConnection, handleDisconnection } from './socket/labSessionMonitor';

const app = express();
const port = 3000;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  handleConnection(io, socket);
});
io.on('disconnect', (socket) => {
  console.log(`User disconnected: ${socket.id}`);
  handleDisconnection(socket);
});

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors())
app.use(express.urlencoded({ extended: true }));




// Routes
app.use('/api', routes());



// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

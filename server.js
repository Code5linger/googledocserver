const express = require('express');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

const Document = require('./Document');

// MongoDB URI
const uri =
  process.env.MONGO_URI ||
  'mongodb+srv://googledocsclone:googledocsclone@cluster0.mhtwx9f.mongodb.net/google-docs-clone?retryWrites=true&w=majority';

mongoose.connect(uri);

// Express app setup

app.use(cors());
app.use(express.json());

// HTTP server for Express + Socket.IO
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:5173', // dev
      'https://docclone-53c32.web.app', // deployed frontend
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const defaultValue = '';

io.on('connection', (socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit('load-document', document.data);

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta);
    });

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
});

async function findOrCreateDocument(id) {
  if (id == null) return;
  const existing = await Document.findById(id);
  if (existing) return existing;
  return await Document.create({ _id: id, data: defaultValue });
}

// Basic route
app.get('/', (req, res) => {
  res.send('Google Docs Clone Backend is running');
});

// Start server
const PORT = process.env.PORT || 5174;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

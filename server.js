const mongoose = require('mongoose');
const Document = require('./Document');
const { Server } = require('socket.io');
require('dotenv').config();

// MongoDB Atlas connection string
const uri = `mongodb+srv://googledocsclone:googledocsclone@cluster0.mhtwx9f.mongodb.net/google-docs-clone?retryWrites=true&w=majority&appName=Cluster0`;

// Mongoose connection
mongoose.connect(uri);

const io = new Server(5174, {
  cors: {
    origin: (origin, callback) => {
      const allowedOrigins = ['http://localhost:5173'];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
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

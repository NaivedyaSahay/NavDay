require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const habitRoutes = require('./routes/habits');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/habits', habitRoutes);
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.warn('Warning: Could not connect to MongoDB:', error.message);
    console.log('Falling back to local JSON database...');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} (Local JSON DB Mode)`);
    });
  });

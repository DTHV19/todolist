const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const todosRouter = require('./routes/todos');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Ensure todos.json exists
const todosFile = path.join(dataDir, 'todos.json');
if (!fs.existsSync(todosFile)) {
  fs.writeFileSync(todosFile, JSON.stringify([]));
}

// Routes
app.use('/api/todos', todosRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ message: 'TodoList API is running!' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
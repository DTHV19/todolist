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

// Đảm bảo thư mục data tồn tại
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Đảm bảo file todos.json tồn tại
const todosFile = path.join(dataDir, 'todos.json');
if (!fs.existsSync(todosFile)) {
  fs.writeFileSync(todosFile, JSON.stringify([]));
}

// Định tuyến
app.use('/api/todos', todosRouter);

// Kiểm tra 
app.get('/api/health', (req, res) => {
  res.json({ message: 'TodoList API is running!' });
});

// Middleware xử lý lỗi
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
  console.log(`Kiểm tra: http://localhost:${PORT}/api/health`);
});
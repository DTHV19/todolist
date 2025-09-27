const fs = require('fs');
const path = require('path');
const dataFilePath = path.join(__dirname, '..', 'data', 'todos.json');

// Tạo thư mục data nếu chưa có
if (!fs.existsSync(path.dirname(dataFilePath))) {
  fs.mkdirSync(path.dirname(dataFilePath), { recursive: true });
  console.log(' Đã tạo thư mục "data"');
}

// Khởi tạo file todos.json nếu chưa có
if (!fs.existsSync(dataFilePath)) {
  fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2));
  console.log('Đã tạo file todos.json');
}

// Đọc dữ liệu todos
exports.readTodos = () => {
  try {
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(' Lỗi đọc file todos.json:', err.message);
    return [];
  }
};

// Ghi dữ liệu todos
exports.writeTodos = (todos) => {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(todos, null, 2));
  } catch (err) {
    console.error(' Lỗi ghi file todos.json:', err.message);
  }
};

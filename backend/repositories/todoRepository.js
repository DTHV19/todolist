// Xử lý thao tác với file todos.json
const fs = require('fs');
const path = require('path');

const todosFilePath = path.join(__dirname, '..', 'data', 'todos.json');

const readTodos = () => {
  try {
    const data = fs.readFileSync(todosFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
};

const writeTodos = (todos) => {
  try {
    fs.writeFileSync(todosFilePath, JSON.stringify(todos, null, 2));
    return true;
  } catch (error) {
    console.error('Lỗi khi ghi file todos:', error);
    return false;
  }
};

module.exports = {
  readTodos,
  writeTodos
};

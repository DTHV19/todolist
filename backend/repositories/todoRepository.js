const fs = require('fs');
const path = require('path');

// Data Access Layer - Chỉ xử lý đọc/ghi dữ liệu
class TodoRepository {
  constructor() {
    this.todosFilePath = path.join(__dirname, '..', 'data', 'todos.json');
  }

  // Đọc tất cả todos từ file
  readAll() {
    try {
      const data = fs.readFileSync(this.todosFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Lỗi đọc file todos:', error);
      return [];
    }
  }

  // Ghi tất cả todos vào file
  writeAll(todos) {
    try {
      fs.writeFileSync(this.todosFilePath, JSON.stringify(todos, null, 2));
      return true;
    } catch (error) {
      console.error('Lỗi ghi file todos:', error);
      throw new Error('Không thể lưu dữ liệu');
    }
  }

  // Tìm todo theo ID
  findById(id) {
    const todos = this.readAll();
    return todos.find(todo => todo.id === id) || null;
  }

  // Tìm index của todo theo ID
  findIndexById(id) {
    const todos = this.readAll();
    return todos.findIndex(todo => todo.id === id);
  }

  // Thêm todo mới
  create(todo) {
    const todos = this.readAll();
    todos.push(todo);
    this.writeAll(todos);
    return todo;
  }

  // Cập nhật todo theo ID
  update(id, updatedTodo) {
    const todos = this.readAll();
    const index = this.findIndexById(id);
    
    if (index === -1) return null;
    
    todos[index] = updatedTodo;
    this.writeAll(todos);
    return todos[index];
  }

  // Xóa todo theo ID
  delete(id) {
    const todos = this.readAll();
    const index = this.findIndexById(id);
    
    if (index === -1) return false;
    
    todos.splice(index, 1);
    this.writeAll(todos);
    return true;
  }

  // Đếm tổng số todos
  count() {
    return this.readAll().length;
  }

  // Kiểm tra todo có tồn tại không
  exists(id) {
    return this.findById(id) !== null;
  }
}

module.exports = new TodoRepository();
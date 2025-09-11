// Nhận request, trả response cho todo
const todoService = require('../services/todoService');

exports.getAllTodos = (req, res) => {
  try {
    const todos = todoService.getAllTodos();
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy danh sách công việc' });
  }
};

exports.getTodoById = (req, res) => {
  try {
    const todo = todoService.getTodoById(req.params.id);
    if (!todo) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json(todo);
  } catch (error) {
    res.status(500).json({ error: 'Không thể lấy công việc' });
  }
};

exports.createTodo = (req, res) => {
  try {
    const { title, description = '' } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Tiêu đề là bắt buộc' });
    }
    const newTodo = todoService.createTodo(title, description);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Không thể tạo công việc' });
  }
};

exports.updateTodo = (req, res) => {
  try {
    const updatedTodo = todoService.updateTodo(req.params.id, req.body);
    if (!updatedTodo) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json(updatedTodo);
  } catch (error) {
    res.status(500).json({ error: 'Không thể cập nhật công việc' });
  }
};

exports.deleteTodo = (req, res) => {
  try {
    const deletedTodo = todoService.deleteTodo(req.params.id);
    if (!deletedTodo) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json({ message: 'Xóa công việc thành công', todo: deletedTodo });
  } catch (error) {
    res.status(500).json({ error: 'Không thể xóa công việc' });
  }
};

exports.toggleTodo = (req, res) => {
  try {
    const toggledTodo = todoService.toggleTodo(req.params.id);
    if (!toggledTodo) {
      return res.status(404).json({ error: 'Không tìm thấy công việc' });
    }
    res.json(toggledTodo);
  } catch (error) {
    res.status(500).json({ error: 'Không thể đổi trạng thái công việc' });
  }
};

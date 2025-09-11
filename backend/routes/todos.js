const express = require('express');
const router = express.Router();
const todoController = require('../controllers/todoController');

// Lấy tất cả công việc
router.get('/', todoController.getAllTodos);
// Lấy công việc theo id
router.get('/:id', todoController.getTodoById);
// Thêm công việc mới
router.post('/', todoController.createTodo);
// Cập nhật công việc
router.put('/:id', todoController.updateTodo);
// Xóa công việc
router.delete('/:id', todoController.deleteTodo);
// Đổi trạng thái hoàn thành công việc
router.patch('/:id/toggle', todoController.toggleTodo);

module.exports = router;
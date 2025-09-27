const todoService = require('../services/todoService');
const fs = require('fs');

/**
 * Get all todos with pagination and filtering
 */
exports.getAllTodos = async (req, res) => {
  try {
    const { page, limit, search, priority, status } = req.query;
    const result = await todoService.getAllTodos({ page, limit, search, priority, status });
    res.json({
      success: true,
      data: result,
      message: 'Successfully retrieved todos'
    });
  } catch (err) {
    console.error('Error in getAllTodos:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to retrieve todos',
        details: err.message
      }
    });
  }
};

/**
 * Create a new todo
 */
exports.createTodo = async (req, res) => {
  try {
    const todo = await todoService.createTodo(req.body);
    res.status(201).json({
      success: true,
      data: todo,
      message: 'Todo created successfully'
    });
  } catch (err) {
    console.error('Error in createTodo:', err);
    res.status(400).json({
      success: false,
      error: {
        message: 'Failed to create todo',
        details: err.message
      }
    });
  }
};

/**
 * Update a todo
 */
exports.updateTodo = async (req, res) => {
  try {
    const updated = await todoService.updateTodo(req.params.id, req.body);
    if (updated) {
      res.json({
        success: true,
        data: updated,
        message: 'Todo updated successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          message: 'Todo not found',
          details: 'The requested todo does not exist'
        }
      });
    }
  } catch (err) {
    console.error('Error in updateTodo:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update todo',
        details: err.message
      }
    });
  }
};

/**
 * Delete a todo
 */
exports.deleteTodo = async (req, res) => {
  try {
    const deleted = await todoService.deleteTodo(req.params.id);
    if (deleted) {
      res.json({
        success: true,
        message: 'Todo deleted successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: {
          message: 'Todo not found',
          details: 'The requested todo does not exist'
        }
      });
    }
  } catch (err) {
    console.error('Error in deleteTodo:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete todo',
        details: err.message
      }
    });
  }
};

// Upload file cho 1 todo
exports.uploadFile = (req, res) => {
  try {
    const attachment = todoService.uploadFile(req.params.id, req.file);
    if (!attachment) {
      return res.status(404).json({ message: 'Todo không tồn tại' });
    }
    res.json({ message: 'Upload file thành công', attachment });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Export todos to JSON format
 */
exports.exportTodos = async (req, res) => {
  try {
    const data = await todoService.exportTodos();
    res.setHeader('Content-Disposition', 'attachment; filename=todos-export.json');
    res.json({
      success: true,
      data: data,
      message: 'Todos exported successfully'
    });
  } catch (err) {
    console.error('Error in exportTodos:', err);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to export todos',
        details: err.message
      }
    });
  }
};

/**
 * Import todos from JSON file with duplicate checking
 */
exports.importTodos = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Không có file được tải lên',
          details: 'Vui lòng chọn file JSON để import'
        }
      });
    }

    const result = await todoService.importTodos(req.file);
    
    res.json({
      success: true,
      message: result.message,
      data: result.data
    });
  } catch (err) {
    console.error('Error in importTodos:', err);
    res.status(400).json({
      success: false,
      error: {
        message: 'Không thể import todos',
        details: err.message
      }
    });
  }
};

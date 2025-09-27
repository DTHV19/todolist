const todoModel = require('../models/todoModel');
const fs = require('fs');
const path = require('path');

/**
 * Get all todos with pagination and filtering
 * @param {Object} options Filter and pagination options
 * @returns {Object} Todos and pagination info
 */
exports.getAllTodos = async ({ page = 1, limit = 5, search = '', priority = '', status = '' }) => {
  let todos = todoModel.readTodos();

  // Filters
  if (search) {
    todos = todos.filter(todo =>
      todo.title.toLowerCase().includes(search.toLowerCase()) ||
      todo.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (priority) todos = todos.filter(todo => todo.priority === priority);
  if (status === 'completed') todos = todos.filter(todo => todo.completed);
  if (status === 'pending') todos = todos.filter(todo => !todo.completed);

  // Sort by creation date
  todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Pagination
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;

  return {
    todos: todos.slice(startIndex, endIndex),
    pagination: {
      currentPage: pageNum,
      totalPages: Math.ceil(todos.length / limitNum),
      totalTodos: todos.length,
      limit: limitNum,
      hasNext: pageNum < Math.ceil(todos.length / limitNum),
      hasPrev: pageNum > 1
    }
  };
};

exports.createTodo = async ({ title, description = '', priority = 'medium', dueDate }) => {
  if (!title) throw new Error('Title is required');
  const todos = todoModel.readTodos();
  const newTodo = {
    id: Date.now().toString(),
    title,
    description,
    completed: false,
    priority,
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attachments: []
  };
  todos.push(newTodo);
  todoModel.writeTodos(todos);
  return newTodo;
};

exports.updateTodo = async (id, updates) => {
  const todos = todoModel.readTodos();
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return null;
  todos[idx] = { ...todos[idx], ...updates, updatedAt: new Date().toISOString() };
  todoModel.writeTodos(todos);
  return todos[idx];
};

exports.deleteTodo = async (id) => {
  const todos = todoModel.readTodos();
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return false;

  // delete attached files
  const todo = todos[idx];
  if (todo.attachments) {
    todo.attachments.forEach(att => {
      const filePath = path.join(__dirname, '..', 'uploads', att.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });
  }

  todos.splice(idx, 1);
  todoModel.writeTodos(todos);
  return true;
};


exports.exportTodos = () => {
  const todos = todoModel.readTodos();
  return {
    exportedAt: new Date().toISOString(),
    totalTodos: todos.length,
    todos
  };
};

/**
 * Import todos from a JSON file with duplicate checking
 * @param {Object} file The uploaded file object
 * @returns {Object} Import results with detailed information
 */
exports.importTodos = (file) => {
  if (!file) throw new Error('No file uploaded');

  try {
    // Đọc và parse dữ liệu từ file JSON
    const content = fs.readFileSync(file.path, 'utf8');
    let importData;
    
    try {
      importData = JSON.parse(content);
    } catch (parseError) {
      throw new Error('File không phải định dạng JSON hợp lệ');
    }

    // Xác định danh sách todos cần import
    let todosToImport = [];
    if (Array.isArray(importData)) {
      todosToImport = importData;
    } else if (importData.todos && Array.isArray(importData.todos)) {
      todosToImport = importData.todos;
    } else {
      throw new Error('File không chứa dữ liệu todos hợp lệ');
    }

    if (todosToImport.length === 0) {
      throw new Error('File không chứa todos nào để import');
    }

    const currentTodos = todoModel.readTodos();

    // Các trường chính để so sánh trùng lặp
    const fieldsToCompare = ["title", "description", "priority", "dueDate"];

    /**
     * Chuẩn hóa giá trị field để so sánh chính xác
     * @param {string} field Tên field
     * @param {any} value Giá trị cần chuẩn hóa
     * @returns {any} Giá trị đã chuẩn hóa
     */
    const normalizeField = (field, value) => {
      switch (field) {
        case 'title':
        case 'description':
          // Chuẩn hóa string: loại bỏ khoảng trắng thừa, chuyển về lowercase
          return value ? value.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
        
        case 'priority':
          // Chuẩn hóa priority: chuyển về string lowercase
          return value ? value.toString().toLowerCase().trim() : 'medium';
        
        case 'dueDate':
          // Chuẩn hóa date: chuyển về ISO string hoặc null
          if (!value) return null;
          try {
            const date = new Date(value);
            return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0]; // Chỉ lấy phần ngày
          } catch {
            return null;
          }
        
        default:
          return value;
      }
    };

    /**
     * Kiểm tra xem todo có trùng lặp với todo hiện tại không
     * @param {Object} importTodo Todo cần kiểm tra
     * @param {Array} existingTodos Danh sách todos hiện tại
     * @returns {boolean} True nếu trùng lặp
     */
    const isDuplicate = (importTodo, existingTodos) => {
      return existingTodos.some(existingTodo => {
        return fieldsToCompare.every(field => {
          const importValue = normalizeField(field, importTodo[field]);
          const existingValue = normalizeField(field, existingTodo[field]);
          return importValue === existingValue;
        });
      });
    };

    // Phân loại todos: mới và trùng lặp
    const newTodos = [];
    const duplicatedTodos = [];

    todosToImport.forEach(todo => {
      if (!todo.title || todo.title.trim() === '') {
        // Bỏ qua todos không có title
        return;
      }

      if (isDuplicate(todo, currentTodos)) {
        duplicatedTodos.push({
          title: todo.title,
          description: todo.description || '',
          priority: todo.priority || 'medium',
          dueDate: todo.dueDate || null
        });
      } else {
        newTodos.push(todo);
      }
    });

    // Xử lý todos mới: thêm id và timestamp
    const processedTodos = newTodos.map((todo, index) => ({
      id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      title: todo.title.trim(),
      description: (todo.description || '').trim(),
      completed: !!todo.completed,
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: todo.attachments || [],
      importedAt: new Date().toISOString()
    }));

    // Cập nhật danh sách todos
    const updatedTodos = [...currentTodos, ...processedTodos];
    todoModel.writeTodos(updatedTodos);

    // Xóa file tạm
    try {
      fs.unlinkSync(file.path);
    } catch (unlinkError) {
      console.warn('Không thể xóa file tạm:', unlinkError.message);
    }

    // Trả về kết quả chi tiết
    return {
      success: true,
      message: `Import hoàn tất: ${processedTodos.length} todos mới, ${duplicatedTodos.length} todos trùng lặp`,
      data: {
        totalImported: processedTodos.length,
        totalDuplicated: duplicatedTodos.length,
        totalProcessed: todosToImport.length,
        totalTodos: updatedTodos.length,
        newTodos: processedTodos.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          priority: t.priority
        })),
        duplicatedTodos: duplicatedTodos
      }
    };

  } catch (error) {
    // Xóa file tạm trong trường hợp lỗi
    try {
      fs.unlinkSync(file.path);
    } catch (unlinkError) {
      console.warn('Không thể xóa file tạm:', unlinkError.message);
    }
    
    throw new Error(`Lỗi import todos: ${error.message}`);
  }
};


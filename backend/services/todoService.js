const todoRepository = require('../repositories/todoRepository');
const todoBusinessLogic = require('../business/todoBusinessLogic');
const todoValidator = require('../validators/todoValidator');
const fs = require('fs');
const path = require('path');

// Service Layer - Điều phối giữa các layer

// Lấy tất cả todos với phân trang và lọc
exports.getAllTodos = async ({ page = 1, limit = 5, search = '', priority = '', status = '', sortBy = 'createdAt' }) => {
  try {
    // Lấy tất cả todos từ repository
    const allTodos = todoRepository.readAll();
    
    // Áp dụng filters qua business logic
    const filteredTodos = todoBusinessLogic.applyFilters(allTodos, {
      search,
      priority,
      status
    });
    
    // Áp dụng sorting qua business logic
    const sortedTodos = todoBusinessLogic.applySorting(filteredTodos, sortBy);
    
    // Áp dụng pagination qua business logic
    return todoBusinessLogic.applyPagination(sortedTodos, page, limit);
    
  } catch (error) {
    throw new Error(`Lỗi lấy danh sách todos: ${error.message}`);
  }
};

// Tạo todo mới
exports.createTodo = async (todoData) => {
  try {
    // Validate dữ liệu qua validator - isUpdate = false cho tạo mới
    const errors = todoValidator.validateTodoData(todoData, false);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Sanitize input
    const sanitizedData = todoValidator.sanitizeInput(todoData);
    
    // Tạo todo object qua business logic
    const newTodo = todoBusinessLogic.createNewTodo(sanitizedData);
    
    // Lưu vào database qua repository
    return todoRepository.create(newTodo);
    
  } catch (error) {
    throw new Error(`Lỗi tạo todo: ${error.message}`);
  }
};

// Cập nhật todo
exports.updateTodo = async (id, updates) => {
  try {
    // Validate ID
    const idErrors = todoValidator.validateId(id);
    if (idErrors.length > 0) {
      throw new Error(idErrors.join(', '));
    }
    
    // Validate dữ liệu update - truyền flag isUpdate = true
    const errors = todoValidator.validateTodoData(updates, true);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Sanitize input
    const sanitizedUpdates = todoValidator.sanitizeInput(updates);
    
    // Lấy todo hiện tại
    const existingTodo = todoRepository.findById(id);
    if (!existingTodo) {
      throw new Error('Todo không tồn tại');
    }
    
    // Cập nhật với lịch sử qua business logic (không chuẩn hóa toàn bộ)
    const updatedTodo = todoBusinessLogic.updateTodoWithHistory(existingTodo, sanitizedUpdates);
    
    // Lưu vào database qua repository
    return todoRepository.update(id, updatedTodo);
    
  } catch (error) {
    throw new Error(`Lỗi cập nhật todo: ${error.message}`);
  }
};

// Xóa todo
exports.deleteTodo = async (id) => {
  try {
    // Validate ID
    const idErrors = todoValidator.validateId(id);
    if (idErrors.length > 0) {
      throw new Error(idErrors.join(', '));
    }
    
    // Kiểm tra todo có tồn tại không
    const existingTodo = todoRepository.findById(id);
    if (!existingTodo) {
      throw new Error('Todo không tồn tại');
    }
    
    // Xóa files attachments trước
    if (existingTodo.attachments) {
      existingTodo.attachments.forEach(att => {
        const filePath = path.join(__dirname, '..', 'uploads', att.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });
    }
    
    // Xóa todo qua repository
    return todoRepository.delete(id);
    
  } catch (error) {
    throw new Error(`Lỗi xóa todo: ${error.message}`);
  }
};


// Upload file ảnh vào todo
exports.uploadFile = async (todoId, file) => {
  try {
    // Validate ID
    const idErrors = todoValidator.validateId(todoId);
    if (idErrors.length > 0) {
      throw new Error(idErrors.join(', '));
    }
    
    // Validate file
    const fileErrors = todoValidator.validateFileUpload(file);
    if (fileErrors.length > 0) {
      // Xóa file không hợp lệ
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.warn('Không thể xóa file:', error.message);
      }
      throw new Error(fileErrors.join(', '));
    }

    // Kiểm tra todo có tồn tại không
    const existingTodo = todoRepository.findById(todoId);
    if (!existingTodo) {
      // Xóa file nếu không tìm thấy todo
      try {
        fs.unlinkSync(file.path);
      } catch (error) {
        console.warn('Không thể xóa file:', error.message);
      }
      throw new Error('Todo không tồn tại');
    }

    // Tạo attachment object qua business logic
    const attachment = todoBusinessLogic.createAttachment(file);
    
    // Thêm attachment vào todo
    const updatedTodo = { ...existingTodo };
    if (!updatedTodo.attachments) {
      updatedTodo.attachments = [];
    }
    updatedTodo.attachments.push(attachment);
    updatedTodo.updatedAt = new Date().toISOString();
    
    // Lưu vào database
    todoRepository.update(todoId, updatedTodo);
    
    return {
      todo: updatedTodo,
      attachment: attachment
    };
    
  } catch (error) {
    throw new Error(`Lỗi upload file: ${error.message}`);
  }
};

// Xóa attachment khỏi todo  
exports.removeAttachment = async (todoId, attachmentId) => {
  try {
    // Validate IDs
    const idErrors = todoValidator.validateId(todoId);
    if (idErrors.length > 0) {
      throw new Error(idErrors.join(', '));
    }

    const attachmentIdErrors = todoValidator.validateId(attachmentId);
    if (attachmentIdErrors.length > 0) {
      throw new Error('Attachment ID không hợp lệ');
    }

    // Lấy todo hiện tại
    const existingTodo = todoRepository.findById(todoId);
    if (!existingTodo) {
      throw new Error('Todo không tồn tại');
    }

    if (!existingTodo.attachments || existingTodo.attachments.length === 0) {
      throw new Error('Todo không có attachment nào');
    }

    // Tìm attachment cần xóa
    const attachmentIndex = existingTodo.attachments.findIndex(a => a.id === attachmentId);
    if (attachmentIndex === -1) {
      throw new Error('Attachment không tồn tại');
    }

    const attachment = existingTodo.attachments[attachmentIndex];
    
    // Xóa file từ filesystem
    const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn('Không thể xóa file attachment:', error.message);
    }
    
    // Xóa attachment khỏi array
    const updatedTodo = { ...existingTodo };
    updatedTodo.attachments.splice(attachmentIndex, 1);
    updatedTodo.updatedAt = new Date().toISOString();
    
    // Lưu vào database qua repository
    return todoRepository.update(todoId, updatedTodo);
    
  } catch (error) {
    throw new Error(`Lỗi xóa attachment: ${error.message}`);
  }
};

// Lấy thống kê todos
exports.getTodosStatistics = async () => {
  try {
    const allTodos = todoRepository.readAll();
    return todoBusinessLogic.calculateStatistics(allTodos);
  } catch (error) {
    throw new Error(`Lỗi lấy thống kê: ${error.message}`);
  }
};

// Export todos
exports.exportTodos = async () => {
  try {
    const todos = todoRepository.readAll();
    return {
      exportedAt: new Date().toISOString(),
      totalTodos: todos.length,
      todos
    };
  } catch (error) {
    throw new Error(`Lỗi export todos: ${error.message}`);
  }
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

    const currentTodos = todoRepository.readAll();

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
    todoRepository.writeAll(updatedTodos);

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


const todoModel = require('../models/todoModel');
const fs = require('fs');
const path = require('path');

// Lấy tất cả todos với phân trang và lọc
exports.getAllTodos = async ({ page = 1, limit = 5, search = '', priority = '', status = '', sortBy = 'createdAt' }) => {
  let todos = todoModel.readTodos();

  // Lọc dữ liệu
  if (search) {
    todos = todos.filter(todo =>
      todo.title.toLowerCase().includes(search.toLowerCase()) ||
      todo.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  // Sửa logic filter priority - chuẩn hóa priority trước khi so sánh
  if (priority) {
    todos = todos.filter(todo => {
      const todoPriority = (todo.priority || 'medium').toLowerCase();
      return todoPriority === priority.toLowerCase();
    });
  }
  
  if (status === 'completed') todos = todos.filter(todo => todo.completed);
  if (status === 'pending') todos = todos.filter(todo => !todo.completed);


  // Sắp xếp
  todos.sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        // Sắp xếp theo thời hạn: sắp tới trước, xa nhất sau, quá hạn cuối, không có hạn cuối cùng
        const aDate = a.dueDate ? new Date(a.dueDate) : null;
        const bDate = b.dueDate ? new Date(b.dueDate) : null;
        const now = new Date();
        
        // Không có ngày hết hạn -> cuối cùng
        if (!aDate && !bDate) return 0;
        if (!aDate) return 1;
        if (!bDate) return -1;
        
        const aOverdue = aDate < now && !a.completed;
        const bOverdue = bDate < now && !b.completed;
        
        // Cả 2 đều quá hạn -> sắp xếp theo ngày (gần nhất trước)
        if (aOverdue && bOverdue) return bDate - aDate;
        
        // Cả 2 đều chưa quá hạn -> sắp xếp theo ngày (gần nhất trước)
        if (!aOverdue && !bOverdue) return aDate - bDate;
        
        // Một cái quá hạn, một cái chưa -> chưa quá hạn lên trước
        if (aOverdue && !bOverdue) return 1;
        if (!aOverdue && bOverdue) return -1;
        
        return 0;
        
      case 'priority':
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        const aPriority = priorityOrder[a.priority] || 0;
        const bPriority = priorityOrder[b.priority] || 0;
        return bPriority - aPriority; // Ưu tiên cao trước
        
      case 'title':
        return a.title.localeCompare(b.title);
        
      case 'status':
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1; // Chưa hoàn thành trước
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
        
      case 'createdAt':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt); // Mới nhất trước
    }
  });

  // Phân trang
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
  
  const oldTodo = { ...todos[idx] };
  const now = new Date().toISOString();
  
  // Tạo lịch sử chỉnh sửa
  const editHistory = oldTodo.editHistory || [];
  editHistory.push({
    editedAt: now,
    changes: updates,
    previousValues: {
      title: oldTodo.title,
      description: oldTodo.description,
      priority: oldTodo.priority,
      dueDate: oldTodo.dueDate,
      completed: oldTodo.completed
    }
  });
  
  todos[idx] = { 
    ...oldTodo, 
    ...updates, 
    updatedAt: now,
    editHistory: editHistory
  };
  
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


// Upload file ảnh vào todo
exports.uploadFile = async (todoId, file) => {
  if (!file) throw new Error('No file uploaded');
  
  const todos = todoModel.readTodos();
  const todoIndex = todos.findIndex(t => t.id === todoId);
  
  if (todoIndex === -1) {
    // Xóa file nếu không tìm thấy todo
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn('Không thể xóa file:', error.message);
    }
    return null;
  }
  
  // Kiểm tra định dạng file ảnh
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.mimetype)) {
    // Xóa file không hợp lệ
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn('Không thể xóa file không hợp lệ:', error.message);
    }
    throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
  }
  
  // Kiểm tra kích thước file (tối đa 5MB)
  if (file.size > 5 * 1024 * 1024) {
    try {
      fs.unlinkSync(file.path);
    } catch (error) {
      console.warn('Không thể xóa file quá lớn:', error.message);
    }
    throw new Error('File ảnh quá lớn. Kích thước tối đa là 5MB');
  }
  
  const attachment = {
    id: Date.now().toString(),
    filename: file.filename,
    originalName: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    url: `/uploads/${file.filename}`
  };
  
  // Tạo mảng attachments nếu chưa có
  if (!todos[todoIndex].attachments) {
    todos[todoIndex].attachments = [];
  }
  
  todos[todoIndex].attachments.push(attachment);
  todos[todoIndex].updatedAt = new Date().toISOString();
  
  todoModel.writeTodos(todos);
  
  return {
    todo: todos[todoIndex],
    attachment: attachment
  };
};

/**
 * Remove file attachment from a todo
 * @param {string} todoId Todo ID
 * @param {string} attachmentId Attachment ID
 * @returns {Object} Updated todo
 */
exports.removeAttachment = async (todoId, attachmentId) => {
  const todos = todoModel.readTodos();
  const todoIndex = todos.findIndex(t => t.id === todoId);
  
  if (todoIndex === -1) return null;
  
  const todo = todos[todoIndex];
  if (!todo.attachments) return todo;
  
  const attachmentIndex = todo.attachments.findIndex(a => a.id === attachmentId);
  if (attachmentIndex === -1) return todo;
  
  const attachment = todo.attachments[attachmentIndex];
  
  // Delete file from filesystem
  const filePath = path.join(__dirname, '..', 'uploads', attachment.filename);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn('Could not delete attachment file:', error.message);
  }
  
  // Remove from attachments array
  todo.attachments.splice(attachmentIndex, 1);
  todo.updatedAt = new Date().toISOString();
  
  todoModel.writeTodos(todos);
  
  return todo;
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


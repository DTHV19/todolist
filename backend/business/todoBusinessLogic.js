// Business Logic Layer - Xử lý logic nghiệp vụ

class TodoBusinessLogic {
  // Tạo todo mới với logic nghiệp vụ
  createNewTodo(todoData) {
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: (todoData.title || '').trim(),
      description: (todoData.description || '').trim(),
      completed: false,
      priority: (todoData.priority || 'medium').toLowerCase(),
      dueDate: todoData.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attachments: [],
      editHistory: []
    };
  }

  // Cập nhật todo với lịch sử chỉnh sửa
  updateTodoWithHistory(existingTodo, updates) {
    const now = new Date().toISOString();
    
    // Tạo lịch sử chỉnh sửa
    const editHistory = existingTodo.editHistory || [];
    editHistory.push({
      editedAt: now,
      changes: updates,
      previousValues: {
        title: existingTodo.title,
        description: existingTodo.description,
        priority: existingTodo.priority,
        dueDate: existingTodo.dueDate,
        completed: existingTodo.completed
      }
    });

    return {
      ...existingTodo,
      ...updates,
      updatedAt: now,
      editHistory: editHistory
    };
  }

  // Áp dụng filters
  applyFilters(todos, filters) {
    let filteredTodos = [...todos];

    // Filter theo search
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filteredTodos = filteredTodos.filter(todo =>
        todo.title.toLowerCase().includes(searchTerm) ||
        todo.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filter theo priority
    if (filters.priority) {
      filteredTodos = filteredTodos.filter(todo => {
        const todoPriority = (todo.priority || 'medium').toLowerCase();
        return todoPriority === filters.priority.toLowerCase();
      });
    }

    // Filter theo status
    if (filters.status === 'completed') {
      filteredTodos = filteredTodos.filter(todo => todo.completed);
    } else if (filters.status === 'pending') {
      filteredTodos = filteredTodos.filter(todo => !todo.completed);
    }

    return filteredTodos;
  }

  // Áp dụng sorting
  applySorting(todos, sortBy) {
    return todos.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
          
        case 'dueDate':
          // Sắp xếp theo thời hạn: sắp tới trước, xa nhất sau, không có hạn cuối
          const aDate = a.dueDate ? new Date(a.dueDate) : null;
          const bDate = b.dueDate ? new Date(b.dueDate) : null;
          const now = new Date();
          
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          
          const aOverdue = aDate < now && !a.completed;
          const bOverdue = bDate < now && !b.completed;
          
          if (aOverdue && bOverdue) return bDate - aDate;
          if (!aOverdue && !bOverdue) return aDate - bDate;
          if (aOverdue && !bOverdue) return 1;
          if (!aOverdue && bOverdue) return -1;
          
          return 0;
          
        case 'priority':
          const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
          const aPriority = priorityOrder[a.priority] || 0;
          const bPriority = priorityOrder[b.priority] || 0;
          return bPriority - aPriority;
          
        case 'createdAt':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });
  }

  // Áp dụng pagination
  applyPagination(todos, page, limit) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
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
  }

  // Tạo attachment object
  createAttachment(file) {
    return {
      id: Date.now().toString(),
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${file.filename}`
    };
  }

  // Tính thống kê todos
  calculateStatistics(todos) {
    return {
      total: todos.length,
      priority: {
        high: todos.filter(t => (t.priority || 'medium').toLowerCase() === 'high').length,
        medium: todos.filter(t => (t.priority || 'medium').toLowerCase() === 'medium').length,
        low: todos.filter(t => (t.priority || 'medium').toLowerCase() === 'low').length,
      },
      status: {
        completed: todos.filter(t => t.completed === true).length,
        pending: todos.filter(t => t.completed !== true).length,
      }
    };
  }

  // So sánh todos để tìm trùng lặp
  isDuplicateTodo(importTodo, existingTodos) {
    const fieldsToCompare = ['title', 'description', 'priority', 'dueDate'];
    
    return existingTodos.some(existingTodo => {
      return fieldsToCompare.every(field => {
        const importValue = this.normalizeFieldValue(field, importTodo[field]);
        const existingValue = this.normalizeFieldValue(field, existingTodo[field]);
        return importValue === existingValue;
      });
    });
  }

  // Chuẩn hóa giá trị field để so sánh
  normalizeFieldValue(field, value) {
    switch (field) {
      case 'title':
      case 'description':
        return value ? value.toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
      
      case 'priority':
        return value ? value.toString().toLowerCase().trim() : 'medium';
      
      case 'dueDate':
        if (!value) return null;
        try {
          const date = new Date(value);
          return isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
        } catch {
          return null;
        }
      
      default:
        return value;
    }
  }
}

module.exports = new TodoBusinessLogic();

const API_BASE_URL = 'http://localhost:5000/api/todos';

/**
 * Get all todos with pagination and filtering
 * @param {number} page Page number
 * @param {number} limit Items per page
 * @param {string} search Search term
 * @param {string} priority Priority filter
 * @param {string} status Status filter
 * @param {string} dueDate Due date filter
 * @returns {Promise<Object>} Todos and pagination info
 */
export const getAllTodos = async (page=1, limit=5, search='', priority='', status='', dueDateFilter='', sortBy='createdAt') => {
  try {
    const params = new URLSearchParams({ page, limit, search, priority, status, dueDateFilter, sortBy });
    const res = await fetch(`${API_BASE_URL}?${params}`);
    
    if (!res.ok) {
      let errorMessage = 'Failed to load todos';
      try {
        const error = await res.json();
        errorMessage = error.error?.details || error.error?.message || error.message || errorMessage;
      } catch (parseError) {
        console.warn('Could not parse error response:', parseError);
      }
      throw new Error(errorMessage);
    }
    
    const response = await res.json();
    
    // Handle both old and new response formats safely
    if (response && response.success !== undefined) {
      // New format: {success: true, data: {...}}
      return response.data || { todos: [], pagination: {} };
    } else {
      // Old format: direct data
      return response || { todos: [], pagination: {} };
    }
  } catch (error) {
    console.error('Error fetching todos:', error);
    // Return safe default instead of throwing
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server có đang chạy không.');
    }
    throw new Error(error.message || 'Failed to load todos');
  }
};

/**
 * Create a new todo
 * @param {Object} todoData Todo data to create
 * @returns {Promise<Object>} Created todo
 */
export const createTodo = async (todoData) => {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todoData)
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to create todo');
    }
    
    return result.data; // Extract data from standardized response
  } catch (error) {
    console.error('Error creating todo:', error);
    throw new Error(error.message || 'Failed to create todo');
  }
};

/**
 * Update a todo
 * @param {string} id Todo ID
 * @param {Object} todoData Updated todo data
 * @returns {Promise<Object>} Updated todo
 */
export const updateTodo = async (id, todoData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todoData)
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to update todo');
    }
    
    return result.data; // Extract data from standardized response
  } catch (error) {
    console.error('Error updating todo:', error);
    throw new Error(error.message || 'Failed to update todo');
  }
};

/**
 * Delete a todo
 * @param {string} id Todo ID
 * @returns {Promise<Object>} Delete confirmation
 */
export const deleteTodo = async (id) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to delete todo');
    }
    
    return result; // Return success confirmation
  } catch (error) {
    console.error('Error deleting todo:', error);
    throw new Error(error.message || 'Failed to delete todo');
  }
};

/**
 * Import todos from a JSON file
 * @param {File} file The JSON file to import
 * @returns {Promise<Object>} Import results
 */
export const importTodos = async (file) => {
  try {
    if (!file) {
      throw new Error('Vui lòng chọn file để import');
    }

    // Kiểm tra định dạng file
    if (!file.name.toLowerCase().endsWith('.json')) {
      throw new Error('Chỉ chấp nhận file định dạng JSON');
    }

    // Kiểm tra kích thước file (tối đa 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File quá lớn. Kích thước tối đa là 10MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE_URL}/import/json`, { 
      method: 'POST', 
      body: formData 
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Không thể nhập todos');
    }

    return result;
  } catch (error) {
    console.error('Error importing todos:', error);
    throw new Error(error.message || 'Lỗi không xác định khi import todos');
  }
};

/**
 * Export todos to JSON format
 * @returns {Promise<Object>} Export data
 */
export const exportTodos = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/export/json`);
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to export todos');
    }
    
    return result.data || result; // Handle both old and new response formats
  } catch (error) {
    console.error('Error exporting todos:', error);
    throw new Error(error.message || 'Failed to export todos');
  }
};

/**
 * Upload file attachment to a todo
 * @param {string} todoId Todo ID
 * @param {File} file File to upload
 * @returns {Promise<Object>} Upload result
 */
export const uploadFile = async (todoId, file) => {
  try {
    if (!file) {
      throw new Error('Vui lòng chọn file để upload');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File ảnh quá lớn. Kích thước tối đa là 5MB');
    }

    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_BASE_URL}/${todoId}/upload`, { 
      method: 'POST', 
      body: formData 
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to upload file');
    }

    return result.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error(error.message || 'Failed to upload file');
  }
};

/**
 * Remove file attachment from a todo
 * @param {string} todoId Todo ID
 * @param {string} attachmentId Attachment ID
 * @returns {Promise<Object>} Updated todo
 */
export const removeAttachment = async (todoId, attachmentId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/${todoId}/attachments/${attachmentId}`, { 
      method: 'DELETE' 
    });
    
    const result = await res.json();
    
    if (!res.ok) {
      throw new Error(result.error?.details || result.error?.message || 'Failed to remove attachment');
    }

    return result.data;
  } catch (error) {
    console.error('Error removing attachment:', error);
    throw new Error(error.message || 'Failed to remove attachment');
  }
};


const TodoService = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo,
  importTodos,
  exportTodos,
  uploadFile,
  removeAttachment
};

export default TodoService;

import axios from 'axios';

// Tạo một axios instance với base URL
const api = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://your-backend-url.com/api' 
    : 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptors để xử lý lỗi từ API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra xem server có đang chạy không.');
    }
    
    if (error.response) {
      // Server trả về lỗi với status code
      const message = error.response.data?.error || error.response.data?.message || 'Lỗi từ server';
      throw new Error(message);
    }
    
    if (error.request) {
      // Request đã được gửi nhưng không nhận được phản hồi
      throw new Error('Không nhận được phản hồi từ server');
    }
    
    // Các lỗi khác
    throw new Error(error.message || 'Đã có lỗi xảy ra');
  }
);

// Các hàm thao tác với Todo API
export const getAllTodos = async () => {
  try {
    const response = await api.get('/todos');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getTodoById = async (id) => {
  try {
    const response = await api.get(`/todos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createTodo = async (title, description = '') => {
  try {
    const response = await api.post('/todos', {
      title: title.trim(),
      description: description.trim()
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateTodo = async (id, updates) => {
  try {
    const response = await api.put(`/todos/${id}`, updates);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteTodo = async (id) => {
  try {
    const response = await api.delete(`/todos/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const toggleTodo = async (id) => {
  try {
    const response = await api.patch(`/todos/${id}/toggle`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Hàm kiểm tra tình trạng server (health check)
export const checkHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw error;
  }
};

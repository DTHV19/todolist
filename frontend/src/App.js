import React, { useState, useEffect } from 'react';
import TodoList from './components/TodoList';
import AddTodo from './components/AddTodo';
import * as todoService from './services/todoService';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    try {
      setLoading(true);
      const data = await todoService.getAllTodos();
      setTodos(data);
    } catch (error) {
      console.error('Error loading todos:', error);
      alert('Không thể tải danh sách todo');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (title, description) => {
    try {
      const newTodo = await todoService.createTodo(title, description);
      setTodos(prev => [...prev, newTodo]);
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Không thể thêm todo mới');
    }
  };

  const updateTodo = async (id, updates) => {
    try {
      const updatedTodo = await todoService.updateTodo(id, updates);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Error updating todo:', error);
      alert('Không thể cập nhật todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      await todoService.deleteTodo(id);
      setTodos(prev => prev.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
      alert('Không thể xóa todo');
    }
  };

  const toggleTodo = async (id) => {
    try {
      const updatedTodo = await todoService.toggleTodo(id);
      setTodos(prev => prev.map(todo => 
        todo.id === id ? updatedTodo : todo
      ));
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Không thể cập nhật trạng thái todo');
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const totalTodos = todos.length;
  const completedTodos = todos.filter(todo => todo.completed).length;
  const activeTodos = totalTodos - completedTodos;

  if (loading) {
    return (
      <div className="app">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <h1>📝 TodoList App</h1>
          <p>Quản lý công việc của bạn một cách hiệu quả</p>
        </header>

        <AddTodo onAdd={addTodo} />

        <div className="stats">
          <div className="stat-item">
            <span className="stat-number">{totalTodos}</span>
            <span className="stat-label">Tổng cộng</span>
          </div>
          <div className="stat-item">
            <span className="stat-number active">{activeTodos}</span>
            <span className="stat-label">Đang làm</span>
          </div>
          <div className="stat-item">
            <span className="stat-number completed">{completedTodos}</span>
            <span className="stat-label">Hoàn thành</span>
          </div>
        </div>

        <div className="filters">
          <button 
            className={filter === 'all' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('all')}
          >
            Tất cả
          </button>
          <button 
            className={filter === 'active' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('active')}
          >
            Đang làm
          </button>
          <button 
            className={filter === 'completed' ? 'filter-btn active' : 'filter-btn'}
            onClick={() => setFilter('completed')}
          >
            Hoàn thành
          </button>
        </div>

        <TodoList 
          todos={filteredTodos}
          onUpdate={updateTodo}
          onDelete={deleteTodo}
          onToggle={toggleTodo}
        />

        {filteredTodos.length === 0 && (
          <div className="empty-state">
            <p>
              {filter === 'all' && 'Chưa có todo nào. Hãy thêm todo đầu tiên!'}
              {filter === 'active' && 'Không có todo đang làm nào.'}
              {filter === 'completed' && 'Chưa có todo nào được hoàn thành.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
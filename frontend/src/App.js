import React, { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import todoService from './api/todoService';
import TodoForm from './components/TodoForm';
import TodoItem from './components/TodoItem';
import FilterBar from './components/FilterBar';
import SearchBar from './components/SearchBar';
import Pagination from './components/Pagination';
import ImportExportButtons from './components/ImportExportButtons';
import ImportModal from './components/ImportModal';
import NotificationContainer, { useNotification } from './components/Notification';
import { Plus, X } from 'lucide-react';

// 📹 Hàm bỏ dấu tiếng Việt
const removeVietnameseTones = (str) => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Đ/g, 'd')
    .replace(/Ð/g, 'D');
};

export default function TodoApp() {
  // State chính - TÁCH pagination thành các state riêng để tránh infinite loop
  const [todos, setTodos] = useState([]); // Todos của trang hiện tại
  const [statistics, setStatistics] = useState(null); // Thống kê để đếm filter
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTodos, setTotalTodos] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    priority: '',
    status: '',
    sortBy: 'createdAt',
    limit: 10,
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importResult, setImportResult] = useState(null);

  // Notification system
  const notification = useNotification();

  // Load thống kê để đếm filter
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await todoService.getTodosStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error('❌ Error loading statistics:', err);
    }
  }, []);

  // Load dữ liệu từ service - giữ nguyên scroll position
  const loadTodos = useCallback(async (preserveScroll = false) => {
    // Lưu vị trí scroll hiện tại
    const scrollPosition = preserveScroll ? window.pageYOffset : 0;
    
    try {
      setLoading(true);
      console.log('🔄 Loading todos with params:', {
        currentPage,
        limit: filters.limit,
        priority: filters.priority,
        status: filters.status
      });

      const data = await todoService.getAllTodos(
        currentPage,
        filters.limit,
        '', // Không truyền search vào backend (Fuse xử lý ở FE)
        filters.priority,
        filters.status,
        '', // Không sử dụng dueDateFilter nữa
        filters.sortBy
      );
      
      console.log('✅ Loaded todos:', data);
      
      // Handle response safely
      if (!data) {
        console.warn('No data received from server');
        setTodos([]);
        return;
      }
      
      // Handle both old and new response formats
      const todosData = data.data || data; // New format has data wrapper
      const todosList = todosData?.todos || [];
      const paginationData = todosData?.pagination || {};
      
      setTodos(todosList);
      
      // Update pagination states safely
      setCurrentPage(paginationData.currentPage || 1);
      setTotalPages(paginationData.totalPages || 1);
      setTotalTodos(paginationData.totalTodos || 0);
      setHasNext(paginationData.hasNext || false);
      setHasPrev(paginationData.hasPrev || false);
      
      setError(null);

      // Khôi phục vị trí scroll
      if (preserveScroll) {
        setTimeout(() => {
          window.scrollTo(0, scrollPosition);
        }, 100);
      }
    } catch (err) {
      console.error('❌ Error loading todos:', err);
      setError('Không thể tải todos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.limit, filters.priority, filters.status, filters.sortBy]);

  // Load todos khi filter / page thay đổi
  useEffect(() => {
    loadTodos();
    loadStatistics(); // Load thống kê để đếm filter
  }, [loadTodos, loadStatistics]);

  // 📹 Lọc tìm kiếm bằng Fuse.js ở frontend
  const fuse = new Fuse(todos, {
    keys: ['title', 'description'], // tìm trong cả title + description
    threshold: 0.4, // fuzzy (0 = chính xác, 1 = fuzzy nhiều)
  });

  const filteredTodos = filters.search
    ? fuse.search(removeVietnameseTones(filters.search)).map((r) => r.item)
    : todos;

  // 📹 Thay đổi filter
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset về trang 1
  };

  // 📹 Thay đổi page
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleAddTodo = () => {
    setEditingTodo(null);
    setShowForm(true);
  };

  const handleEditTodo = (todo) => {
    setEditingTodo(todo);
    setShowForm(true);
  };

  const handleSubmitTodo = async (todoData) => {
    try {
      if (editingTodo) {
        // Cập nhật local state ngay lập tức
        setTodos(prevTodos => 
          prevTodos.map(todo => 
            todo.id === editingTodo.id 
              ? { ...todo, ...todoData, updatedAt: new Date().toISOString() }
              : todo
          )
        );
        
        await todoService.updateTodo(editingTodo.id, todoData);
        notification.showSuccess('Cập nhật todo thành công!');
      } else {
        const newTodo = await todoService.createTodo(todoData);
        // Thêm todo mới vào đầu danh sách
        setTodos(prevTodos => [newTodo.data, ...prevTodos]);
        notification.showSuccess('Tạo todo mới thành công!');
      }
      
      setShowForm(false);
      setEditingTodo(null);
      await loadStatistics(); // Chỉ cập nhật statistics
    } catch (err) {
      // Nếu lỗi và đang edit, revert lại state
      if (editingTodo) {
        setTodos(prevTodos => 
          prevTodos.map(todo => 
            todo.id === editingTodo.id ? editingTodo : todo
          )
        );
      }
      
      const errorMsg = editingTodo ? 'Không thể cập nhật todo' : 'Không thể tạo todo';
      notification.showError(`${errorMsg}: ${err.message}`);
      setError(errorMsg);
    }
  };

  const handleDeleteTodo = async (id) => {
    const confirmDelete = window.confirm('Bạn có chắc chắn muốn xóa todo này?');
    if (confirmDelete) {
      try {
        // Xóa khỏi local state ngay lập tức
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
        
        await todoService.deleteTodo(id);
        notification.showSuccess('Xóa todo thành công!');
        await loadStatistics(); // Chỉ cập nhật statistics
      } catch (err) {
        // Nếu lỗi, reload lại để đồng bộ
        await loadTodos(true);
        notification.showError(`Không thể xóa todo: ${err.message}`);
        setError('Không thể xóa todo');
      }
    }
  };

  const handleToggleTodo = async (id, completed) => {
    try {
      // Cập nhật local state ngay lập tức để tránh nhấp nháy
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, completed, updatedAt: new Date().toISOString() } : todo
        )
      );
      
      // Gọi API để cập nhật backend
      await todoService.updateTodo(id, { completed });
      
      const statusMsg = completed ? 'hoàn thành' : 'chưa hoàn thành';
      notification.showSuccess(`Đã đánh dấu todo ${statusMsg}!`);
      
      // Chỉ cập nhật statistics, không reload todos
      await loadStatistics();
    } catch (err) {
      // Nếu lỗi, revert lại state
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, completed: !completed } : todo
        )
      );
      notification.showError(`Không thể cập nhật trạng thái todo: ${err.message}`);
      setError('Không thể cập nhật todo');
    }
  };

  // Callback để cập nhật todo từ inline edit
  const handleInlineUpdate = async (id, updatedData) => {
    try {
      // Cập nhật local state ngay lập tức
      setTodos(prevTodos => 
        prevTodos.map(todo => 
          todo.id === id ? { ...todo, ...updatedData, updatedAt: new Date().toISOString() } : todo
        )
      );
      
      // Gọi API để cập nhật backend
      await todoService.updateTodo(id, updatedData);
      
      notification.showSuccess('Cập nhật todo thành công!');
      await loadStatistics(); // Chỉ cập nhật statistics
    } catch (err) {
      notification.showError(`Không thể cập nhật todo: ${err.message}`);
      setError('Không thể cập nhật todo');
    }
  };

  // Export tổng todos
  const handleExport = async () => {
    try {
      const data = await todoService.exportTodos();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'todos-export.json';
      a.click();
      window.URL.revokeObjectURL(url);
      notification.showSuccess('Xuất file todos thành công!');
    } catch (err) {
      notification.showError(`Không thể xuất todos: ${err.message}`);
      setError('Không thể xuất todos');
    }
  };

  /**
   * Import todos from file with detailed feedback
   * @param {File} file The JSON file to import
   */
  const handleImport = async (file) => {
    if (!file) {
      setError('Vui lòng chọn file để import');
      return;
    }

    try {
      setLoading(true);
      const result = await todoService.importTodos(file);
      
      if (result.success && result.data) {
        const { totalImported } = result.data;
        
        // Hiển thị modal kết quả import
        setImportResult(result.data);
        setShowImportModal(true);

        // Reload dữ liệu nếu có todos mới
        if (totalImported > 0) {
          await loadTodos(true); // Giữ nguyên scroll position
          await loadStatistics(); // Cập nhật số lượng filter
        }
      } else {
        throw new Error(result.message || 'Phản hồi không hợp lệ từ server');
      }
      
    } catch (err) {
      console.error('Import error:', err);
      setError(`❌ Lỗi import: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 📹 Hiển thị loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải todos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">TodoList App</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right font-bold text-red-700 hover:text-red-900"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={handleAddTodo}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Plus size={16} />
            Thêm Todo
          </button>
          <ImportExportButtons 
            onExport={handleExport} 
            onImport={handleImport}
          />
        </div>

        {/* Search */}
        <SearchBar
          searchTerm={filters.search}
          onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))}
        />

        {/* Bộ lọc khác */}
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange}
          statistics={statistics}
        />

        {showForm && (
          <TodoForm
            todo={editingTodo}
            onSubmit={handleSubmitTodo}
            onCancel={() => {
              setShowForm(false);
              setEditingTodo(null);
            }}
          />
        )}

        {/* Danh sách todos */}
        <div className="space-y-4">
          {filteredTodos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {filters.search || filters.priority || filters.status
                  ? 'Không tìm thấy todos phù hợp với bộ lọc.'
                  : 'Chưa có todos nào. Tạo todo đầu tiên!'}
              </p>
            </div>
          ) : (
            filteredTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={handleEditTodo}
                onDelete={handleDeleteTodo}
                onToggle={handleToggleTodo}
                onInlineUpdate={handleInlineUpdate}
                onUpdate={async (preserveScroll) => {
                  // Chỉ reload khi cần thiết (ví dụ: upload file, delete attachment)
                  // Không reload khi edit inline để tránh scroll lên đầu
                  if (preserveScroll !== false) {
                    await loadTodos(preserveScroll);
                    await loadStatistics();
                  }
                }}
              />
            ))
          )}
        </div>

        <Pagination 
          pagination={{
            currentPage,
            totalPages,
            totalTodos,
            limit: filters.limit,
            hasNext,
            hasPrev
          }} 
          onPageChange={handlePageChange} 
        />

        {/* Import Result Modal */}
        <ImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setImportResult(null);
          }}
          importResult={importResult}
        />

        {/* Notification Container */}
        <NotificationContainer 
          notifications={notification.notifications}
          removeNotification={notification.removeNotification}
        />
      </div>
    </div>
  );
}

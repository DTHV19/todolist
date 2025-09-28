import React, { useMemo } from 'react';
import { Calendar, Clock, ArrowUpDown } from 'lucide-react';

export default function FilterBar({ filters, onFilterChange, todos = [] }) {
  // Tính toán số lượng todos cho mỗi category
  const counts = useMemo(() => {
    console.log('🔢 Calculating counts for todos:', todos.length, 'todos');
    
    if (!todos || todos.length === 0) {
      return {
        total: 0,
        priority: { high: 0, medium: 0, low: 0 },
        status: { completed: 0, pending: 0 }
      };
    }

    const totalTodos = todos.length;
    
    // Debug: kiểm tra dữ liệu
    console.log('📊 Sample todos:', todos.slice(0, 3).map(t => ({
      id: t.id,
      title: t.title,
      priority: t.priority,
      completed: t.completed
    })));
    
    // Đếm theo priority
    const priorityCounts = {
      high: todos.filter(t => {
        const priority = (t.priority || 'medium').toLowerCase();
        return priority === 'high';
      }).length,
      medium: todos.filter(t => {
        const priority = (t.priority || 'medium').toLowerCase();
        return priority === 'medium';
      }).length,
      low: todos.filter(t => {
        const priority = (t.priority || 'medium').toLowerCase();
        return priority === 'low';
      }).length,
    };
    
    // Đếm theo status
    const statusCounts = {
      completed: todos.filter(t => t.completed === true).length,
      pending: todos.filter(t => t.completed !== true).length,
    };
    
    console.log('📈 Calculated counts:', {
      total: totalTodos,
      priority: priorityCounts,
      status: statusCounts
    });
    
    return {
      total: totalTodos,
      priority: priorityCounts,
      status: statusCounts
    };
  }, [todos]);
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Priority Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Mức độ ưu tiên
          </label>
          <select 
            value={filters.priority || ''} 
            onChange={e => onFilterChange({...filters, priority: e.target.value})} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả mức độ ({counts.total})</option>
            <option value="high">🔴 Cao ({counts.priority.high})</option>
            <option value="medium">🟡 Trung bình ({counts.priority.medium})</option>
            <option value="low">🟢 Thấp ({counts.priority.low})</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Trạng thái
          </label>
          <select 
            value={filters.status || ''} 
            onChange={e => onFilterChange({...filters, status: e.target.value})} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái ({counts.total})</option>
            <option value="completed">✅ Hoàn thành ({counts.status.completed})</option>
            <option value="pending">⏳ Chưa hoàn thành ({counts.status.pending})</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 flex items-center gap-1">
            <ArrowUpDown size={16} />
            Sắp xếp theo
          </label>
          <select 
            value={filters.sortBy || 'createdAt'} 
            onChange={e => onFilterChange({...filters, sortBy: e.target.value})} 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="title">🔤 Tên</option>
            <option value="dueDate">⏰ Thời hạn</option>
            <option value="createdAt">📝 Ngày tạo</option>
          </select>
        </div>
      </div>

      {/* Clear Filters Button */}
      {(filters.priority || filters.status || (filters.sortBy && filters.sortBy !== 'createdAt')) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={() => onFilterChange({
              ...filters,
              priority: '',
              status: '',
              sortBy: 'createdAt'
            })}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            🗑️ Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}

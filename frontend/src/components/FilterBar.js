import React from 'react';

export default function FilterBar({ filters, onFilterChange }) {
  return (
    <div className="flex gap-4 mb-4">
      <select value={filters.priority} onChange={e => onFilterChange({...filters, priority: e.target.value})} className="px-2 py-1 border rounded">
        <option value="">Tất cả ưu tiên</option>
        <option value="high">Cao</option>
        <option value="medium">Trung bình</option>
        <option value="low">Thấp</option>
      </select>
      <select value={filters.status} onChange={e => onFilterChange({...filters, status: e.target.value})} className="px-2 py-1 border rounded">
        <option value="">Tất cả trạng thái</option>
        <option value="completed">Hoàn thành</option>
        <option value="pending">Chưa hoàn thành</option>
      </select>
    </div>
  );
}

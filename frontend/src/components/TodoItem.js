import React, { useState } from 'react';

const TodoItem = ({ todo, onUpdate, onDelete, onToggle }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDescription, setEditDescription] = useState(todo.description || '');
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    try {
      setIsLoading(true);
      await onToggle(todo.id);
    } catch (error) {
      console.error('Error toggling todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc muốn xóa todo này?')) {
      try {
        setIsLoading(true);
        await onDelete(todo.id);
      } catch (error) {
        console.error('Error deleting todo:', error);
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      alert('Tiêu đề không được để trống');
      return;
    }

    try {
      setIsLoading(true);
      await onUpdate(todo.id, {
        title: editTitle.trim(),
        description: editDescription.trim()
      });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div className="todo-header">
        <div
          className={`todo-checkbox ${todo.completed ? 'completed' : ''}`}
          onClick={handleToggle}
          style={{ pointerEvents: isLoading ? 'none' : 'auto' }}
        >
          {todo.completed && '✓'}
        </div>
        
        {!isEditing ? (
          <div className="todo-title">{todo.title}</div>
        ) : null}
      </div>

      {!isEditing && todo.description && (
        <div className="todo-description">{todo.description}</div>
      )}

      {isEditing && (
        <div className="edit-form">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="Tiêu đề todo..."
            maxLength={100}
            disabled={isLoading}
          />
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="Mô tả chi tiết (tùy chọn)..."
            maxLength={500}
            disabled={isLoading}
          />
          <div className="edit-actions">
            <button 
              onClick={handleSave} 
              className="save-btn"
              disabled={isLoading || !editTitle.trim()}
            >
              {isLoading ? '⏳' : '💾'} Lưu
            </button>
            <button 
              onClick={handleCancel} 
              className="cancel-btn"
              disabled={isLoading}
            >
              ❌ Hủy
            </button>
          </div>
        </div>
      )}

      {!isEditing && (
        <div className="todo-meta">
          <div className="todo-date">
            Tạo: {formatDate(todo.createdAt)}
            {todo.updatedAt !== todo.createdAt && (
              <span> • Sửa: {formatDate(todo.updatedAt)}</span>
            )}
          </div>
          <div className="todo-actions">
            <button
              onClick={handleEdit}
              className="action-btn edit-btn"
              disabled={isLoading}
              title="Chỉnh sửa"
            >
              ✏️
            </button>
            <button
              onClick={handleDelete}
              className="action-btn delete-btn"
              disabled={isLoading}
              title="Xóa"
            >
              🗑️
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodoItem;
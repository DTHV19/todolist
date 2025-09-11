import React, { useState } from 'react';

const AddTodo = ({ onAdd }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề todo');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAdd(title.trim(), description.trim());
      setTitle('');
      setDescription('');
    } catch (error) {
      console.error('Error adding todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-todo">
      <form onSubmit={handleSubmit} className="add-todo-form">
        <input
          type="text"
          placeholder="Nhập tiêu đề todo..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isSubmitting}
          maxLength={100}
        />
        <textarea
          placeholder="Mô tả chi tiết (tùy chọn)..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isSubmitting}
          maxLength={500}
        />
        <button 
          type="submit" 
          disabled={isSubmitting || !title.trim()}
        >
          {isSubmitting ? '⏳ Đang thêm...' : '➕ Thêm Todo'}
        </button>
      </form>
    </div>
  );
};

export default AddTodo;
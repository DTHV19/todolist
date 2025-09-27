import React, { useState } from 'react';
import { Edit, Trash2, Upload, Calendar, Paperclip, Check } from 'lucide-react';

export default function TodoItem({ todo, onEdit, onDelete, onToggle }) {
 
  return (
    <div className={`todo-item border-l-4 ${
      todo.completed ? 'border-green-500 opacity-75' : 
      todo.priority === 'high' ? 'border-red-500' :
      todo.priority === 'medium' ? 'border-yellow-500' : 'border-blue-500'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => onToggle(todo.id, !todo.completed)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
              }`}
            >
              {todo.completed && <Check size={14} />}
            </button>
            <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
              {todo.title}
            </h3>
          </div>
          {todo.description && <p className={`text-gray-600 text-sm mb-2 ${todo.completed ? 'line-through' : ''}`}>{todo.description}</p>}
          {todo.dueDate && <div className="flex items-center gap-1 text-xs text-gray-500 mb-2"><Calendar size={12} />{new Date(todo.dueDate).toLocaleDateString('vi-VN')}</div>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(todo)} className="p-1 text-gray-500 hover:text-blue-600"><Edit size={16} /></button>
          <button onClick={() => onDelete(todo.id)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={16} /></button>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useRef } from 'react';
import { Edit, Trash2, Upload, Calendar, Image, Check, X, Eye, Save, History, Clock } from 'lucide-react';
import todoService from '../api/todoService';
import { Toast, useToast } from './ToastNotification';

export default function TodoItem({ todo, onEdit, onDelete, onToggle, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [editData, setEditData] = useState({
    title: todo.title,
    description: todo.description || '',
    priority: todo.priority || 'medium',
    dueDate: todo.dueDate || ''
  });
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Xử lý inline editing
  const handleEditClick = () => {
    setIsEditing(true);
    setEditData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editData.title.trim()) {
      toast.showError('Tiêu đề không được để trống');
      return;
    }

    try {
      await todoService.updateTodo(todo.id, editData);
      toast.showSuccess('Cập nhật todo thành công');
      setIsEditing(false);
      if (onUpdate) onUpdate(true); // Giữ nguyên scroll position
    } catch (error) {
      toast.showError(`Không thể cập nhật todo: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      title: todo.title,
      description: todo.description || '',
      priority: todo.priority || 'medium',
      dueDate: todo.dueDate || ''
    });
  };

  // Xử lý khi nhấn nút upload
  const handleUploadClick = () => {
    // Hiển thị thông báo yêu cầu chọn file
    const confirmUpload = window.confirm('Bạn có muốn thêm ảnh vào todo này không?');
    if (confirmUpload) {
      fileInputRef.current?.click();
    }
  };

  // Xử lý upload file ảnh
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.showError('Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Kiểm tra kích thước file (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.showError('File ảnh quá lớn! Tối đa 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setUploading(true);
    try {
      await todoService.uploadFile(todo.id, file);
      toast.showSuccess('Upload ảnh thành công!');
      // Gọi callback để reload todos
      if (onUpdate) onUpdate(true); // Giữ nguyên scroll position
    } catch (error) {
      toast.showError(`Lỗi upload: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Xử lý xóa ảnh
  const handleRemoveImage = async (attachmentId) => {
    const confirmDelete = window.confirm('Bạn có chắc muốn xóa ảnh này?');
    if (!confirmDelete) return;
    
    try {
      await todoService.removeAttachment(todo.id, attachmentId);
      toast.showSuccess('Xóa ảnh thành công!');
      if (onUpdate) onUpdate(true); // Giữ nguyên scroll position
    } catch (error) {
      toast.showError(`Lỗi xóa ảnh: ${error.message}`);
    }
  };

  // Xử lý xem ảnh phóng to
  const handleViewImage = (attachment) => {
    setSelectedImage(attachment);
  };

  // Đóng modal xem ảnh
  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Tính số lượng ảnh
  const imageCount = todo.attachments ? todo.attachments.length : 0;

  // Kiểm tra todo đã quá hạn chưa
  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;

  return (
    <div className={`relative bg-white p-4 rounded-lg shadow-sm border-l-4 mb-3 ${
      todo.completed ? 'border-green-500 opacity-75' : 
      isOverdue ? 'border-red-500' :
      todo.priority === 'high' ? 'border-red-400' :
      todo.priority === 'medium' ? 'border-yellow-400' : 'border-blue-400'
    }`}>
      {/* Toast notification tại chỗ */}
      {toast.toast && (
        <Toast
          message={toast.toast.message}
          type={toast.toast.type}
          duration={toast.toast.duration}
          onClose={toast.hideToast}
        />
      )}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {!isEditing ? (
            <>
              {/* Tiêu đề và checkbox - View mode */}
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => onToggle(todo.id, !todo.completed)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    todo.completed ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {todo.completed && <Check size={14} />}
                </button>
                <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : ''}`}>
                  {todo.title}
                </h3>
                {/* Hiển thị số lượng ảnh */}
                {imageCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                    <Image size={12} />
                    {imageCount} ảnh
                  </span>
                )}
                {/* Cảnh báo quá hạn */}
                {isOverdue && (
                  <span className="inline-flex items-center px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                    🚨 Quá hạn
                  </span>
                )}
              </div>

              {/* Mô tả */}
              {todo.description && (
                <p className={`text-gray-600 text-sm mb-2 ${todo.completed ? 'line-through' : ''}`}>
                  {todo.description}
                </p>
              )}

              {/* Thông tin chi tiết */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                {/* Ngày hết hạn */}
                {todo.dueDate && (
                  <div className={`flex items-center gap-1 ${
                    isOverdue ? 'text-red-500' : 'text-gray-500'
                  }`}>
                    <Calendar size={12} />
                    Hạn: {new Date(todo.dueDate).toLocaleDateString('vi-VN')}
                  </div>
                )}
                
                {/* Ngày tạo */}
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  Tạo: {new Date(todo.createdAt).toLocaleDateString('vi-VN')}
                </div>

                {/* Lần sửa cuối */}
                {todo.updatedAt && todo.updatedAt !== todo.createdAt && (
                  <div className="flex items-center gap-1">
                    <Edit size={12} />
                    Sửa: {new Date(todo.updatedAt).toLocaleDateString('vi-VN')}
                  </div>
                )}

                {/* Lịch sử chỉnh sửa */}
                {todo.editHistory && todo.editHistory.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                  >
                    <History size={12} />
                    {todo.editHistory.length} lần sửa
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Edit mode - Inline editing */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Edit size={18} />
                  Chỉnh sửa Todo
                </h4>
                
                <div className="space-y-4">
                  {/* Tiêu đề */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📝 Tiêu đề <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Nhập tiêu đề todo..."
                    />
                  </div>

                  {/* Mô tả */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      📄 Mô tả
                    </label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows="3"
                      placeholder="Nhập mô tả chi tiết (tùy chọn)..."
                    />
                  </div>

                  {/* Priority và Due Date */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        🎯 Mức độ ưu tiên
                      </label>
                      <select
                        value={editData.priority}
                        onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="low">🟢 Thấp</option>
                        <option value="medium">🟡 Trung bình</option>
                        <option value="high">🔴 Cao</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        📅 Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        value={editData.dueDate}
                        onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Hiển thị ảnh đã upload */}
          {todo.attachments && todo.attachments.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {todo.attachments.map((attachment) => (
                <div key={attachment.id} className="relative group">
                  <img
                    src={`http://localhost:5000${attachment.url}`}
                    alt={attachment.originalName}
                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => handleViewImage(attachment)}
                    title="Nhấn để xem ảnh phóng to"
                  />
                  {/* Nút xem ảnh phóng to */}
                  <button
                    onClick={() => handleViewImage(attachment)}
                    className="absolute top-1 left-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xem ảnh phóng to"
                  >
                    <Eye size={10} />
                  </button>
                  {/* Nút xóa ảnh */}
                  <button
                    onClick={() => handleRemoveImage(attachment.id)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa ảnh"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Các nút hành động */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <>
              {/* Nút upload ảnh */}
              <button
                onClick={handleUploadClick}
                disabled={uploading}
                className={`p-2 rounded hover:bg-gray-100 transition-colors ${
                  uploading ? 'text-gray-400' : 'text-gray-500 hover:text-green-600'
                }`}
                title="Thêm ảnh"
              >
                {uploading ? (
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                ) : (
                  <Upload size={16} />
                )}
              </button>
              
              {/* Input file ẩn */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Nút sửa */}
              <button 
                onClick={handleEditClick}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
                title="Sửa"
              >
                <Edit size={16} />
              </button>

              {/* Nút xóa */}
              <button 
                onClick={() => onDelete(todo.id)} 
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                title="Xóa"
              >
                <Trash2 size={16} />
              </button>
            </>
          ) : (
            <>
              {/* Nút lưu */}
              <button 
                onClick={handleSaveEdit}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded transition-colors"
                title="Lưu"
              >
                <Save size={16} />
              </button>

              {/* Nút hủy */}
              <button 
                onClick={handleCancelEdit}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded transition-colors"
                title="Hủy"
              >
                <X size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Lịch sử chỉnh sửa */}
      {showHistory && todo.editHistory && todo.editHistory.length > 0 && (
        <div className="mt-3 p-3 bg-gray-50 rounded-lg border-t">
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <History size={14} />
            Lịch sử chỉnh sửa ({todo.editHistory.length} lần)
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {todo.editHistory.slice().reverse().map((history, index) => (
              <div key={index} className="text-xs bg-white p-2 rounded border">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-600">
                    Lần {todo.editHistory.length - index}
                  </span>
                  <span className="text-gray-500">
                    {new Date(history.editedAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div className="space-y-1">
                  {Object.entries(history.changes).map(([key, value]) => {
                    const oldValue = history.previousValues[key];
                    if (oldValue !== value) {
                      return (
                        <div key={key} className="text-gray-600">
                          <span className="font-medium capitalize">{key}:</span>
                          <span className="text-red-500 line-through ml-1">{oldValue || '(trống)'}</span>
                          <span className="text-green-600 ml-1">→ {value || '(trống)'}</span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal xem ảnh phóng to */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeImageModal}
        >
          <div className="relative max-w-4xl max-h-full">
            {/* Nút đóng */}
            <button
              onClick={closeImageModal}
              className="absolute -top-4 -right-4 w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
              title="Đóng"
            >
              <X size={20} />
            </button>
            
            {/* Ảnh phóng to */}
            <img
              src={`http://localhost:5000${selectedImage.url}`}
              alt={selectedImage.originalName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Thông tin ảnh */}
            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-3 rounded-b-lg">
              <p className="text-sm font-medium">{selectedImage.originalName}</p>
              <p className="text-xs text-gray-300">
                Tải lên: {new Date(selectedImage.uploadedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

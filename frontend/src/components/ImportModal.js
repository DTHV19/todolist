import React from 'react';
import { X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

/**
 * Modal hiển thị kết quả import todos
 * @param {Object} props Component props
 * @param {boolean} props.isOpen Trạng thái mở modal
 * @param {Function} props.onClose Hàm đóng modal
 * @param {Object} props.importResult Kết quả import
 */
export default function ImportModal({ isOpen, onClose, importResult }) {
  if (!isOpen || !importResult) return null;

  const { totalImported, totalDuplicated, totalProcessed, duplicatedTodos = [], newTodos = [] } = importResult;

  const getStatusIcon = () => {
    if (totalImported > 0) {
      return <CheckCircle className="text-green-500" size={24} />;
    } else if (totalDuplicated > 0) {
      return <AlertCircle className="text-yellow-500" size={24} />;
    } else {
      return <AlertCircle className="text-red-500" size={24} />;
    }
  };

  const getStatusTitle = () => {
    if (totalImported > 0) {
      return 'Import thành công!';
    } else if (totalDuplicated > 0) {
      return 'Không có todos mới!';
    } else {
      return 'Không có todos hợp lệ!';
    }
  };

  const getStatusColor = () => {
    if (totalImported > 0) {
      return 'text-green-600';
    } else if (totalDuplicated > 0) {
      return 'text-yellow-600';
    } else {
      return 'text-red-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            {getStatusIcon()}
            <h2 className={`text-xl font-semibold ${getStatusColor()}`}>
              {getStatusTitle()}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Thống kê tổng quan */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <FileText className="mx-auto text-blue-500 mb-2" size={24} />
              <div className="text-2xl font-bold text-blue-600">{totalProcessed}</div>
              <div className="text-sm text-blue-600">Tổng todos trong file</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckCircle className="mx-auto text-green-500 mb-2" size={24} />
              <div className="text-2xl font-bold text-green-600">{totalImported}</div>
              <div className="text-sm text-green-600">Todos mới được thêm</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg text-center">
              <AlertCircle className="mx-auto text-yellow-500 mb-2" size={24} />
              <div className="text-2xl font-bold text-yellow-600">{totalDuplicated}</div>
              <div className="text-sm text-yellow-600">Todos trùng lặp</div>
            </div>
          </div>

          {/* Danh sách todos mới */}
          {totalImported > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Todos mới được thêm ({totalImported})
              </h3>
              <div className="bg-green-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {newTodos.slice(0, 10).map((todo, index) => (
                  <div key={index} className="flex items-start gap-2 py-1">
                    <span className="text-green-600 font-medium">{index + 1}.</span>
                    <div>
                      <div className="font-medium text-green-800">{todo.title}</div>
                      {todo.description && (
                        <div className="text-sm text-green-600">{todo.description}</div>
                      )}
                      <div className="text-xs text-green-500">
                        Priority: {todo.priority}
                      </div>
                    </div>
                  </div>
                ))}
                {newTodos.length > 10 && (
                  <div className="text-center text-green-600 font-medium mt-2">
                    ... và {newTodos.length - 10} todos khác
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Danh sách todos trùng lặp */}
          {totalDuplicated > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                <AlertCircle size={20} />
                Todos trùng lặp đã bỏ qua ({totalDuplicated})
              </h3>
              <div className="bg-yellow-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                {duplicatedTodos.slice(0, 10).map((todo, index) => (
                  <div key={index} className="flex items-start gap-2 py-1">
                    <span className="text-yellow-600 font-medium">{index + 1}.</span>
                    <div>
                      <div className="font-medium text-yellow-800">{todo.title}</div>
                      {todo.description && (
                        <div className="text-sm text-yellow-600">{todo.description}</div>
                      )}
                      <div className="text-xs text-yellow-500">
                        Priority: {todo.priority}
                      </div>
                    </div>
                  </div>
                ))}
                {duplicatedTodos.length > 10 && (
                  <div className="text-center text-yellow-600 font-medium mt-2">
                    ... và {duplicatedTodos.length - 10} todos khác
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Thông báo khi không có todos hợp lệ */}
          {totalImported === 0 && totalDuplicated === 0 && (
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <AlertCircle className="mx-auto text-red-500 mb-2" size={32} />
              <div className="text-red-800 font-medium">
                File không chứa todos hợp lệ nào để import
              </div>
              <div className="text-red-600 text-sm mt-1">
                Vui lòng kiểm tra định dạng file và thử lại
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

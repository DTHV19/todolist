import React from 'react';

export default function Pagination({ pagination, onPageChange }) {
  if (!pagination.totalPages || pagination.totalPages <= 1) return null;

  const { currentPage, totalPages, totalTodos, limit = 10 } = pagination;

  // Helper render page numbers với ellipsis
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (currentPage >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  // Số todos hiển thị đến trang hiện tại
  const todosSoFar = Math.min(currentPage * limit, totalTodos);

  return (
    <div className="flex flex-col items-center mt-4 gap-2">
      <div className="flex justify-center gap-2">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded"
        >
          Trước
        </button>

        {getPages().map((page, idx) =>
          page === '...' ? (
            <span key={idx} className="px-3 py-1">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 border rounded ${page === currentPage ? 'bg-blue-500 text-white' : ''}`}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded"
        >
          Sau
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Tổng {todosSoFar}/{totalTodos}
      </div>
    </div>
  );
}

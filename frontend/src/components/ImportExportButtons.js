export default function ImportExportButtons({ onExport, onImport }) {
  const handleImport = e => {
    const file = e.target.files[0];
    if (file) onImport(file);
  };

  return (
    <div className="flex gap-2 mb-4">
      {/* Nút Xuất file màu xanh nước biển */}
      <button
        onClick={onExport}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      >
        Xuất file
      </button>

      {/* Nút Nhập file giữ màu vàng */}
      <label className="px-4 py-2 bg-yellow-500 text-white rounded cursor-pointer hover:bg-yellow-600 transition-colors">
        Nhập file
        <input type="file" onChange={handleImport} className="hidden" />
      </label>
    </div>
  );
}

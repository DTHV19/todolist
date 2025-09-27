import React from "react";

export default function SearchBar({ searchTerm, onSearch }) {
  return (
    <input
      type="text"
      placeholder="Search..."
      value={searchTerm}
      onChange={(e) => onSearch(e.target.value)}
      className="w-full mb-4 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
    />
  );
}

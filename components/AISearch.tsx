
import React, { useState } from 'react';

interface AISearchProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const AISearch: React.FC<AISearchProps> = ({ onSearch, isSearching }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-xl no-print">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ใช้ AI ค้นหา (เช่น 'ห้องว่าง ราคาไม่เกิน 20,000' หรือ 'ห้องที่มีคนเช่าอยู่')"
        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
      />
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        {isSearching ? (
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <span className="text-xl">🔍</span>
        )}
      </div>
      <button 
        type="submit"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-amber-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-amber-600 transition-colors"
      >
        ถาม AI
      </button>
    </form>
  );
};

export default AISearch;

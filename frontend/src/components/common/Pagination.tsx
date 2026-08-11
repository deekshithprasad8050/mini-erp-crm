import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisible = 5;
  
  let visiblePages = pages;
  if (totalPages > maxVisible) {
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    visiblePages = pages.slice(Math.max(0, start - 1), end);
  }

  return (
    <div className="pagination">
      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(page - 1)} 
        disabled={page === 1}
      >
        Previous
      </button>
      
      {visiblePages.map(p => (
        <button
          key={p}
          className={`pagination-btn ${p === page ? 'active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p}
        </button>
      ))}

      <button 
        className="pagination-btn" 
        onClick={() => onPageChange(page + 1)} 
        disabled={page === totalPages}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;

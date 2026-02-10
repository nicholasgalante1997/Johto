import React, { useMemo } from 'react';
import type { PaginationProps } from './types';
import './Pagination.css';

/**
 * Generate array of page numbers to display
 */
function generatePageNumbers(
  currentPage: number,
  totalPages: number,
  siblingCount: number
): (number | 'ellipsis')[] {
  // Always show first page, last page, current page, and siblings
  const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
  const totalButtons = totalNumbers + 2; // + 2 for possible ellipses

  // If total pages is less than total buttons, show all pages
  if (totalPages <= totalButtons) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftEllipsis = leftSiblingIndex > 2;
  const shouldShowRightEllipsis = rightSiblingIndex < totalPages - 1;

  if (!shouldShowLeftEllipsis && shouldShowRightEllipsis) {
    // Show more pages at the start
    const leftItemCount = 3 + 2 * siblingCount;
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, 'ellipsis', totalPages];
  }

  if (shouldShowLeftEllipsis && !shouldShowRightEllipsis) {
    // Show more pages at the end
    const rightItemCount = 3 + 2 * siblingCount;
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, 'ellipsis', ...rightRange];
  }

  // Show ellipsis on both sides
  const middleRange = Array.from(
    { length: rightSiblingIndex - leftSiblingIndex + 1 },
    (_, i) => leftSiblingIndex + i
  );
  return [1, 'ellipsis', ...middleRange, 'ellipsis', totalPages];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = true,
  showPrevNext = true,
  className = '',
  disabled = false
}: PaginationProps) {
  const pageNumbers = useMemo(
    () => generatePageNumbers(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  if (totalPages <= 1) {
    return null;
  }

  const handlePageClick = (page: number) => {
    if (!disabled && page !== currentPage && page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const classNames = ['pagination', className].filter(Boolean).join(' ');

  return (
    <nav className={classNames} aria-label="Pagination">
      <ul className="pagination__list">
        {/* First page button */}
        {showFirstLast && (
          <li>
            <button
              type="button"
              className="pagination__button pagination__button--icon"
              onClick={() => handlePageClick(1)}
              disabled={disabled || currentPage === 1}
              aria-label="Go to first page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>
          </li>
        )}

        {/* Previous page button */}
        {showPrevNext && (
          <li>
            <button
              type="button"
              className="pagination__button pagination__button--icon"
              onClick={() => handlePageClick(currentPage - 1)}
              disabled={disabled || currentPage === 1}
              aria-label="Go to previous page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </li>
        )}

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <li key={`ellipsis-${index}`}>
              <span className="pagination__ellipsis">...</span>
            </li>
          ) : (
            <li key={page}>
              <button
                type="button"
                className={`pagination__button ${
                  page === currentPage ? 'pagination__button--active' : ''
                }`}
                onClick={() => handlePageClick(page)}
                disabled={disabled}
                aria-label={`Go to page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}
              >
                {page}
              </button>
            </li>
          )
        )}

        {/* Next page button */}
        {showPrevNext && (
          <li>
            <button
              type="button"
              className="pagination__button pagination__button--icon"
              onClick={() => handlePageClick(currentPage + 1)}
              disabled={disabled || currentPage === totalPages}
              aria-label="Go to next page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </li>
        )}

        {/* Last page button */}
        {showFirstLast && (
          <li>
            <button
              type="button"
              className="pagination__button pagination__button--icon"
              onClick={() => handlePageClick(totalPages)}
              disabled={disabled || currentPage === totalPages}
              aria-label="Go to last page"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </li>
        )}
      </ul>
    </nav>
  );
}

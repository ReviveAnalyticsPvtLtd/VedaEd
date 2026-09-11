export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center text-sm text-gray-500 mt-3">
      <p>
        Page {currentPage} of {totalPages}
      </p>

      <div className="flex gap-2 justify-end">
        <button
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <button
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
import React from "react";

interface HeaderProps {
  handlers: Record<string, any>;
  onClose: () => void;
}

export default function Header({ handlers, onClose }: HeaderProps) {
  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm z-10">
      <button
        type="button"
        className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1 bg-gray-300 rounded-full sm:hidden cursor-grab active:cursor-grabbing"
        {...handlers}
        onClick={onClose}
        aria-label="Плъзни, за да затвориш, или натисни, за да затвориш"
      />

      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 pt-3 sm:pt-0">
        Детайли за сигнала
      </h2>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-full mt-3 sm:mt-0"
        aria-label="Затвори детайлите"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>
  );
}

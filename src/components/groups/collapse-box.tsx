"use client";
import React, { useState, ReactNode } from "react";

interface CollapsibleProps {
  open?: boolean;
  title: string;
  children: ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({
  open = false,
  children,
  title,
}) => {
  const [isOpen, setIsOpen] = useState(open);

  const handleFilterOpening = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="rounded-2xl bg-gray-800 border-2 border-gray-700 shadow-lg overflow-hidden transition-all hover:shadow-xl">
      <button
        type="button"
        className="w-full flex items-center justify-between p-5 hover:bg-gray-700 transition-colors"
        onClick={handleFilterOpening}
        aria-label={isOpen ? "Collapse" : "Expand"}
      >
        <h6 className="text-lg font-bold text-white">{title}</h6>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-400">
            {isOpen ? "Collapse" : "Expand"}
          </span>
          <div className="h-8 w-8 rounded-lg bg-gray-700 flex items-center justify-center">
            {isOpen ? (
              <svg
                className="h-5 w-5 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-gray-700 bg-gray-800/50">
          <div className="p-5">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Collapsible;

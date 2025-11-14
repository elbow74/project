"use client";
import React, { useState, ReactNode } from "react";

interface CollapsibleProps {
  open?: boolean;
  title: string;
  children: ReactNode;
}

const Collapsible: React.FC<CollapsibleProps> = ({ open = false, children, title }) => {
  const [isOpen, setIsOpen] = useState(open);

  const handleFilterOpening = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between border-b p-3">
        <h6 className="font-semibold">{title}</h6>
        <button
          type="button"
          className="rounded px-2 py-1 hover:bg-accent"
          onClick={handleFilterOpening}
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          {isOpen ? (
            <span className="text-muted-foreground">▲</span>
          ) : (
            <span className="text-muted-foreground">▼</span>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="border-b">
          <div className="p-3">{children}</div>
        </div>
      )}
    </div>
  );
};

export default Collapsible;

import React from "react";

export default function ContentLayout({ children, className = "" }) {
  return (
    <div className={`p-4 md:p-6 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}


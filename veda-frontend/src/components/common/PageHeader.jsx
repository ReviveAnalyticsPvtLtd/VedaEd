import React from "react";

export default function PageHeader({ title, subtitle, actions = null, children = null }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-6 border-b border-gray-200 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}


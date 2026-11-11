import React from "react";

export default function Tabs({ tabs = [], activeTab, onTabChange }) {
  return (
    <div className="flex border-b border-gray-200 space-x-6 overflow-x-auto">
      {tabs.map((tab) => {
        const key = typeof tab === "string" ? tab : tab.key || tab.id;
        const label = typeof tab === "string" ? tab : tab.label || tab.name;
        const isActive = activeTab === key;

        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className={`py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
              isActive
                ? "border-blue-600 text-blue-600 font-semibold"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}


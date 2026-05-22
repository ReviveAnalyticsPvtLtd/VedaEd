import React from "react";

const SmartCheckCard = ({ messages = [] }) => {
  if (!messages.length) return null;

  return (
    <div className="space-y-3">
      {messages.map((text) => (
        <div
          key={text}
          className="rounded-xl border border-amber-200 bg-amber-50 p-4"
        >
          <p className="text-sm font-semibold text-amber-800">Smart Check</p>
          <p className="mt-1 text-sm leading-relaxed text-amber-900/90">{text}</p>
        </div>
      ))}
    </div>
  );
};

export default SmartCheckCard;

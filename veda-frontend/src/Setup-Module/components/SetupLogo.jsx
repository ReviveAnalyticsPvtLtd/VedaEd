import React from "react";

const SetupLogo = ({ size = "md" }) => {
  const sizeClasses =
    size === "lg"
      ? "h-14 w-14 text-2xl"
      : "h-10 w-10 text-lg";

  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-setup-primary to-blue-700 font-bold text-white shadow-lg`}
      >
        V
      </div>
      <div>
        <p className="text-lg font-bold text-gray-900 sm:text-xl">VedaSchool</p>
        <p className="text-xs text-gray-500 sm:text-sm">School Management Platform</p>
      </div>
    </div>
  );
};

export default SetupLogo;

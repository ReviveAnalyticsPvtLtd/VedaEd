import React from "react";

const SetupRecommendationBox = () => {
  return (
    <div className="mt-6 flex flex-col gap-3 rounded-xl border border-setup-border bg-gray-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <p className="text-sm font-semibold text-setup-heading">Recommendation</p>
        <p className="mt-1 text-sm leading-relaxed text-setup-muted">
          Select the structure closest to your real operating model. You can add
          campuses or branches later from Setup Center.
        </p>
      </div>
      <span className="w-fit shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        Editable Later
      </span>
    </div>
  );
};

export default SetupRecommendationBox;

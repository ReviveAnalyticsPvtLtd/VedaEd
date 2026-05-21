import React from "react";
import { FiCheck } from "react-icons/fi";

const AcademicRecommendationCard = ({ recommendation }) => {
  const { title, confidence, reason, features = [] } = recommendation;

  return (
    <div className="overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg">
      <h3 className="text-base font-bold">{title}</h3>
      {reason ? (
        <p className="mt-2 text-sm leading-relaxed text-blue-100">{reason}</p>
      ) : null}
      {confidence != null ? (
        <span className="mt-3 inline-flex rounded-full bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-50">
          Confidence: {confidence}%
        </span>
      ) : null}
      <ul className="mt-4 space-y-2">
        {features.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm"
          >
            <FiCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AcademicRecommendationCard;

import React, { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";

const AcademicRecommendationCard = ({ recommendation, syncing }) => {
  const {
    title,
    confidence,
    reason,
    features = [],
    recommendationType,
    config = {},
  } = recommendation || {};

  const [animateKey, setAnimateKey] = useState(0);

  useEffect(() => {
    setAnimateKey((k) => k + 1);
  }, [recommendationType, title, confidence, features?.join("|")]);

  const configItems = [
    config.examStructure,
    config.subjectFramework,
    config.gradeSystem,
    config.streamConfiguration,
    config.attendanceSetup,
  ].filter(Boolean);

  return (
    <div
      key={animateKey}
      className={`overflow-hidden rounded-xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg transition-all duration-500 animate-in fade-in slide-in-from-top-2 ${
        syncing ? "ring-2 ring-blue-300/60 ring-offset-2 ring-offset-transparent" : ""
      }`}
      style={{
        animation: "setupRecommendationIn 0.45s ease-out",
      }}
    >
      <style>{`
        @keyframes setupRecommendationIn {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold leading-snug">{title}</h3>
        {syncing ? (
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-blue-200">
            Updating…
          </span>
        ) : null}
      </div>

      {reason ? (
        <p className="mt-2 text-sm leading-relaxed text-blue-100">{reason}</p>
      ) : null}

      {confidence != null ? (
        <span className="mt-3 inline-flex rounded-full bg-blue-900/50 px-3 py-1 text-xs font-semibold text-blue-50 transition-all duration-300">
          Confidence: {confidence}%
        </span>
      ) : null}

      <ul className="mt-4 space-y-2">
        {features.map((item) => (
          <li
            key={item}
            className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm transition-colors duration-300"
          >
            <FiCheck className="h-4 w-4 shrink-0 text-emerald-300" aria-hidden />
            {item}
          </li>
        ))}
      </ul>

      {configItems.length > 0 ? (
        <div className="mt-4 border-t border-white/20 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">
            Setup preview
          </p>
          <ul className="mt-2 space-y-1 text-xs text-blue-50/90">
            {configItems.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default AcademicRecommendationCard;

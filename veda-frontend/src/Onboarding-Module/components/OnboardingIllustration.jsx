import React from "react";

const DEFAULT_TITLE = "Create your school account";
const DEFAULT_DESCRIPTION = "Start quickly with Google or continue with email.";

export default function OnboardingIllustration({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-10 text-center lg:px-10 lg:py-16">
      <div
        className="relative mb-10 flex h-52 w-52 items-center justify-center rounded-full bg-white/60 shadow-sm sm:h-60 sm:w-60"
        aria-hidden
      >
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(rgba(37,99,235,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.08) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <svg viewBox="0 0 200 200" className="relative h-40 w-40 sm:h-44 sm:w-44" fill="none">
          <path
            d="M55 145 L100 70 L145 145 Z"
            fill="#2563eb"
            stroke="#1e40af"
            strokeWidth="2"
          />
          <rect
            x="78"
            y="115"
            width="44"
            height="50"
            rx="2"
            fill="#fff"
            stroke="#1e40af"
            strokeWidth="2"
          />
          <rect x="90" y="128" width="10" height="14" rx="1" fill="#2563eb" />
          <rect x="108" y="128" width="10" height="14" rx="1" fill="#93c5fd" />
          <rect x="94" y="148" width="12" height="17" rx="1" fill="#2563eb" />
          <circle cx="72" cy="155" r="10" fill="#1e3a5f" />
          <rect x="60" y="164" width="24" height="28" rx="6" fill="#93c5fd" />
          <circle cx="128" cy="155" r="10" fill="#1e3a5f" />
          <rect x="116" y="164" width="24" height="28" rx="6" fill="#bfdbfe" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}

import React from "react";
import { evaluatePasswordRequirements } from "../utils/passwordValidation";

function CheckIcon({ met }) {
  if (met) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="h-4 w-4 shrink-0 text-emerald-600"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    );
  }

  return (
    <span
      className="mt-0.5 h-4 w-4 shrink-0 rounded-full border border-slate-300"
      aria-hidden
    />
  );
}

export default function PasswordStrengthChecklist({ password }) {
  const rules = evaluatePasswordRequirements(password);

  return (
    <ul className="mt-3 space-y-1.5" aria-live="polite" aria-relevant="additions text">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`flex items-start gap-2 text-xs ${
            rule.met ? "text-emerald-700" : "text-slate-400"
          }`}
        >
          <CheckIcon met={rule.met} />
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}

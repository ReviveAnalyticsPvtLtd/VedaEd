import React from "react";

const StatusRow = ({ label, complete }) => (
  <li className="flex items-center justify-between gap-2 text-sm">
    <span className="text-setup-heading">{label}</span>
    {complete ? (
      <span className="flex items-center gap-1 font-semibold text-setup-success">
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Done
      </span>
    ) : (
      <span className="font-semibold text-amber-600">Pending</span>
    )}
  </li>
);

const ProfileHealthCard = ({
  items,
  title = "Profile Health",
  subtitle = "Required items for this step",
}) => {
  return (
    <div className="rounded-xl border border-setup-border bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-setup-heading">{title}</h3>
      <p className="mt-1 text-xs text-setup-muted">{subtitle}</p>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <StatusRow key={item.id} label={item.label} complete={item.complete} />
        ))}
      </ul>
    </div>
  );
};

export default ProfileHealthCard;

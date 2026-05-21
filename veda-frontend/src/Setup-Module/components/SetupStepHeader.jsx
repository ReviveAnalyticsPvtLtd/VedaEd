import React from "react";

const SetupStepHeader = ({ badge, title, description }) => {
  return (
    <div>
      {badge ? (
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-setup-primary">
          {badge}
        </span>
      ) : null}
      <h2 className="mt-4 text-2xl font-bold leading-tight text-setup-heading sm:text-[1.75rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-setup-muted sm:text-[15px]">
          {description}
        </p>
      ) : null}
    </div>
  );
};

export default SetupStepHeader;

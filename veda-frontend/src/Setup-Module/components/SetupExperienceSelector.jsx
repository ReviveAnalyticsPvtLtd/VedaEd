import React from "react";
import SetupExperienceCard from "./SetupExperienceCard";
import { SETUP_EXPERIENCE_OPTIONS } from "../constants/setupWizard";

const SetupExperienceSelector = ({ value, onChange, progress }) => {
  return (
    <div className="flex flex-col p-8 sm:p-10 lg:min-h-full">
      <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-setup-primary">
        Setup Progress: {progress}%
      </span>
      <h2 className="mt-4 text-2xl font-bold leading-tight text-setup-heading sm:text-[1.75rem]">
        Choose your setup experience
      </h2>
      <p className="mt-2 text-sm text-setup-muted sm:text-[15px]">
        Select how you would like to configure your school.
      </p>
      <div className="mt-6 flex flex-col gap-4">
        {SETUP_EXPERIENCE_OPTIONS.map((option) => (
          <SetupExperienceCard
            key={option.id}
            title={option.title}
            description={option.description}
            recommended={option.recommended}
            selected={value === option.id}
            onSelect={() => onChange(option.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default SetupExperienceSelector;

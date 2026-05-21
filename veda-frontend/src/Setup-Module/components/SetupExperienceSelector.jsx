import React from "react";
import SetupExperienceCard from "./SetupExperienceCard";
import { SETUP_EXPERIENCE_OPTIONS } from "../constants/setupWizard";

const SetupExperienceSelector = ({ value, onChange, progress }) => {
  return (
    <div className="flex flex-col p-6 sm:p-8">
      <p className="text-sm font-medium text-blue-600">
        Setup Progress: {progress}%
      </p>
      <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl">
        Choose your setup experience
      </h2>
      <p className="mt-2 text-sm text-gray-500 sm:text-base">
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

import React from "react";
import SetupStepHeader from "./SetupStepHeader";
import OrganizationTypeCard from "./OrganizationTypeCard";
import SetupRecommendationBox from "./SetupRecommendationBox";
import { ORGANIZATION_TYPE_OPTIONS } from "../constants/setupWizard";

const OrganizationTypeSelector = ({ value, onChange }) => {
  return (
    <div className="p-8 sm:p-10">
      <SetupStepHeader
        title="What type of organization are you setting up?"
        description="This helps VedaSchool decide whether your configuration should be simple, campus-based, or governed centrally by a school group."
      />
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {ORGANIZATION_TYPE_OPTIONS.map((option) => (
          <OrganizationTypeCard
            key={option.id}
            title={option.title}
            description={option.description}
            icon={option.icon}
            features={option.features}
            selected={value === option.id}
            onSelect={() => onChange(option.id)}
          />
        ))}
      </div>
      <SetupRecommendationBox />
    </div>
  );
};

export default OrganizationTypeSelector;

import React from "react";
import AcademicRecommendationCard from "./AcademicRecommendationCard";
import ProfileHealthCard from "./ProfileHealthCard";
import SmartCheckCard from "./SmartCheckCard";

const SchoolTypeCurriculumSidebar = ({
  recommendation,
  recommendationSyncing,
  healthItems,
  smartCheckMessages,
}) => {
  return (
    <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
      <AcademicRecommendationCard
        recommendation={recommendation}
        syncing={recommendationSyncing}
      />
      <ProfileHealthCard
        items={healthItems}
        title="Step Health"
        subtitle="Required decisions for this screen."
      />
      <SmartCheckCard messages={smartCheckMessages} />
    </aside>
  );
};

export default SchoolTypeCurriculumSidebar;

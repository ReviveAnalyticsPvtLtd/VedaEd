const humanize = (key) => {
  if (key === null || key === undefined || key === "") return "";
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const formatValue = (value) => {
  if (value === true) return "Enabled";
  if (value === false) return "Disabled";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
};

const countSummary = (obj) => {
  const total = Object.keys(obj || {}).length;
  if (!total) return "";
  const enabled = Object.values(obj || {}).filter(Boolean).length;
  return `${enabled} of ${total} enabled`;
};

const listSummary = (items, singular = "item") => {
  const total = (items || []).length;
  if (!total) return "";
  return `${total} ${total === 1 ? singular : `${singular}s`}`;
};

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-base font-semibold text-indigo-900">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Facts({ items }) {
  const visible = items.filter(
    ([, value]) => value !== undefined && value !== null && value !== ""
  );
  if (!visible.length) {
    return (
      <p className="text-sm text-gray-500">
        Not configured during onboarding.
      </p>
    );
  }
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      {visible.map(([label, value]) => (
        <div key={label}>
          <dt className="text-xs font-medium text-gray-500">{label}</dt>
          <dd className="mt-0.5 text-sm text-gray-900 break-words">
            {formatValue(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export default function OtherSettingsPanel({ form }) {
  const exam = form.step9ExaminationGradebook || {};
  const feeCategories = form.feeCategories || [];
  const discounts = form.discounts || {};
  const feeReminders = form.feeReminders || {};
  const communicationChannels = form.communicationChannels || {};
  const notificationTriggers = form.notificationTriggers || {};
  const announcementPermissions = form.announcementPermissions || {};
  const documentTemplates = form.documentTemplates || {};

  return (
    <div className="space-y-2">
      <Section title="Examination & Gradebook">
        <Facts
          items={[
            ["Assessment Model", exam.assessmentModel],
            ["Result Display Format", exam.resultDisplayFormat],
            ["Default Passing Marks", exam.defaultPassingMarks],
            ["GPA Scale Type", exam.gpaScaleType],
            ["Grade Scale Scope", exam.gradeScaleScope],
            ["Report Card Format", exam.reportCardFormat],
            ["Result Publishing Mode", exam.resultPublishingMode],
            ["Publishing State", humanize(exam.publishingState)],
            ["Grade Scale", listSummary(exam.gradeTable, "grade")],
            ["Assessment Weightage", listSummary(exam.assessmentWeightage, "item")],
          ]}
        />
      </Section>

      <Section title="Fees">
        <Facts
          items={[
            ["Fees Module", form.feesModuleEnabled],
            ["Collection Frequency", humanize(form.feeCollectionFrequency)],
            ["Late Fee Type", humanize(form.lateFeeType)],
            ["Late Fee Value", form.lateFeeValue],
            ["Grace Days", form.graceDays],
            ["Partial Payment", humanize(form.partialPayment)],
            ["Refund Policy", humanize(form.refundPolicy)],
            ["Payment Modes", humanize(form.paymentModes)],
            ["Fee Categories", listSummary(feeCategories, "category")],
            ["Discounts", countSummary(discounts)],
            ["Fee Reminders", countSummary(feeReminders)],
          ]}
        />
      </Section>

      <Section title="Communication">
        <Facts
          items={[
            ["Channels", countSummary(communicationChannels)],
            ["Notification Triggers", countSummary(notificationTriggers)],
            ["Announcement Permissions", countSummary(announcementPermissions)],
            ["Document Templates", listSummary(Object.keys(documentTemplates), "template")],
          ]}
        />
      </Section>
    </div>
  );
}

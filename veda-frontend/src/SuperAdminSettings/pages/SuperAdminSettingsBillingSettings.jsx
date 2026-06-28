export default function SuperAdminSettingsBillingSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Billing Settings</h1>

      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" />
          Auto Renewal
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" />
          Email Invoices
        </label>
      </div>
    </div>
  );
}
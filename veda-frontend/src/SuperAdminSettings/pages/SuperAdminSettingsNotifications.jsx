export default function SuperAdminSettingsNotifications() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Notifications</h1>

      <div className="space-y-4">
        <label className="flex items-center gap-3">
          <input type="checkbox" />
          Email Notifications
        </label>

        <label className="flex items-center gap-3">
          <input type="checkbox" />
          SMS Notifications
        </label>
      </div>
    </div>
  );
}
export default function ParentProfileSettingsNotifications() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      <div className="space-y-3">
        <p>✔ Email Notifications Enabled</p>
        <p>✔ SMS Notifications Enabled</p>
        <p>✔ App Notifications Enabled</p>
      </div>
    </div>
  );
}
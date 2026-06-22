export default function ParentProfileSettingsSecurity() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Security</h1>

      <div className="space-y-3">
        <p>Last Password Change: 10 Days Ago</p>
        <p>Two Factor Authentication: Disabled</p>
        <p>Last Login: Today</p>
      </div>
    </div>
  );
}
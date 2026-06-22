export default function ParentProfileSettingsPreferences() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Preferences</h1>

      <ul className="list-disc ml-5 space-y-2">
        <li>Language: English</li>
        <li>Theme: Light Mode</li>
        <li>Timezone: Asia/Kolkata</li>
      </ul>
    </div>
  );
}
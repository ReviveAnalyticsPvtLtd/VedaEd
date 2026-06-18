export default function SuperAdminSettingsSecurity() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Security</h1>

      <div className="space-y-4">
        <input
          type="password"
          placeholder="Current Password"
          className="border rounded-lg px-4 py-2 w-full"
        />

        <input
          type="password"
          placeholder="New Password"
          className="border rounded-lg px-4 py-2 w-full"
        />

        <button className="bg-blue-600 text-white px-5 py-2 rounded-lg">
          Update Password
        </button>
      </div>
    </div>
  );
}
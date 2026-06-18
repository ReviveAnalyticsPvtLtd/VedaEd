export default function SuperAdminSettingsAccount() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Account Settings</h1>

      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          placeholder="Full Name"
          className="border rounded-lg px-4 py-2"
        />

        <input
          type="email"
          placeholder="Email Address"
          className="border rounded-lg px-4 py-2"
        />
      </div>

      <button className="mt-6 bg-blue-600 text-white px-5 py-2 rounded-lg">
        Save Changes
      </button>
    </div>
  );
}
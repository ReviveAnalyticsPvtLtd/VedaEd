export default function SuperAdminSettingsBillingDetails() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Billing Details</h1>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="Company Name"
          className="border rounded-lg px-4 py-2 w-full"
        />

        <input
          type="text"
          placeholder="GST Number"
          className="border rounded-lg px-4 py-2 w-full"
        />
      </div>
    </div>
  );
}
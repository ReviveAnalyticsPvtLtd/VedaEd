export default function AdminContactSupport() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Contact Support</h1>

      <textarea
        rows="6"
        className="w-full border rounded-lg p-3"
        placeholder="Write your issue..."
      />

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg">
        Send
      </button>
    </div>
  );
}
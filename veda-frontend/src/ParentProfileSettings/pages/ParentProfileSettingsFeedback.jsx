export default function ParentProfileSettingsFeedback() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold mb-4">Feedback</h1>

      <textarea
        rows={5}
        placeholder="Write your feedback here..."
        className="w-full border rounded-lg p-3"
      />

      <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
        Submit Feedback
      </button>
    </div>
  );
}
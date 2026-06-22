export default function AdminFeedback() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-semibold mb-4">Feedback</h1>

      <textarea
        rows="6"
        className="w-full border rounded-lg p-3"
        placeholder="Share your feedback..."
      />

      <button className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg">
        Submit Feedback
      </button>
    </div>
  );
}
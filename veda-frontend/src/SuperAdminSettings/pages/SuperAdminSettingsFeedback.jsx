import { useState } from "react";
import { Star, Send } from "lucide-react";

export default function SuperAdminSettingsFeedback() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = () => {
    alert(
      `Feedback Submitted!\n\nRating: ${rating}/5\n\nMessage:\n${feedback}`
    );

    setRating(0);
    setFeedback("");
  };

  return (
    <div className="p-0 m-0 min-h-screen">
      {/* Header */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Feedback
        </h1>

        <p className="text-slate-500 mt-1">
          Help us improve by sharing your thoughts and suggestions.
        </p>
      </div>

      {/* Feedback Card */}

      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8">
        {/* Rating */}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            How would you rate your experience?
          </h3>

          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                className={`p-4 rounded-2xl border transition-all ${
                  rating >= star
                    ? "border-yellow-400 bg-yellow-50"
                    : "border-slate-200 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
                }`}
              >
                <Star
                  size={32}
                  className={
                    rating >= star
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-slate-300"
                  }
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="mt-3 text-sm font-medium text-slate-600">
              Selected Rating: {rating}/5
            </p>
          )}
        </div>

        {/* Feedback Text */}

        <div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            What can we do better?
          </h3>

          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what's on your mind..."
            className="w-full h-36 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
          />
        </div>

        {/* Submit */}

        <button
          onClick={handleSubmit}
          disabled={!feedback.trim() || rating === 0}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
          Send Feedback
        </button>
      </div>

      {/* Quick Stats */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-500">
            Feedback Received
          </h4>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            1,248
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-500">
            Average Rating
          </h4>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            4.8
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h4 className="text-sm font-semibold text-slate-500">
            Improvements Released
          </h4>

          <p className="text-3xl font-bold text-slate-900 mt-2">
            86
          </p>
        </div>
      </div>
    </div>
  );
}
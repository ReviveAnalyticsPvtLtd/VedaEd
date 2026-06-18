import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function ParentAccountSettings() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/parent")}
        className="flex items-center gap-2 mb-6 text-gray-600 hover:text-indigo-600"
      >
        <FiArrowLeft />
        Back
      </button>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h1 className="text-2xl font-semibold mb-6">
          Account Settings
        </h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value="parent@vedaed.com"
              readOnly
              className="w-full border rounded-lg px-4 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value="parent"
              readOnly
              className="w-full border rounded-lg px-4 py-2 bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm password"
              className="w-full border rounded-lg px-4 py-2"
            />
          </div>

          <button className="bg-indigo-600 text-white px-5 py-2 rounded-lg">
            Update Account
          </button>
        </div>
      </div>
    </div>
  );
}
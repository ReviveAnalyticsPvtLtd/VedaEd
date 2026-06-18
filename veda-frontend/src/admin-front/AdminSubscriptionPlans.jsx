import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function AdminSubscriptionPlans() {
  const navigate = useNavigate();

  return (
    <div className="p-6">
      <button
        onClick={() => navigate("/admin-front")}
        className="flex items-center gap-2 mb-6 text-gray-600 hover:text-indigo-600"
      >
        <FiArrowLeft />
        Back
      </button>

      <h1 className="text-2xl font-semibold mb-6">
        Admin Subscription Plans
      </h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* BASIC */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Basic</h2>

          <p className="text-gray-500 mb-4">
            Small Schools
          </p>

          <div className="text-3xl font-bold mb-4">
            ₹999
            <span className="text-sm font-normal">/month</span>
          </div>

          <ul className="space-y-2 text-sm">
            <li>✓ Student Management</li>
            <li>✓ Attendance</li>
            <li>✓ Reports</li>
          </ul>

          <button className="mt-6 w-full border rounded-lg py-2">
            Current Plan
          </button>
        </div>

        {/* PRO */}
        <div className="border-2 border-indigo-600 rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Pro</h2>

          <p className="text-gray-500 mb-4">
            Growing Schools
          </p>

          <div className="text-3xl font-bold mb-4">
            ₹2499
            <span className="text-sm font-normal">/month</span>
          </div>

          <ul className="space-y-2 text-sm">
            <li>✓ SIS Module</li>
            <li>✓ HR Module</li>
            <li>✓ Transport Module</li>
            <li>✓ Communication</li>
          </ul>

          <button className="mt-6 w-full bg-indigo-600 text-white rounded-lg py-2">
            Active Plan
          </button>
        </div>

        {/* ENTERPRISE */}
        <div className="border rounded-xl p-6 bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Enterprise</h2>

          <p className="text-gray-500 mb-4">
            Large Institutions
          </p>

          <div className="text-3xl font-bold mb-4">
            Custom
          </div>

          <ul className="space-y-2 text-sm">
            <li>✓ All Modules</li>
            <li>✓ API Access</li>
            <li>✓ Custom Integrations</li>
            <li>✓ Dedicated Support</li>
          </ul>

          <button className="mt-6 w-full border rounded-lg py-2">
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
}
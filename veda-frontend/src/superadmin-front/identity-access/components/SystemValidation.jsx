import { FiCheckCircle } from "react-icons/fi";

export default function SystemValidation({ checks = [], loading = false }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-semibold text-gray-900 mb-4">System Validation</h3>
      {loading ? (
        <p className="text-sm text-gray-500">Validating...</p>
      ) : checks.length === 0 ? (
        <p className="text-sm text-gray-500">
          Fill the form to run validation checks.
        </p>
      ) : (
        <ul className="space-y-3">
          {checks.map((check) => (
            <li key={check.id} className="flex gap-3">
              <FiCheckCircle
                className={`shrink-0 mt-0.5 text-lg ${
                  check.passed ? "text-green-500" : "text-gray-300"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    check.passed ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {check.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{check.description}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

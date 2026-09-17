import { useNavigate } from "react-router-dom";
import useParentFeeData from "./useParentFeeData";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function ParentPendingDues() {
  const navigate = useNavigate();
  const { child, dues, summary, loading, error } = useParentFeeData();

  if (loading) {
    return (
      <div className="p-0 min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-500 rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-0 min-h-screen">
        <h2 className="text-2xl font-bold mb-2">Pending Dues</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Pending Dues</h2>
      </div>

      <div className="flex gap-3 text-sm mb-3 text-gray-600 border-b">
        <button className="capitalize pb-2 text-blue-600 font-semibold border-b-2 border-blue-600">Overview</button>
      </div>

      <div className="bg-white border rounded-lg" />

      {child && (
        <div className="bg-white rounded-xl shadow p-5 mb-5">
          <div className="flex justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{child.name}</h3>
              <p className="text-gray-500">
                {child.grade || child.class || ""}
                {child.section ? ` (${child.section})` : ""}
              </p>
            </div>
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-semibold">
              Pending {formatCurrency(summary.totalPending)}
            </span>
          </div>

          {dues.length === 0 ? (
            <div className="border border-dashed border-green-200 rounded-lg p-6 text-center text-green-700 font-medium">
              All fees are settled.
            </div>
          ) : (
            <>
              {dues.map((due) => (
                <div key={due.id} className="flex justify-between border-b py-2">
                  <span>{due.title}</span>
                  <div className="text-right">
                    <span>{formatCurrency(due.balance)}</span>
                    {due.dueDate && (
                      <span className="text-xs text-gray-400 ml-2">Due {formatDate(due.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-3 font-bold text-lg">
                <span>Total Pending</span>
                <span className="text-red-600">{formatCurrency(summary.totalPending)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {summary.totalPending > 0 && (
        <div className="bg-white rounded-xl shadow p-5">
          <button
            onClick={() => navigate("/parent/fees/pay")}
            className="w-full mt-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg"
          >
            Pay Now
          </button>
        </div>
      )}
    </div>
  );
}

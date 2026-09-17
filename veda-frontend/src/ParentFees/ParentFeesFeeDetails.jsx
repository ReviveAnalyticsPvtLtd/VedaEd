import { useNavigate } from "react-router-dom";
import useParentFeeData from "./useParentFeeData";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function ParentFeesFeeDetails() {
  const navigate = useNavigate();
  const { child, fees, summary, loading, error } = useParentFeeData();

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
        <h2 className="text-2xl font-bold mb-2">Fee Details</h2>
        <div className="bg-white border rounded-lg p-8 text-center text-gray-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-0 min-h-screen">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-bold">Fee Details</h2>
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
            <div className="text-blue-600 font-bold text-lg">{formatCurrency(summary.totalPayable)}</div>
          </div>

          {fees.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
              No fee details available for this academic year.
            </div>
          ) : (
            <>
              {fees.map((fee) => (
                <div key={fee.category} className="flex justify-between border-b py-2">
                  <span>{fee.category}</span>
                  <div className="text-right">
                    <span>{formatCurrency(fee.amount)}</span>
                    {fee.paid > 0 && (
                      <span className="text-xs text-green-600 ml-2">(Paid: {formatCurrency(fee.paid)})</span>
                    )}
                    {fee.balance > 0 && (
                      <span className="text-xs text-red-600 ml-2">(Balance: {formatCurrency(fee.balance)})</span>
                    )}
                  </div>
                </div>
              ))}

              <div className="flex justify-between mt-3 font-bold text-lg">
                <span>Total</span>
                <span>{formatCurrency(summary.totalPayable)}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow p-5">
        <div className="flex justify-between text-2xl font-bold">
          <span>Grand Total</span>
          <span className={summary.totalPending > 0 ? "text-red-600" : "text-green-600"}>
            {summary.totalPending > 0 ? formatCurrency(summary.totalPending) : "All Paid"}
          </span>
        </div>

        {summary.totalPending > 0 && (
          <button
            onClick={() => navigate("/parent/fees/pay")}
            className="w-full mt-5 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg"
          >
            Pay Now
          </button>
        )}
      </div>
    </div>
  );
}

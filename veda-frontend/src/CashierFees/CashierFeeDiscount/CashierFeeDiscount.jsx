import React, { useEffect, useState } from "react";
import axios from "axios";
import config from "../../config";
import DiscountRules from "../CashierFeeMaster/CashierDiscounts";

export default function CashierFeeDiscount() {
  const [selectedYear, setSelectedYear] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        const res = await axios.get(`${config.API_BASE_URL}/academic-years`);
        if (Array.isArray(res.data)) {
          const active = res.data.find((y) => y.isActive);
          if (active) setSelectedYear(active.label);
          else if (res.data.length > 0) setSelectedYear(res.data[0].label);
          else setSelectedYear("2025-26");
        } else {
          setSelectedYear("2025-26");
        }
      } catch (err) {
        setSelectedYear("2025-26");
      } finally {
        setLoading(false);
      }
    };
    fetchYears();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="text-gray-500">Loading Session...</span>
      </div>
    );
  }

  return (
    <div className="p-0">
      <div className="text-gray-500 text-sm mb-2 flex items-center gap-1">
        <span>Fees</span>
        <span>&gt;</span>
        <span>Fee Discount</span>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold">Fee Discount</h2>
        <div className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 text-sm font-semibold text-blue-800">
          Session: {selectedYear}
        </div>
      </div>
      <DiscountRules selectedYear={selectedYear} />
    </div>
  );
}

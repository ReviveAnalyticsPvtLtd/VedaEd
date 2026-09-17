import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import config from "../config";

export default function useParentFeeData() {
  const [children, setChildren] = useState([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const token = localStorage.getItem("token");
    if (!user?.refId || !token) {
      setError("You need to be logged in to view fees.");
      setLoading(false);
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    const load = async () => {
      try {
        const [parentRes, yearRes] = await Promise.allSettled([
          axios.get(`${config.API_BASE_URL}/parents/${user.refId}`, { headers }),
          axios.get(`${config.API_BASE_URL}/academic-years/`, { headers }),
        ]);

        if (!active) return;

        const kids =
          parentRes.status === "fulfilled"
            ? parentRes.value.data?.parent?.children || []
            : [];
        setChildren(kids);
        if (kids.length > 0) setSelectedChildId(kids[0]._id);

        const years =
          yearRes.status === "fulfilled"
            ? Array.isArray(yearRes.value.data)
              ? yearRes.value.data
              : []
            : [];
        const current = years.find((y) => y.isActive) || years[0];
        if (current?.label) setAcademicYear(current.label);
      } catch {
        /* handled below */
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedChildId) return;
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };
        const params = academicYear ? { year: academicYear } : {};

        const res = await axios.get(
          `${config.API_BASE_URL}/fees/collect/student/${selectedChildId}`,
          { headers, params }
        );
        if (active) setProfile(res.data);
      } catch (err) {
        if (active) {
          const msg = err.response?.data?.message;
          if (msg === "No active academic year found") {
            setError("Fee records for the current academic year are not set up yet.");
          } else {
            setError(msg || "Could not load fee data.");
          }
          setProfile(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [selectedChildId, academicYear]);

  const fees = profile?.feesData || [];
  const installments = profile?.installments || [];
  const timeline = profile?.timeline || [];

  const summary = useMemo(() => {
    const totalPayable = fees.reduce((s, f) => s + Number(f.amount || 0), 0);
    const totalPaid = fees.reduce((s, f) => s + Number(f.paid || 0), 0);
    const totalPending = fees.reduce((s, f) => s + Number(f.balance || 0), 0);
    const lastPaymentDate = timeline.length
      ? timeline.map((t) => t.date).sort().pop()
      : null;
    return { totalPayable, totalPaid, totalPending, lastPaymentDate };
  }, [fees, timeline]);

  const dues = useMemo(() => {
    const unpaid = installments.filter((i) => Number(i.balance || 0) > 0);
    if (unpaid.length > 0) {
      const today = new Date();
      return unpaid.map((i) => ({
        id: `${i.category}__${i.installmentName}`,
        category: i.category,
        title:
          i.installmentName && i.installmentName !== "Full Payment"
            ? `${i.category} (${i.installmentName})`
            : i.category,
        dueDate: i.dueDate,
        amount: Number(i.payable ?? i.amount) || 0,
        balance: Number(i.balance) || 0,
        status: new Date(i.dueDate) < today ? "Pending" : "Upcoming",
      }));
    }
    return fees
      .filter((f) => Number(f.balance || 0) > 0)
      .map((f) => ({
        id: f.category,
        category: f.category,
        title: f.category,
        dueDate: null,
        amount: Number(f.amount) || 0,
        balance: Number(f.balance) || 0,
        status: "Pending",
      }));
  }, [installments, fees]);

  const child = children.find((c) => c._id === selectedChildId) || null;

  return {
    children,
    child,
    selectedChildId,
    setSelectedChildId,
    academicYear,
    profile,
    fees,
    installments,
    timeline,
    summary,
    dues,
    loading,
    error,
  };
}

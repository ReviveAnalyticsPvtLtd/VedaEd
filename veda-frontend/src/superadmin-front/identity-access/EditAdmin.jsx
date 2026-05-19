import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageHeader from "./components/PageHeader";
import AdminForm from "./components/AdminForm";
import AccessSummary from "./components/AccessSummary";
import SystemValidation from "./components/SystemValidation";
import { superadminIdentityAPI } from "../../services/superadminIdentityAPI";
import useIdentityMeta from "./hooks/useIdentityMeta";

const BASE = "/superadmin-front/identity-access";

export default function EditAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { meta } = useIdentityMeta();
  const [form, setForm] = useState(null);
  const [checks, setChecks] = useState([]);
  const [validating, setValidating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    superadminIdentityAPI
      .getAdmin(id)
      .then((res) => setForm(res.data))
      .catch((err) => setError(err.message));
  }, [id]);

  const runValidation = useCallback(async () => {
    if (!form) return;
    setValidating(true);
    try {
      const res = await superadminIdentityAPI.validateAccess(form);
      setChecks(res.data?.checks || []);
    } catch {
      setChecks([]);
    } finally {
      setValidating(false);
    }
  }, [form]);

  useEffect(() => {
    if (!form) return;
    const t = setTimeout(runValidation, 400);
    return () => clearTimeout(t);
  }, [form, runValidation]);

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await superadminIdentityAPI.updateAdmin(id, {
        ...form,
        strictValidate: true,
      });
      navigate(`${BASE}/admins/${id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="p-6 text-gray-500">
        {error || "Loading..."}
      </div>
    );
  }

  return (
    <div
      className="min-h-full bg-gray-100 p-4 md:p-6"
    >
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Identity & Access", to: `${BASE}/admins` },
          { label: "Edit Admin" },
        ]}
        title="Edit Admin"
        subtitle={form.email}
      />

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <AdminForm
            form={form}
            meta={meta}
            onChange={setForm}
            onPermissionsChange={(permissions) =>
              setForm((f) => ({ ...f, permissions }))
            }
          />
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(`${BASE}/admins/${id}`)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={save}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <AccessSummary
            form={form}
            statusLabel={form.status === "active" ? "Active" : "Inactive"}
          />
          <SystemValidation checks={checks} loading={validating} />
        </div>
      </div>
    </div>
  );
}

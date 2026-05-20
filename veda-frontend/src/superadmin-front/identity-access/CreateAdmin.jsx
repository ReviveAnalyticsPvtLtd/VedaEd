import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "./components/PageHeader";
import AdminForm from "./components/AdminForm";
import AccessSummary from "./components/AccessSummary";
import { superadminIdentityAPI } from "../../services/superadminIdentityAPI";
import {
  EMPTY_ADMIN_FORM,
  buildEmptyPermissions,
  isValidPhone,
  validatePasswordFields,
} from "./constants";
import { toastBannerClassName } from "../../utils/toastMessageStyle";
import useIdentityMeta from "./hooks/useIdentityMeta";

const BASE = "/superadmin-front/identity-access";

export default function CreateAdmin() {
  const navigate = useNavigate();
  const { meta, defaultSchool } = useIdentityMeta();
  const [form, setForm] = useState({
    ...EMPTY_ADMIN_FORM,
    permissions: buildEmptyPermissions(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    superadminIdentityAPI
      .getNextEmployeeId()
      .then((res) =>
        setForm((f) => ({ ...f, employeeId: res.data?.employeeId || "" }))
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!defaultSchool) return;
    setForm((f) => ({
      ...f,
      school: defaultSchool,
      campus: f.campus || meta?.campuses?.[0] || "",
      scope: f.scope || meta?.scopes?.[0] || "",
    }));
  }, [defaultSchool, meta]);

  useEffect(() => {
    if (!form.adminType) return;
    superadminIdentityAPI
      .getDefaultPermissions(form.adminType)
      .then((res) => setForm((f) => ({ ...f, permissions: res.data })))
      .catch(() => {});
  }, [form.adminType]);

  const submit = async ({ draft = false, invite = false } = {}) => {
    if (form.phone && !isValidPhone(form.phone)) {
      setError("Phone number must be 10–15 digits.");
      return;
    }

    if (!draft) {
      const passwordError = validatePasswordFields(form.password, form.confirmPassword);
      if (passwordError) {
        setError(passwordError);
        return;
      }
    }

    setSaving(true);
    setError("");
    setToast("");
    try {
      const { confirmPassword, ...adminPayload } = form;
      const res = await superadminIdentityAPI.createAdmin({
        ...adminPayload,
        school: form.school || defaultSchool,
        isDraft: draft,
        sendInvite: invite,
        strictValidate: invite || !draft,
      });
      if (invite) {
        setToast(res.message || "Invitation email sent successfully");
        navigate(`${BASE}/admins/${res.data._id}/invite-preview`);
        return;
      }
      if (draft) {
        navigate(`${BASE}/admins/${res.data._id}/edit`, {
          state: {
            draftSavedMessage: res.message || "Draft saved. Continue editing below.",
          },
        });
        return;
      }
      navigate(`${BASE}/admins`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-gray-100 p-4 md:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Identity & Access", to: `${BASE}/admins` },
          { label: "Create Admin" },
        ]}
        title="Create / Invite Admin"
        subtitle="Set basic details, access scope, and review permissions before sending an invite."
      />

      {toast && (
        <p
          className={`mb-4 text-sm rounded-lg px-3 py-2 border font-medium ${toastBannerClassName(toast)}`}
        >
          {toast}
        </p>
      )}
      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">Create New Admin</h2>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
              Invitation Based
            </span>
          </div>

          <AdminForm
            form={form}
            meta={meta}
            onChange={setForm}
            onPermissionsChange={(permissions) =>
              setForm((f) => ({ ...f, permissions }))
            }
            isCreate
            lockedSchool={defaultSchool}
          />

          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              disabled={saving}
              onClick={() => submit({ draft: true })}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium
                text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => submit({ invite: true })}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
                hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >
              {saving ? "Sending..." : "Send Invite"}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <AccessSummary form={form} statusLabel="Pending" />
        </div>
      </div>
    </div>
  );
}

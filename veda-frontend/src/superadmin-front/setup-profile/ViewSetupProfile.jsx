import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiEdit2 } from "react-icons/fi";
import PageHeader from "../identity-access/components/PageHeader";
import SetupProfileForm from "./components/SetupProfileForm";
import SetupProfileSummary from "./components/SetupProfileSummary";
import { getSetupProfile } from "../../services/setupWizardAPI";

const BASE = "/superadmin-front/setup-profile";

export default function ViewSetupProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSetupProfile()
      .then((res) => setProfile(res.data))
      .catch((err) => setError(err.message));
  }, []);

  if (!profile && !error) {
    return (
      <div className="min-h-full bg-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading setup profile...
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-full bg-gray-100 p-4 md:p-6">
        <PageHeader
          breadcrumbs={[
            { label: "Dashboard", to: "/superadmin-front/dashboard" },
            { label: "Setup Profile" },
          ]}
          title="Setup Profile"
        />
        <div className="text-center py-20">
          <p className="text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3 inline-block text-sm">
            {error}
          </p>
          <button
            type="button"
            onClick={() => navigate("/superadmin-front/dashboard")}
            className="mt-4 block mx-auto text-sm text-indigo-600 hover:underline"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-100 p-4 md:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Dashboard", to: "/superadmin-front/dashboard" },
          { label: "Setup Profile" },
        ]}
        title="Setup Profile"
        subtitle={`Organization setup data for ${profile.schoolName}`}
        action={
          <Link
            to={`${BASE}/edit`}
            className="inline-flex items-center gap-2 bg-indigo-600 text-white
              px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <FiEdit2 /> Edit
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SetupProfileForm form={profile} onChange={() => {}} readOnly />
        </div>
        <SetupProfileSummary form={profile} />
      </div>

      <button
        type="button"
        onClick={() => navigate("/superadmin-front/dashboard")}
        className="mt-6 text-sm text-indigo-600 hover:underline"
      >
        ← Back to dashboard
      </button>
    </div>
  );
}
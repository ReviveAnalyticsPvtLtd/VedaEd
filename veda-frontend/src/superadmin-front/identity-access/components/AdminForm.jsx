import { Label, Input, Select } from "./FormField";
import PermissionMatrix from "./PermissionMatrix";
import {
  sanitizePhone,
  PHONE_MIN_LENGTH,
  PHONE_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../constants";

export default function AdminForm({
  form,
  meta,
  onChange,
  onPermissionsChange,
  readOnly = false,
  showPermissions = true,
  isCreate = false,
  lockedSchool = "",
}) {
  const set = (field, value) => onChange({ ...form, [field]: value });

  const adminTypes = meta?.adminTypes || [];
  const scopes = meta?.scopes || [];
  const schoolLocked = Boolean(lockedSchool);
  const phoneDigits = form.phone || "";

  const handlePhoneChange = (e) => {
    set("phone", sanitizePhone(e.target.value));
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Full Name</Label>
            <Input
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="Amit Sharma"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label required>Email Address</Label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="amit.sharma@school.com"
              disabled={readOnly}
            />
          </div>
          <div>
            <Label>Phone Number</Label>
            <Input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.phone}
              onChange={handlePhoneChange}
              onKeyDown={(e) => {
                if (["e", "E", "+", "-", ".", ","].includes(e.key)) e.preventDefault();
              }}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData("text");
                set("phone", sanitizePhone(pasted));
              }}
              placeholder="9876543210"
              disabled={readOnly}
              maxLength={PHONE_MAX_LENGTH}
              className={
                phoneDigits && phoneDigits.length < PHONE_MIN_LENGTH
                  ? "border-amber-400 focus:ring-amber-500 focus:border-amber-500"
                  : ""
              }
            />
            {phoneDigits && phoneDigits.length < PHONE_MIN_LENGTH && (
              <p className="mt-1 text-xs text-amber-600">
                Enter at least {PHONE_MIN_LENGTH} digits.
              </p>
            )}
          </div>
          <div>
            <Label>Employee ID</Label>
            <Input
              value={form.employeeId}
              readOnly
              disabled
              placeholder="ADM-2026-001"
              className="bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            {isCreate && (
              <p className="mt-1 text-xs text-gray-500">Auto-generated for this admin.</p>
            )}
          </div>
          <div>
            <Label>Department</Label>
            <Select
              value={form.department}
              onChange={(e) => set("department", e.target.value)}
              disabled={readOnly}
            >
              {(meta?.departments || ["Academic"]).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Designation</Label>
            <Input
              value={form.designation}
              onChange={(e) => set("designation", e.target.value)}
              placeholder="Academic Coordinator"
              disabled={readOnly}
            />
          </div>
          {isCreate && (
            <>
              <div>
                <Label required>Password</Label>
                <Input
                  type="password"
                  value={form.password || ""}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder={`Minimum ${PASSWORD_MIN_LENGTH} characters`}
                  disabled={readOnly}
                  autoComplete="new-password"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Initial login password. Admin can change it after signing in.
                </p>
              </div>
              <div>
                <Label required>Confirm Password</Label>
                <Input
                  type="password"
                  value={form.confirmPassword || ""}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  placeholder="Re-enter password"
                  disabled={readOnly}
                  autoComplete="new-password"
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-base font-semibold text-indigo-900 mb-4">
          Access Scope
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label required>Admin Type</Label>
            <Select
              value={form.adminType}
              onChange={(e) => set("adminType", e.target.value)}
              disabled={readOnly}
            >
              {adminTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>School</Label>
            {schoolLocked ? (
              <>
                <Input
                  value={form.school || lockedSchool}
                  readOnly
                  disabled
                  className="bg-gray-50 text-gray-600 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Assigned from your institute configuration.
                </p>
              </>
            ) : (
              <Input
                value={form.school}
                onChange={(e) => set("school", e.target.value)}
                placeholder="School name"
                disabled={readOnly}
              />
            )}
          </div>
          <div>
            <Label>Campus</Label>
            <Select
              value={form.campus}
              onChange={(e) => set("campus", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select campus</option>
              {(meta?.campuses || []).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label required>Scope</Label>
            <Select
              value={form.scope}
              onChange={(e) => set("scope", e.target.value)}
              disabled={readOnly}
            >
              <option value="">Select scope</option>
              {scopes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </section>

      {showPermissions && (
        <PermissionMatrix
          permissions={form.permissions}
          onChange={onPermissionsChange}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

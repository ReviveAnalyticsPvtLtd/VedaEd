/**
 * Fee module tenant + authorization helpers.
 *
 * Reuses the project's EXISTING authorization machinery rather than inventing a
 * second one:
 *   - tenant context  : authMiddleware + requireSchoolContext (src/middleware)
 *   - capabilities    : Role / Permission / RolePermission, exactly as
 *                       permissionMiddleware resolves them
 *
 * Only capabilities that already exist in the project's permission table are
 * used: `view_fees`, `manage_fees`, `collect_fees` (all currently granted to
 * the `admin` role). No new role or permission name is introduced.
 *
 * Parent access follows the same rule the parent dashboard already uses
 * (src/modules/parents/parentControllers.js): `Parent.children` is only an
 * array of Student references, so a child id is usable only after the Student
 * document itself has been verified to belong to the caller's school.
 */
const mongoose = require("mongoose");

const Role = require("../../models/Role");
const Permission = require("../../models/Permission");
const RolePermission = require("../../models/RolePermission");
const Student = require("../student/studentModels");
const Parent = require("../parents/parentModel");

/** Fee capabilities that already exist in the project permission table. */
const CAP = {
    VIEW_FEES: "view_fees",
    MANAGE_FEES: "manage_fees",
    COLLECT_FEES: "collect_fees",
};

/** The authoritative tenant. Never read from params, query or body. */
const schoolId = (req) => String(req.user.schoolId);

/** Add the authoritative school to a query selector. */
const tenantScope = (req, extra = {}) => ({ ...extra, schoolId: schoolId(req) });

/**
 * Explicit allowlist for request payloads.
 * A field the caller is not allowed to set is dropped rather than trusted.
 */
const pick = (body, allowed) => {
    const src = body && typeof body === "object" ? body : {};
    const out = {};
    for (const key of allowed) {
        if (src[key] !== undefined) out[key] = src[key];
    }
    return out;
};

/**
 * Resolve a capability for the authenticated role.
 * Mirrors permissionMiddleware's Role -> Permission -> RolePermission lookup,
 * but as a predicate so a controller can allow either an admin capability or a
 * verified parent child.
 */
async function hasCapability(req, capability) {
    if (!req.user || !req.user.role) return false;
    const roleName = String(req.user.role).toLowerCase();
    const role = await Role.findOne({ name: roleName }).lean();
    if (!role) return false;
    const permission = await Permission.findOne({ name: capability }).lean();
    if (!permission) return false;
    const granted = await RolePermission.findOne({
        roleId: role._id,
        permissionId: permission._id,
    }).lean();
    return Boolean(granted);
}

/** True when the caller may act on any student inside its own school. */
async function canManageFees(req) {
    return (
        (await hasCapability(req, CAP.MANAGE_FEES)) ||
        (await hasCapability(req, CAP.COLLECT_FEES)) ||
        (await hasCapability(req, CAP.VIEW_FEES))
    );
}

/** True when the caller is a parent acting on behalf of a linked child. */
const isParent = (req) => String(req.user?.role || "").toLowerCase() === "parent";

/**
 * Resolve a Student that the caller is actually allowed to read fees for.
 *
 * The student must belong to the caller's school. A parent additionally needs
 * the student to appear in the parent's own verified `children` list. Anything
 * else fails closed by returning null, so the caller responds NOT FOUND rather
 * than revealing that the id exists in another tenant.
 *
 * @returns {Promise<object|null>}
 */
async function resolveAccessibleStudent(req, studentId) {
    const school = schoolId(req);
    if (!studentId || !mongoose.isValidObjectId(String(studentId))) return null;

    // Tenant check first: the Student document itself must be owned by us.
    const student = await Student.findOne({ _id: studentId, schoolId: school }).lean();
    if (!student) return null;

    if (await canManageFees(req)) return student;

    if (isParent(req)) {
        const parent = await Parent.findOne({ _id: req.user.refId, schoolId: school }).lean();
        if (!parent) return null;
        const childIds = (parent.children || []).map((c) => String(c));
        if (!childIds.includes(String(student._id))) return null;
        return student;
    }

    // A role with no fee capability and that is not a parent: no access.
    return null;
}

/** The verified child ids a parent may read fees for. Empty for other roles. */
async function verifiedChildIds(req) {
    if (!isParent(req)) return null;
    const school = schoolId(req);
    const parent = await Parent.findOne({ _id: req.user.refId, schoolId: school }).lean();
    if (!parent) return [];
    const raw = (parent.children || []).map((c) => String(c));
    if (!raw.length) return [];
    // Verify each referenced child really belongs to this school, exactly as the
    // parent dashboard does, before any id is used downstream.
    const owned = await Student.find({ _id: { $in: raw }, schoolId: school })
        .select("_id")
        .lean();
    const ok = new Set(owned.map((s) => String(s._id)));
    return raw.filter((id) => ok.has(id));
}

module.exports = {
    CAP,
    schoolId,
    tenantScope,
    pick,
    hasCapability,
    canManageFees,
    isParent,
    resolveAccessibleStudent,
    verifiedChildIds,
};

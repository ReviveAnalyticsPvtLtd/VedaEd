const PlatformAdmin = require("../../models/PlatformAdmin");
const User = require("../../models/User");
const Role = require("../../models/Role");
const {
  INVITE_EXPIRY_HOURS,
  issueAndSendInvite,
  findAdminByInviteToken,
  isInviteTokenValid,
} = require("./inviteHelpers");

const PERMISSION_MODULES = [
  "Students",
  "Exams",
  "Gradebook",
  "Fees",
  "HR",
  "Transport",
  "Communication",
  "Admission",
  "Calendar",
  "SIS",
];

const ADMIN_TYPES = [
  "School Admin",
  "Academic Admin",
  "Finance Admin",
  "Support Admin",
];

const generateNextEmployeeId = async () => {
  const year = new Date().getFullYear();
  const prefix = `ADM-${year}-`;
  const pattern = new RegExp(`^ADM-${year}-(\\d+)$`);

  const admins = await PlatformAdmin.find({
    employeeId: { $regex: `^ADM-${year}-` },
  })
    .select("employeeId")
    .lean();

  let maxNum = 0;
  for (const admin of admins) {
    const match = admin.employeeId?.match(pattern);
    if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
  }

  return `${prefix}${String(maxNum + 1).padStart(3, "0")}`;
};

const defaultPermissionsForType = (adminType) => {
  const base = PERMISSION_MODULES.map((module) => ({
    module,
    view: false,
    create: false,
    edit: false,
    delete: false,
  }));

  if (adminType === "Academic Admin") {
    return base.map((row) => {
      if (["Students", "Exams", "Gradebook", "SIS"].includes(row.module)) {
        return { ...row, view: true, edit: row.module !== "Students", create: ["Exams", "Gradebook"].includes(row.module) };
      }
      return row;
    });
  }

  if (adminType === "School Admin") {
    return base.map((row) => ({ ...row, view: true, create: true, edit: true }));
  }

  if (adminType === "Finance Admin") {
    return base.map((row) =>
      row.module === "Fees"
        ? { ...row, view: true, create: true, edit: true }
        : row
    );
  }

  return base;
};

const PASSWORD_MIN_LENGTH = 8;

const validatePermissions = (adminType, permissions = []) => {
  const issues = [];
  const finance = permissions.find((p) => p.module === "Fees");

  if (adminType === "Academic Admin" && finance && (finance.view || finance.create || finance.edit || finance.delete)) {
    issues.push("Finance access disabled for Academic Admin.");
  }

  return issues;
};

exports.getMeta = async (req, res) => {
  try {
    const institution = await require("../institution/institutionModel").findOne().lean();
    const schoolName =
      institution?.identity?.schoolName || "Veda International School";

    res.json({
      success: true,
      data: {
        adminTypes: ADMIN_TYPES,
        departments: ["Academic", "Finance", "Operations", "IT", "Administration"],
        schools: [schoolName],
        campuses: ["Main Campus", "East Campus", "West Campus"],
        scopes: [
          "All Grades",
          "Grade 9-12 Only",
          "Grade 6-8 Only",
          "Assigned School Only",
        ],
        permissionModules: PERMISSION_MODULES,
      },
    });
  } catch (error) {
    console.error("getMeta error:", error);
    res.status(500).json({ success: false, message: "Failed to load metadata" });
  }
};

exports.listAdmins = async (req, res) => {
  try {
    const { search = "", adminType = "", status = "" } = req.query;
    const filter = {};

    if (adminType) filter.adminType = adminType;
    if (status === "draft") {
      filter.isDraft = true;
    } else if (status === "active" || status === "inactive") {
      filter.isDraft = false;
      filter.status = status;
    }
    if (req.query.inviteStatus) filter.inviteStatus = req.query.inviteStatus;
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const admins = await PlatformAdmin.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: admins });
  } catch (error) {
    console.error("listAdmins error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admins" });
  }
};

exports.getAdmin = async (req, res) => {
  try {
    const admin = await PlatformAdmin.findById(req.params.id)
      .select("+initialPassword")
      .lean();
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    const { initialPassword, ...adminData } = admin;
    res.json({
      success: true,
      data: {
        ...adminData,
        ...(initialPassword ? { password: initialPassword } : {}),
      },
    });
  } catch (error) {
    console.error("getAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch admin" });
  }
};

exports.getNextEmployeeId = async (req, res) => {
  try {
    const employeeId = await generateNextEmployeeId();
    res.json({ success: true, data: { employeeId } });
  } catch (error) {
    console.error("getNextEmployeeId error:", error);
    res.status(500).json({ success: false, message: "Failed to generate employee ID" });
  }
};

const rollbackCreatedAdmin = async (adminId, userId) => {
  if (adminId) {
    await PlatformAdmin.findByIdAndDelete(adminId).catch(() => {});
  }
  if (userId) {
    await User.findByIdAndDelete(userId).catch(() => {});
  }
};

exports.createAdmin = async (req, res) => {
  let createdAdminId = null;
  let createdUserId = null;
  let storedInitialPassword = null;

  try {
    const payload = req.body;
    const existing = await PlatformAdmin.findOne({
      email: payload.email?.toLowerCase(),
      isDraft: false,
    });
    if (existing && !payload.isDraft) {
      return res.status(400).json({ success: false, message: "Admin with this email already exists" });
    }

    const permissions =
      payload.permissions?.length > 0
        ? payload.permissions
        : defaultPermissionsForType(payload.adminType);

    const conflicts = validatePermissions(payload.adminType, permissions);
    if (conflicts.length && payload.strictValidate) {
      return res.status(400).json({ success: false, message: conflicts[0], conflicts });
    }

    const isInviteFlow = payload.sendInvite && !payload.isDraft;

    if (!payload.isDraft) {
      const password = (payload.password || payload.tempPassword || "").trim();
      if (!password || password.length < PASSWORD_MIN_LENGTH) {
        return res.status(400).json({
          success: false,
          message: `Password is required and must be at least ${PASSWORD_MIN_LENGTH} characters`,
        });
      }
      storedInitialPassword = password;

      const adminRole = await Role.findOne({ name: "admin" });
      if (!adminRole) {
        return res.status(500).json({ success: false, message: "Admin role not configured" });
      }

      const existingUser = await User.findOne({ email: payload.email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User with this email already exists" });
      }

      const user = await User.create({
        name: payload.fullName,
        email: payload.email.toLowerCase(),
        password,
        roleId: adminRole._id,
        status: isInviteFlow ? "inactive" : payload.status || "active",
      });
      createdUserId = user._id;
    }

    const employeeId =
      payload.employeeId?.trim() || (await generateNextEmployeeId());

    const admin = await PlatformAdmin.create({
      userId: createdUserId,
      fullName: payload.fullName,
      email: payload.email.toLowerCase(),
      phone: payload.phone,
      employeeId,
      department: payload.department,
      designation: payload.designation,
      adminType: payload.adminType,
      school: payload.school,
      campus: payload.campus,
      scope: payload.scope,
      permissions,
      inviteStatus: isInviteFlow ? "pending" : payload.isDraft ? "pending" : "accepted",
      status: payload.isDraft ? "inactive" : isInviteFlow ? "inactive" : payload.status || "active",
      isDraft: !!payload.isDraft,
      ...(storedInitialPassword ? { initialPassword: storedInitialPassword } : {}),
    });
    createdAdminId = admin._id;

    if (isInviteFlow) {
      try {
        await issueAndSendInvite(admin);
      } catch (inviteError) {
        await rollbackCreatedAdmin(createdAdminId, createdUserId);
        createdAdminId = null;
        createdUserId = null;
        console.error("createAdmin invite email error:", inviteError);
        return res.status(500).json({
          success: false,
          message:
            inviteError.message ||
            "Failed to send invitation email. Admin was not created. Check email configuration.",
        });
      }
    }

    const responseAdmin = await PlatformAdmin.findById(admin._id).lean();
    res.status(201).json({
      success: true,
      data: responseAdmin,
      message: isInviteFlow ? "Invitation email sent successfully" : undefined,
    });
  } catch (error) {
    if (createdAdminId || createdUserId) {
      await rollbackCreatedAdmin(createdAdminId, createdUserId);
    }
    console.error("createAdmin error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to create admin" });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const admin = await PlatformAdmin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const payload = req.body;
    const permissions = payload.permissions || admin.permissions;
    const conflicts = validatePermissions(payload.adminType || admin.adminType, permissions);
    if (conflicts.length && payload.strictValidate) {
      return res.status(400).json({ success: false, message: conflicts[0], conflicts });
    }

    if (payload.email && payload.email.toLowerCase() !== admin.email) {
      const dup = await PlatformAdmin.findOne({
        email: payload.email.toLowerCase(),
        _id: { $ne: admin._id },
        isDraft: false,
      });
      if (dup) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    Object.assign(admin, {
      fullName: payload.fullName ?? admin.fullName,
      email: payload.email?.toLowerCase() ?? admin.email,
      phone: payload.phone ?? admin.phone,
      employeeId: payload.employeeId ?? admin.employeeId,
      department: payload.department ?? admin.department,
      designation: payload.designation ?? admin.designation,
      adminType: payload.adminType ?? admin.adminType,
      school: payload.school ?? admin.school,
      campus: payload.campus ?? admin.campus,
      scope: payload.scope ?? admin.scope,
      permissions,
      isDraft: payload.isDraft ?? admin.isDraft,
      inviteStatus: admin.inviteStatus,
    });

    if (payload.sendInvite && !admin.isDraft && admin.inviteStatus !== "accepted") {
      await issueAndSendInvite(admin);
    }

    if (admin.userId) {
      await User.findByIdAndUpdate(admin.userId, {
        name: admin.fullName,
        email: admin.email,
        ...(payload.status ? { status: payload.status } : {}),
      });
    }

    await admin.save();
    res.json({ success: true, data: admin });
  } catch (error) {
    console.error("updateAdmin error:", error);
    res.status(500).json({ success: false, message: "Failed to update admin" });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const existing = await PlatformAdmin.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    if (existing.isDraft) {
      return res.status(400).json({
        success: false,
        message: "Cannot change activation status while the admin is still a draft.",
      });
    }

    const admin = await PlatformAdmin.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (admin.userId) {
      await User.findByIdAndUpdate(admin.userId, { status });
    }

    res.json({ success: true, data: admin });
  } catch (error) {
    console.error("updateStatus error:", error);
    res.status(500).json({ success: false, message: "Failed to update status" });
  }
};

exports.validateAccess = async (req, res) => {
  try {
    const { email, adminType, school, campus, scope, permissions } = req.body;

    const checks = [];

    const dup = await PlatformAdmin.findOne({
      email: email?.toLowerCase(),
      isDraft: false,
    });
    checks.push({
      id: "email",
      title: "Email not duplicate",
      passed: !dup,
      description: dup
        ? "An admin with this email already exists."
        : "No existing admin found for this email.",
    });

    checks.push({
      id: "scope",
      title: "School scope valid",
      passed: !!(school && scope),
      description: school && scope
        ? "Access restricted to selected campus and grades."
        : "Select school and scope to validate access.",
    });

    const conflicts = validatePermissions(adminType, permissions);
    checks.push({
      id: "permissions",
      title: "No permission conflict",
      passed: conflicts.length === 0,
      description: conflicts[0] || "Finance access disabled for Academic Admin.",
    });

    res.json({
      success: true,
      data: {
        checks,
        allPassed: checks.every((c) => c.passed),
        campus,
        scope,
      },
    });
  } catch (error) {
    console.error("validateAccess error:", error);
    res.status(500).json({ success: false, message: "Validation failed" });
  }
};

exports.getDefaultPermissions = async (req, res) => {
  try {
    const { adminType = "Academic Admin" } = req.query;
    res.json({
      success: true,
      data: defaultPermissionsForType(adminType),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load permissions" });
  }
};

exports.sendInvite = async (req, res) => {
  try {
    const admin = await PlatformAdmin.findById(req.params.id);
    if (!admin || admin.isDraft) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }
    if (admin.inviteStatus === "accepted") {
      return res.status(400).json({ success: false, message: "Invitation already accepted" });
    }

    await issueAndSendInvite(admin);
    const data = await PlatformAdmin.findById(admin._id).lean();
    res.json({ success: true, data, message: "Invitation email sent successfully" });
  } catch (error) {
    console.error("sendInvite error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send invitation email",
    });
  }
};

exports.resendInvite = async (req, res) => {
  return exports.sendInvite(req, res);
};

exports.validateInviteToken = async (req, res) => {
  try {
    const token = req.query.token || req.body?.token;
    const admin = await findAdminByInviteToken(token);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation link" });
    }
    if (admin.inviteStatus === "accepted") {
      return res.status(400).json({ success: false, message: "This invitation has already been accepted" });
    }
    if (!isInviteTokenValid(admin)) {
      return res.status(400).json({ success: false, message: "Invitation link has expired" });
    }

    res.json({
      success: true,
      data: {
        fullName: admin.fullName,
        email: admin.email,
        adminType: admin.adminType,
        school: admin.school,
        campus: admin.campus,
        scope: admin.scope,
        expiresAt: admin.inviteTokenExpiresAt,
        expiresInHours: INVITE_EXPIRY_HOURS(),
        passwordPreSet: !!admin.userId,
      },
    });
  } catch (error) {
    console.error("validateInviteToken error:", error);
    res.status(500).json({ success: false, message: "Failed to validate invitation" });
  }
};

exports.acceptInvite = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Invitation token is required" });
    }

    const admin = await findAdminByInviteToken(token);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Invalid or expired invitation link" });
    }
    if (admin.inviteStatus === "accepted") {
      return res.status(400).json({ success: false, message: "This invitation has already been accepted" });
    }
    if (!isInviteTokenValid(admin)) {
      return res.status(400).json({ success: false, message: "Invitation link has expired" });
    }

    const adminRole = await Role.findOne({ name: "admin" });
    if (!adminRole) {
      return res.status(500).json({ success: false, message: "Admin role not configured" });
    }

    const passwordPreSet = !!admin.userId;
    if (!passwordPreSet && (!password || password.length < PASSWORD_MIN_LENGTH)) {
      return res.status(400).json({
        success: false,
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    let user;
    if (admin.userId) {
      user = await User.findById(admin.userId);
      if (user) {
        if (password && password.length >= PASSWORD_MIN_LENGTH) {
          user.password = password;
          admin.initialPassword = password;
        }
        user.status = "active";
        await user.save();
      }
    }

    if (!user) {
      const existingUser = await User.findOne({ email: admin.email });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "An account with this email already exists" });
      }
      user = await User.create({
        name: admin.fullName,
        email: admin.email,
        password,
        roleId: adminRole._id,
        status: "active",
      });
      admin.userId = user._id;
      if (password && password.length >= PASSWORD_MIN_LENGTH) {
        admin.initialPassword = password;
      }
    }

    admin.inviteStatus = "accepted";
    admin.status = "active";
    admin.acceptedAt = new Date();
    admin.inviteToken = undefined;
    admin.inviteTokenExpiresAt = undefined;
    await admin.save();

    // Generate login session for automatic authentication
    let authSession = null;
    try {
      const populatedUser = await User.findById(user._id).populate("roleId");
      const { buildFullAuthSession } = require("../../utils/authTokens");
      authSession = await buildFullAuthSession(populatedUser);
    } catch (sessionError) {
      console.error("Error creating auth session:", sessionError);
    }

    res.json({
      success: true,
      message: passwordPreSet
        ? "Invitation accepted. Sign in with the password set by your administrator. You can change it after logging in."
        : "Invitation accepted successfully. You can now sign in.",
      data: {
        email: admin.email,
        fullName: admin.fullName,
        passwordPreSet,
      },
      session: authSession,
    });
  } catch (error) {
    console.error("acceptInvite error:", error);
    res.status(500).json({ success: false, message: error.message || "Failed to accept invitation" });
  }
};

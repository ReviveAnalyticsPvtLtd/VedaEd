const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const RolePermission = require("../models/RolePermission");
const {
  flattenPlatformPermissions,
  findPlatformAdminByEmployeeId,
  validatePlatformAdminForLogin,
} = require("../utils/platformAdminAuth");
const {
  checkUserExists,
  registerWithEmail,
  buildOnboardingSessionPayload,
} = require("../services/onboardingAuthSessionService");

const PASSWORD_MIN_LENGTH = 8;

/**
 * Sanitises one component of a synthesised login key.
 */
const sanitizeLoginPart = (value) =>
  String(value == null ? "" : value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * Builds a deterministic, collision-proof login key for a person who signs in
 * with an ID rather than an email address.
 *
 * User.email is required and uniquely indexed, and the just-in-time paths used
 * to fill it from whichever field happened to be populated — contactInfo.email,
 * then personalInfo.username, then the ID. Two students with no contactInfo and
 * the same placeholder username therefore produced the same value and the
 * second insert died with E11000 duplicate key ... index: email_1.
 *
 * The school is part of the key deliberately. stdId, parentId and staffId are
 * each unique only WITHIN a school — the indexes are compound, e.g.
 * schoolId_1_personalInfo.stdId_1 — and the live data proves the point:
 * STD-2026-0001 currently exists under six different schools. Building the key
 * from the ID alone would merely move the collision from within a school to
 * between schools. The (school, identifier) pair is exactly the key the database
 * already enforces as unique.
 *
 * The .invalid TLD is reserved by RFC 2606 and can never be registered, so a
 * synthetic key can never collide with somebody's real mailbox.
 */
const syntheticLoginEmail = (kind, schoolId, seed) =>
  `${kind}-${sanitizeLoginPart(schoolId)}-${sanitizeLoginPart(seed)}@${kind}s.invalid`;

/**
 * Chooses the login key for a just-in-time user: a genuine address when one is
 * present and genuinely unused, otherwise a deterministic synthetic key.
 *
 * A real address is still preferred so the users list stays readable, but it is
 * verified as free before use — addresses are unique per school, not per
 * person, so two students can legitimately share one.
 */
const resolveJitLoginEmail = async ({ preferredEmail, kind, schoolId, seed }) => {
  const preferred = String(preferredEmail == null ? "" : preferredEmail).trim().toLowerCase();
  if (preferred) {
    const taken = await User.findOne({ email: preferred }).select("_id").lean();
    if (!taken) return preferred;
  }
  return syntheticLoginEmail(kind, schoolId, seed);
};

/**
 * Resolves a login id to at most one record, or refuses to choose.
 *
 * Neither personalInfo.stdId nor personalInfo.username is globally unique. Both
 * are unique only WITHIN a school, enforced by compound indexes
 * (schoolId_1_personalInfo.stdId_1 and schoolId_1_personalInfo.username_1).
 * The live data proves this is not theoretical: STD-2026-0001 exists under six
 * schools and the username "aara" under five.
 *
 * The login request carries no tenant context whatsoever — the body is only
 * { email|employeeId, password, role } — and /api/auth/login is the single
 * global endpoint, with no school slug, host or subdomain middleware anywhere in
 * the app. So there is no legitimate, non-guessable way to tell the schools
 * apart, and this function must not invent one.
 *
 * findOne() would return whichever document the query planner produced first.
 * That is a cross-tenant hole, not a cosmetic bug: the just-in-time path below
 * faithfully stamps User.schoolId from the resolved record, so picking the
 * wrong Student hands the caller a working account in the wrong school. The JIT
 * tenant logic cannot repair this after the fact.
 *
 * So: no match -> null (caller falls through to other lookups). One school ->
 * safe to proceed. More than one school -> fail closed.
 *
 * The caller must still apply its own no-school guard; a single unambiguous
 * match with no schoolId is returned as-is and rejected there.
 */
const resolveUnambiguousBySchool = async (Model, searchRegex) => {
  const matches = await Model.find({
    $or: [
      { "personalInfo.stdId": searchRegex },
      { "personalInfo.username": searchRegex },
    ],
  })
    // Must cover everything the caller reads downstream: the just-in-time path
    // needs schoolId, the password and the real contact address. Projecting
    // these away would silently fall back to default123 and a synthetic key.
    .select(
      "schoolId personalInfo.stdId personalInfo.username personalInfo.password personalInfo.contactDetails"
    )
    .lean();

  if (matches.length === 0) return { record: null };

  const distinctSchools = new Set(
    matches.map((m) => (m.schoolId ? String(m.schoolId) : ""))
  );

  if (distinctSchools.size > 1) {
    return { ambiguous: true, schoolCount: distinctSchools.size };
  }

  return { record: matches[0] };
};

exports.login = async (req, res) => {
  try {

    const { email, password, employeeId, role } = req.body;
    const loginId = String(email || employeeId || "").trim();

    console.log("LOGIN BODY:", req.body);

    // 1️⃣ Check login id & password exist
    if (!loginId || !password) {
      console.log("LOGIN ID OR PASSWORD MISSING");
      return res.status(400).json({
        message: "Email, employee ID, or username and password are required",
      });
    }

    // 2️⃣ Check role is provided
    if (!role || typeof role !== "string" || !role.trim()) {
      console.log("ROLE IS MISSING");
      return res.status(400).json({
        message: "Please select your role before logging in.",
      });
    }

    // 3️⃣ Find user
    let user = await User.findOne({ email: loginId }).populate("roleId");
    if (!user && loginId.includes("@")) {
      user = await User.findOne({ email: loginId.toLowerCase() }).populate("roleId");
    }

    if (!user) {
      const platformAdmin = await findPlatformAdminByEmployeeId(loginId);
      if (platformAdmin?.userId) {
        user = await User.findById(platformAdmin.userId).populate("roleId");
      }
    }

    // Fallback logic if user not found by email or employee ID
    if (!user) {
      const isParentID = loginId.toUpperCase().startsWith("PRN-");
      const isStudentID = loginId.toUpperCase().startsWith("STD-");

      const Role = require("../models/Role");
      const Student = require("../modules/student/studentModels");
      const Parent = require("../modules/parents/parentModel");
      const AdmissionApplication = require("../modules/admission/admissionApplicationModel");
      const { getPersonForHolder, normalizeParentIdAccountHolder } = require("../modules/admission/parentAccountUtils");

      if (isStudentID || (!isParentID && !isStudentID)) {
        // --- STUDENT FALLBACK ---
        // Escape special regex characters in loginId and construct a case-insensitive exact match regex
        const searchRegex = new RegExp(`^${loginId.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i');
        let student = null;
        let ambiguousSchool = null;

        // stdId and username are each unique only within a school, so a single
        // findOne() could resolve a record belonging to a different school than
        // the one the caller meant. Refuse when the id is not tenant-unique.
        const studentResolution = await resolveUnambiguousBySchool(Student, searchRegex);
        if (studentResolution.ambiguous) {
          ambiguousSchool = studentResolution;
        } else {
          student = studentResolution.record;
        }

        if (!student && !ambiguousSchool) {
          const applicationResolution = await resolveUnambiguousBySchool(
            AdmissionApplication,
            searchRegex
          );
          if (applicationResolution.ambiguous) {
            ambiguousSchool = applicationResolution;
          } else {
            student = applicationResolution.record;
          }
        }

        if (ambiguousSchool) {
          // Fail closed. Guessing a tenant here would issue a working login in
          // the wrong school. The count is reported so the failure is
          // diagnosable, but never the school ids themselves.
          console.error(
            `Refusing ambiguous student login for ${loginId}: matches ${ambiguousSchool.schoolCount} schools`
          );
          return res.status(409).json({
            message:
              "This login ID is not unique - it is used by students in more than one school. Log in with your email address, or use your school's own sign-in page.",
          });
        }

        if (student) {
          const studentRole = await Role.findOne({ name: 'student' });
          if (studentRole) {
            user = await User.findOne({ refId: student._id, roleId: studentRole._id }).populate("roleId");
            
            if (!user) {
              // A login account with no school cannot reach any school data —
              // requireSchoolContext refuses every request for it. Refuse to
              // mint one rather than create an account that is dead on arrival.
              const studentSchoolId = student.schoolId;
              if (!studentSchoolId) {
                console.error(
                  `Refusing just-in-time student user creation for ${loginId}: source record has no schoolId`
                );
              } else {
                console.log(`Just-in-time student user creation: ${loginId}`);
                const loginEmail = await resolveJitLoginEmail({
                  // The Student schema has never had a `contactInfo` field, so
                  // the old `contactInfo?.email` read was permanently undefined
                  // and every login fell through to the placeholder username.
                  // The real address lives at personalInfo.contactDetails.email.
                  preferredEmail: student.personalInfo?.contactDetails?.email,
                  kind: "student",
                  schoolId: studentSchoolId,
                  seed:
                    student.personalInfo?.stdId ||
                    student.personalInfo?.username ||
                    student._id,
                });
                user = await User.create({
                  name: student.personalInfo?.name || "Student",
                  email: loginEmail,
                  password: student.personalInfo?.password || "default123",
                  roleId: studentRole._id,
                  refId: student._id,
                  schoolId: studentSchoolId,
                  status: 'active'
                });
                user.roleId = studentRole;
              }
            }
          }
        }
      }

      if (!user && (isParentID || (!isParentID && !isStudentID))) {
        // --- PARENT FALLBACK ---
        let parent = await Parent.findOne({ parentId: loginId });
        let application = null;

        if (!parent) {
          // Check AdmissionApplication by parentId
          application = await AdmissionApplication.findOne({ "parents.parentId": loginId });

          // If not found by parentId, try matching generated PRN-ADM- or PRN-SIS- pattern
          if (!application && isParentID) {
            const shortId = loginId.split("-").pop().toLowerCase();
            if (loginId.startsWith("PRN-SIS-")) {
              const allParents = await Parent.find({}).select("_id").lean();
              const matchingParent = allParents.find(p => p._id.toString().toLowerCase().endsWith(shortId));
              if (matchingParent) parent = await Parent.findById(matchingParent._id);
            } else if (loginId.startsWith("PRN-ADM-")) {
              const allApps = await AdmissionApplication.find({}).select("_id").lean();
              const matchingApp = allApps.find(app => app._id.toString().toLowerCase().endsWith(shortId));
              if (matchingApp) application = await AdmissionApplication.findById(matchingApp._id);
            }
          }
        }

        const parentRole = await Role.findOne({ name: 'parent' });
        if (parentRole) {
          const refId = parent?._id || application?._id;
          if (refId) {
            user = await User.findOne({ refId, roleId: parentRole._id }).populate("roleId");

            if (!user) {
              // refId may point at a Parent or at an AdmissionApplication. Only
              // those two relationships are accepted as evidence of ownership —
              // never a name, address or matching identifier. When neither
              // record carries a school the account is refused rather than
              // created without one.
              const parentSchoolId = parent?.schoolId || application?.schoolId;
              if (!parentSchoolId) {
                console.error(
                  `Refusing just-in-time parent user creation for ${loginId}: source record has no schoolId`
                );
              } else {
                console.log(`Just-in-time parent user creation: ${loginId}`);
                const appParents = application?.parents;
                let admissionAccountName = null;
                if (appParents) {
                  const holder = normalizeParentIdAccountHolder(
                    appParents.parentIdAccountHolder,
                    appParents
                  );
                  const person = getPersonForHolder(appParents, holder);
                  admissionAccountName =
                    (person.name && String(person.name).trim()) || null;
                }
                // The identifier itself is kept as the login key when it is
                // free, so parents keep signing in exactly as before; it is only
                // replaced when another school already holds the same ID.
                const loginEmail = await resolveJitLoginEmail({
                  preferredEmail: loginId,
                  kind: "parent",
                  schoolId: parentSchoolId,
                  seed:
                    parent?.parentId ||
                    application?.applicationId ||
                    refId,
                });
                user = await User.create({
                  name:
                    parent?.name ||
                    admissionAccountName ||
                    application?.parents?.father?.name ||
                    application?.parents?.mother?.name ||
                    application?.parents?.guardian?.name ||
                    "Parent",
                  email: loginEmail,
                  password: parent?.password || "default123",
                  roleId: parentRole._id,
                  refId: refId,
                  schoolId: parentSchoolId,
                  status: 'active'
                });
                user.roleId = parentRole;
              }
            }
          }
        }
      }

      if (!user) {
        // --- STAFF FALLBACK ---
        const Staff = require("../modules/staff/staffModels");
        const staff = await Staff.findOne({
          $or: [
            { "personalInfo.staffId": loginId },
            { "personalInfo.username": loginId },
            { "personalInfo.email": loginId }
          ]
        });

        if (staff) {
          const normalizedStaffRole = (staff.personalInfo?.role || "").toLowerCase();
          let roleName = "staff";

          if (normalizedStaffRole === "teacher") roleName = "teacher";
          else if (normalizedStaffRole === "admin") {
            // Platform admins must be created via superadmin identity — no JIT admin users
            roleName = null;
          } else if (normalizedStaffRole === "hr") roleName = "hr";
          else if (normalizedStaffRole === "receptionist") roleName = "receptionist";
          else if (normalizedStaffRole === "admission") roleName = "admission";
          else if (normalizedStaffRole === "transport") roleName = "transport";

          const staffRole = roleName ? await Role.findOne({ name: roleName }) : null;
          if (staffRole) {
            user = await User.findOne({ refId: staff._id, roleId: staffRole._id }).populate("roleId");

            const staffSchoolId = staff.schoolId;

            // Repair accounts minted before schoolId was recorded. An existing
            // schoolId is never overwritten — that could relocate a live account
            // into a different school. No trustworthy Staff school means we leave
            // it null so every tenant-scoped route keeps refusing the account.
            if (
              user &&
              !user.schoolId &&
              staffSchoolId &&
              mongoose.isValidObjectId(String(staffSchoolId))
            ) {
              user.schoolId = staffSchoolId;
              await user.save();
              console.log(`Repaired missing schoolId on staff login account: ${loginId}`);
            }

            if (!user) {
              if (!staffSchoolId) {
                console.error(
                  `Refusing just-in-time staff user creation for ${loginId}: source record has no schoolId`
                );
              } else {
                console.log(`Just-in-time staff user creation: ${loginId}`);
                const loginEmail = await resolveJitLoginEmail({
                  preferredEmail: staff.personalInfo?.email,
                  kind: "staff",
                  schoolId: staffSchoolId,
                  seed:
                    staff.personalInfo?.staffId ||
                    staff.personalInfo?.username ||
                    staff._id,
                });
                user = await User.create({
                  name: staff.personalInfo?.name || "Staff",
                  email: loginEmail,
                  password: staff.personalInfo?.password || "default123",
                  roleId: staffRole._id,
                  refId: staff._id,
                  schoolId: staffSchoolId,
                  status: 'active'
                });
                user.roleId = staffRole;
              }
            }
          }
        }
      }
    }

    console.log("USER FOUND:", user);

    if (!user) {
      console.log("USER NOT FOUND");
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("PASSWORD WRONG");
      if (user.authProvider === "google") {
        return res.status(401).json({
          message:
            "Invalid credentials. Sign in with Google or use the password you set during onboarding.",
        });
      }
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const roleId = user.roleId?._id;
    const roleName = user.roleId?.name || "";
    const normalizedRole = roleName.toLowerCase();
    const normalizedSelectedRole = String(role).trim().toLowerCase();

    // 4️⃣ Verify selected role matches the user's role
    if (normalizedRole !== normalizedSelectedRole) {
      console.log(`ROLE MISMATCH: account role=${normalizedRole}, selected role=${normalizedSelectedRole}`);
      return res.status(401).json({
        message: "The selected role does not match this account.",
      });
    }

    let adminCheck = null;

    if (normalizedRole === "admin") {
      adminCheck = await validatePlatformAdminForLogin(user);
      if (!adminCheck.ok) {
        return res.status(adminCheck.status).json({ message: adminCheck.message });
      }
    } else if (user.status === "inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Contact your administrator.",
      });
    }

    console.log("ROLE:", roleName);

    let permissions = [];
    let platformPermissions = null;
    let platformAdminProfile = null;

    if (normalizedRole === "admin" && adminCheck?.platformAdmin) {
      platformPermissions = adminCheck.platformAdmin.permissions || [];
      platformAdminProfile = {
        adminType: adminCheck.platformAdmin.adminType,
        employeeId: adminCheck.platformAdmin.employeeId,
        school: adminCheck.platformAdmin.school,
        campus: adminCheck.platformAdmin.campus,
        scope: adminCheck.platformAdmin.scope,
      };
      permissions = flattenPlatformPermissions(platformPermissions);
    } else {
      const rolePermissions = await RolePermission
        .find({ roleId })
        .populate("permissionId");

      permissions = rolePermissions.map((rp) => rp.permissionId.name);
    }

    console.log("PERMISSIONS:", permissions);

    const sessionId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const token = jwt.sign(
      {
        userId: user._id,
        role: roleName,
        refId: user.refId,
        // Informational only. authMiddleware re-resolves schoolId from the user
        // document on every request, so the token is never the authority.
        schoolId: user.schoolId || null,
        sessionId,
      },
      process.env.JWT_SECRET || "fallback_secret_key",
      { expiresIn: "7d" }
    );

    const newSession = {
      sessionId,
      token,
      createdAt: new Date(),
      expiresAt,
      device: req.headers["user-agent"] || "Unknown",
      ip: req.ip || req.connection?.remoteAddress || null,
    };

    // Replace the previous active session with the new session
    await User.findByIdAndUpdate(
      user._id,
      {
        $set: {
          lastLogin: new Date(),
          activeSession: newSession,
        },
      },
      { new: true }
    );

    const response = {
      success: true,
      token,
      role: roleName,
      permissions,
      platformPermissions,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: roleName,
        refId: user.refId,
        // Informational only, so the client can tell which school the session
        // belongs to. The backend never treats this as authorization.
        schoolId: user.schoolId || null,
        authProvider: user.authProvider,
        ...(platformAdminProfile || {}),
      },
    };

    if (normalizedRole === "admin") {
      try {
        const session = await buildOnboardingSessionPayload(user._id);
        Object.assign(response, session);
      } catch (sessionError) {
        console.error("onboarding session load error:", sessionError);
      }
    }

    return res.json(response);

  } catch (error) {

    console.error("Login Error:", error);

    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};

exports.logout = async (req, res) => {
  try {
    let userId = req.user?.userId;
    let sessionId = req.user?.sessionId;

    if (!userId && req.headers.authorization?.startsWith("Bearer ")) {
      try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret_key");
        userId = decoded?.userId;
        sessionId = decoded?.sessionId;
      } catch (e) {
        // Token might already be expired or invalid
      }
    }

    if (userId) {
      if (sessionId) {
        // Only clear if the session being logged out matches the active session
        await User.updateOne(
          { _id: userId, "activeSession.sessionId": sessionId },
          { $set: { activeSession: null } }
        );
      } else {
        // Legacy fallback
        await User.updateOne(
          { _id: userId },
          { $set: { activeSession: null } }
        );
      }
    }

    return res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.checkUser = async (req, res) => {
  try {
    const result = await checkUserExists(req.body?.email);
    return res.json({ success: true, ...result });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Could not check user",
    });
  }
};

exports.register = async (req, res) => {
  try {
    const result = await registerWithEmail(req.body);
    return res.json({ success: true, ...result });
  } catch (error) {
    console.error("register error:", error);
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Registration failed",
      code: error.code,
      fieldErrors: error.fieldErrors,
      errors: error.errors,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({
        success: false,
        message: `New password must be at least ${PASSWORD_MIN_LENGTH} characters`,
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password",
      });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    return res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("changePassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update password",
    });
  }
};
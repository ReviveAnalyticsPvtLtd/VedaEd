const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Parent = require("./parentModel");
const path = require("path");
const fs = require("fs");
const Student = require("../student/studentModels");
const AdmissionApplication = require("../admission/admissionApplicationModel");
const {
  normalizeParentIdAccountHolder,
  getPersonForHolder,
  displayRoleForHolder,
  validateParentAccountForHolder,
} = require("../admission/parentAccountUtils");
const { generateNextParentId, peekNextParentId } = require("../../utils/parentIdGenerator");
const UPLOADS_DIR = path.resolve(__dirname, "../../../public/uploads");

const safeDocumentPath = (filename) => {
  const normalizedFilename = path.basename(filename);
  return path.join(UPLOADS_DIR, normalizedFilename);
};

function flattenParentAddress(parentDoc) {
  if (!parentDoc) return "";
  if (typeof parentDoc.address === "string" && String(parentDoc.address).trim()) {
    return String(parentDoc.address).trim();
  }
  const ci = parentDoc.contactInfo;
  if (ci) {
    const parts = [ci.address, ci.city, ci.state, ci.zip || ci.zipCode].filter(
      (x) => x != null && String(x).trim() !== ""
    );
    if (parts.length) return parts.join(", ");
  }
  const pa = parentDoc.permanentAddress;
  if (pa && typeof pa === "object") {
    const parts = [pa.line1, pa.line2, pa.city, pa.state, pa.pincode].filter(
      (x) => x != null && String(x).trim() !== ""
    );
    if (parts.length) return parts.join(", ");
  }
  return "";
}

/** Maps populated or admission-shaped student rows for admin ParentProfile + legacy childDetails. */
function mapChildrenForParentProfile(children = []) {
  return (children || []).map((child) => {
    const pi = child.personalInfo || {};
    const classVal = pi.class;
    let grade = "N/A";
    if (classVal && typeof classVal === "object" && classVal.className != null) {
      grade = String(classVal.className);
    } else if (classVal != null && String(classVal).trim() !== "") {
      grade = String(classVal);
    }
    const secVal = pi.section;
    let section = "N/A";
    if (secVal && typeof secVal === "object" && secVal.sectionName != null) {
      section = String(secVal.sectionName);
    } else if (secVal != null && String(secVal).trim() !== "") {
      section = String(secVal);
    }
    return {
      name: pi.name || child.name || "Student",
      grade,
      section,
      stdId: pi.stdId || child.stdId,
      rollNo: pi.rollNo || child.rollNo || "N/A",
      attendance: "95%",
      feeStatus: "Paid",
    };
  });
}

/** Admission-linked parent: only explicit `parentProfilePhoto` upload — never student passport docs. */
function resolveParentProfilePhotoFromApplication(application) {
  const custom = application?.parentProfilePhoto && String(application.parentProfilePhoto).trim();
  return custom || "";
}

function pickPhotoPathFromParentDocuments(parentDoc) {
  if (!parentDoc?.documents?.length) return "";
  const docs = parentDoc.documents.filter((d) => d && String(d.path || "").trim());
  if (!docs.length) return "";
  const isImageDoc = (d) => {
    const p = String(d.path || "");
    const n = String(d.name || "").toLowerCase();
    const ft = String(d.fileType || "").toLowerCase();
    return (
      ft.startsWith("image/") ||
      /\.(jpe?g|png|gif|webp|bmp)$/i.test(p) ||
      n.includes("photo") ||
      n.includes("passport")
    );
  };
  const pick = docs.find(isImageDoc) || docs[0];
  return pick ? String(pick.path).trim() : "";
}

function resolveParentProfilePhotoFromParentDoc(parentDoc) {
  const custom = parentDoc?.profilePhoto && String(parentDoc.profilePhoto).trim();
  if (custom) return custom;
  return pickPhotoPathFromParentDocuments(parentDoc);
}

/** Parse `adm-<mongoId>` or legacy `adm-<mongoId>-f|m|g` from parent dashboard routes. */
function parseAdmissionSyntheticParentRouteId(id) {
  if (!id || typeof id !== "string" || !id.startsWith("adm-")) return null;
  const rest = id.slice(4);
  const m = rest.match(/^([a-f\d]{24})(?:-([fmg]))?$/i);
  if (!m) return null;
  return { applicationId: m[1], legacySuffix: m[2] ? m[2].toLowerCase() : null };
}

function legacySuffixToHolder(suffix) {
  if (suffix === "f") return "father";
  if (suffix === "m") return "mother";
  if (suffix === "g") return "guardian";
  return null;
}

/** Admission synthetic route id `adm-<applicationObjectId>` → same shape as getParentbyId uses internally. */
function buildSyntheticParentDocFromRoute(routeId, application) {
  if (!application || !routeId) return null;
  const parsed = parseAdmissionSyntheticParentRouteId(routeId);
  if (!parsed) return null;

  const legacyHolder = legacySuffixToHolder(parsed.legacySuffix);
  const holder = legacyHolder || normalizeParentIdAccountHolder(
    application.parents?.parentIdAccountHolder,
    application.parents || {}
  );
  const person = getPersonForHolder(application.parents || {}, holder);
  const name =
    (person.name && String(person.name).trim()) ||
    (holder === "father"
      ? (application.parents?.father?.name || application.personalInfo?.fatherName || application.fatherName)
      : holder === "mother"
        ? (application.parents?.mother?.name || application.personalInfo?.motherName || application.motherName)
        : (application.parents?.guardian?.name || "Guardian"));

  const relLabel = displayRoleForHolder(application.parents || {}, holder);
  return {
    _id: routeId,
    name,
    email: person.email || application.contactInfo?.email || "",
    phone: person.phone || application.contactInfo?.phone || "",
    parentId: application.parents?.parentId || `PRN-ADM-${parsed.applicationId.slice(-6).toUpperCase()}`,
    status: "Active",
    role: relLabel,
    relation: relLabel,
    occupation: person.occupation || "",
    password: "default123",
    address: application.contactInfo?.address,
    contactInfo: application.contactInfo,
    photo: resolveParentProfilePhotoFromApplication(application),
    children: [
      {
        personalInfo: {
          stdId: application.personalInfo?.stdId,
          name: application.personalInfo?.name,
          class:
            application.personalInfo?.classApplied ||
            application.personalInfo?.class ||
            "",
          section: application.personalInfo?.section || "",
          rollNo: application.personalInfo?.rollNo || "",
        },
      },
    ],
  };
}

/** Shared GET/PUT response body for ParentProfile.jsx (matches getParentbyId success payload). */
function formatParentProfileApiData(parentDoc) {
  const mappedChildren = mapChildrenForParentProfile(parentDoc.children);
  const displayName =
    (parentDoc.name && String(parentDoc.name).trim()) ||
    (parentDoc.fatherName && String(parentDoc.fatherName).trim()) ||
    (parentDoc.motherName && String(parentDoc.motherName).trim()) ||
    "N/A";
  const displayEmail =
    (parentDoc.email != null && String(parentDoc.email).trim()) ||
    (parentDoc.contactDetails?.email && String(parentDoc.contactDetails.email).trim()) ||
    "N/A";
  const displayPhone =
    (parentDoc.phone != null && String(parentDoc.phone).trim()) ||
    (parentDoc.contactDetails?.phone && String(parentDoc.contactDetails.phone).trim()) ||
    (parentDoc.fatherNumber != null && String(parentDoc.fatherNumber).trim()) ||
    (parentDoc.motherNumber != null && String(parentDoc.motherNumber).trim()) ||
    "N/A";
  const displayOccupation =
    (parentDoc.occupation != null && String(parentDoc.occupation).trim()) ||
    (parentDoc.fatherOccupation != null && String(parentDoc.fatherOccupation).trim()) ||
    "N/A";
  const displayRelation =
    (parentDoc.relation != null && String(parentDoc.relation).trim()) ||
    (parentDoc.role != null && String(parentDoc.role).trim()) ||
    "N/A";
  const displayAddress = flattenParentAddress(parentDoc);

  return {
    _id: parentDoc._id,
    parentId: parentDoc.parentId,
    name: displayName,
    email: displayEmail,
    phone: displayPhone,
    occupation: displayOccupation,
    relation: displayRelation,
    address: displayAddress || "N/A",
    status: parentDoc.status || "Active",
    role: parentDoc.role,
    photo: parentDoc.photo || "",
    children: mappedChildren.map((c) => ({
      name: c.name,
      grade: c.grade,
      section: c.section,
      stdId: c.stdId,
    })),
    username: parentDoc.parentId,
    password: parentDoc.password,
    fatherName: parentDoc.fatherName || parentDoc.name || "N/A",
    fatherOccupation: parentDoc.occupation || parentDoc.fatherOccupation || "Parent",
    fatherNumber: parentDoc.phone || parentDoc.fatherNumber || "N/A",
    motherName: parentDoc.motherName || "N/A",
    motherOccupation: parentDoc.motherOccupation || "Home Maker",
    motherNumber: parentDoc.motherNumber || "N/A",
    emergencyContact: parentDoc.emergencyContact || parentDoc.phone || "N/A",
    permanentAddress: parentDoc.permanentAddress || {
      line1: parentDoc.address || displayAddress || "N/A",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
    currentAddress: parentDoc.currentAddress || {
      line1: parentDoc.address || displayAddress || "N/A",
      line2: "",
      city: "",
      state: "",
      pincode: "",
    },
    childDetails: mappedChildren.map((c) => ({
      name: c.name,
      class: c.grade,
      section: c.section,
      rollNo: c.rollNo,
      stdId: c.stdId,
      attendance: c.attendance,
      feeStatus: c.feeStatus,
    })),
  };
}

exports.createParents = async (req, res) => {
  const { name, email, phone, parentId, linkedStudentId = [], status, password, role } = req.body;

  let finalParentId = parentId;
  if (!finalParentId) {
    try {
      finalParentId = await generateNextParentId();
    } catch (err) {
      console.error("Error generating parent ID:", err);
      return res.status(500).json({ success: false, message: "Error generating Parent ID" });
    }
  }

  try {
    if (!email || !name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields missing",
      });
    }

    // Creating parent (without linkedStudentId — only real children will be stored)
    const parent = await Parent.create({
      name,
      email,
      phone,
      parentId: finalParentId,
      password,
      status,
      role,
      children: [] // will push actual student IDs below
    });

    // If linkedStudentId provided → find matching students and link them
    if (linkedStudentId.length > 0) {
      console.log("Looking for students with IDs:", linkedStudentId);
      const students = await Student.find({
        "personalInfo.stdId": { $in: linkedStudentId },
      });
      console.log("Found students:", students);

      if (students.length > 0) {
        await Student.updateMany(
          { _id: { $in: students.map(s => s._id) } },
          { $set: { parent: parent._id } }
        );

        parent.children.push(...students.map(s => s._id));
        await parent.save();
        console.log("Linked students to parent:", parent.children);
      } else {
        console.log("No students found with provided stdIds:", linkedStudentId);
      }
    }
    // Fetch parent with populated children
    const newParent = await Parent.findById(parent._id).populate("children", 'personalInfo.stdId');
    console.log("Populated newParent:", JSON.stringify(newParent, null, 2));

    // response object (desired fields + unhashed password)
    const data = {
      _id: newParent._id,
      name: newParent.name,
      email: newParent.email,
      phone: newParent.phone,
      parentId: newParent.parentId,
      status: newParent.status,
      role: newParent.role,
      createdAt: newParent.createdAt,
      updatedAt: newParent.updatedAt,
      children: newParent.children && newParent.children.length > 0 ? newParent.children.map(child => ({
        stdId: child.personalInfo?.stdId // pick only stdId
      })) : [],
      password: password // unhashed password returning
    };
    console.log("Final response data:", JSON.stringify(data, null, 2));

    res.status(201).json({
      success: true,
      message: "Parent created successfully",
      parent: data
    });

    // Create User record for auth
    try {
      const roleDoc = await require('../../models/Role').findOne({ name: 'parent' });
      if (roleDoc) {
        await require('../../models/User').create({
          name: name,
          email: email || finalParentId,
          password: password, // bcrypt hashing is handled by User model pre-save hook
          roleId: roleDoc._id,
          refId: parent._id,
          status: 'active'
        });
        console.log("Auth User created for parent");
      }
    } catch (err) {
      console.error("Auth User creation failed for parent:", err.message);
    }

  } catch (error) {
    console.log("Error creating parent:", error.message);
    res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

exports.getAllParents = async (req, res) => {
  try {
    const { keyword, role } = req.query;
    let query = {};
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { parentId: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (role && role !== "All Roles") {
      query.role = role;
    }

    const [parentList, admissionDocs] = await Promise.all([
      Parent.find(query).populate("children", "personalInfo.stdId").lean(),
      AdmissionApplication.find({
        "personalInfo.fees": { $regex: /^paid$/i },
        ...(keyword ? {
          $or: [
            { "parents.father.name": { $regex: keyword, $options: 'i' } },
            { "parents.father.email": { $regex: keyword, $options: 'i' } },
            { "parents.father.phone": { $regex: keyword, $options: 'i' } },
            { "parents.mother.name": { $regex: keyword, $options: 'i' } },
            { "parents.mother.email": { $regex: keyword, $options: 'i' } },
            { "parents.mother.phone": { $regex: keyword, $options: 'i' } },
            { "parents.guardian.name": { $regex: keyword, $options: 'i' } },
            { "parents.guardian.email": { $regex: keyword, $options: 'i' } },
            { "parents.guardian.phone": { $regex: keyword, $options: 'i' } },
            { "personalInfo.fatherName": { $regex: keyword, $options: 'i' } },
            { "personalInfo.motherName": { $regex: keyword, $options: 'i' } },
            { "parents.parentId": { $regex: keyword, $options: 'i' } },
            { "personalInfo.name": { $regex: keyword, $options: 'i' } }
          ]
        } : {})
      }).lean()
    ]);

    const formattedSISParents = parentList.map(parent => ({
      _id: parent._id,
      name: parent.name,
      email: parent.email,
      phone: parent.phone,
      parentId: parent.parentId || `PRN-SIS-${parent._id.toString().slice(-6).toUpperCase()}`,
      password: parent.password || "default123", // Added for login management
      status: parent.status,
      role: parent.role,
      source: "SIS",
      createdAt: parent.createdAt,
      updatedAt: parent.updatedAt,
      photo: resolveParentProfilePhotoFromParentDoc(parent),
      children: parent.children.length > 0 ? parent.children.map(child => ({
        stdId: child.personalInfo?.stdId
      })) : []
    }));

    const admissionParents = [];
    admissionDocs.forEach(app => {
      const studentName = app.personalInfo?.name || "Unknown Student";
      const stdId = app.personalInfo?.stdId || "N/A";
      const pId = app.parents?.parentId || `PRN-ADM-${app._id.toString().slice(-6).toUpperCase()}`;

      const holder = normalizeParentIdAccountHolder(
        app.parents?.parentIdAccountHolder,
        app.parents || {}
      );
      const person = getPersonForHolder(app.parents || {}, holder);
      const name =
        (person.name && String(person.name).trim()) ||
        (holder === "father"
          ? (app.personalInfo?.fatherName || app.fatherName)
          : holder === "mother"
            ? (app.personalInfo?.motherName || app.motherName)
            : "") ||
        (app.parents?.guardian?.name && String(app.parents.guardian.name).trim());

      if (!name || !String(name).trim()) {
        return;
      }

      admissionParents.push({
        _id: `adm-${app._id}`,
        name: String(name).trim(),
        email: person.email || "N/A",
        phone: person.phone || app.contactInfo?.phone || "N/A",
        parentId: pId,
        password: "default123",
        status: "Active",
        role: displayRoleForHolder(app.parents || {}, holder),
        source: "Admission",
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        photo: resolveParentProfilePhotoFromApplication(app),
        children: [{ stdId, name: studentName }],
      });
    });

    // Filter admission parents by role if requested
    let filteredAdmissionParents = admissionParents;
    if (role && role !== "All Roles") {
        const rLower = role.toLowerCase();
        filteredAdmissionParents = admissionParents.filter(p => {
            const pRole = p.role.toLowerCase();
            // Map Father/Mother to Primary/Secondary if needed or just match directly
            if (rLower === "primary guardian") {
                return pRole === "father" || pRole === "primary guardian";
            }
            if (rLower === "secondary guardian") {
                return pRole === "mother" || pRole === "secondary guardian";
            }
            return pRole === rLower;
        });
    }

    const mergedParents = [...formattedSISParents, ...filteredAdmissionParents];

    res.status(200).json({
      success: true,
      parents: mergedParents,
    });
  } catch (error) {
    console.error("Error fetching parents:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

exports.getParentbyId = async (req, res) => {
  const { id } = req.params;
  try {
    if (!id) {
      return res.status(404).json({
        success: false,
        message: "ID invalid/missing",
      });
    }

    let parentDoc;
    if (id.startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(id);
      if (!parsed) {
        return res.status(404).json({ success: false, message: "Invalid admission parent id" });
      }
      const application = await AdmissionApplication.findById(parsed.applicationId).lean();
      if (!application) {
        return res.status(404).json({ success: false, message: "Parent not found in Admissions" });
      }

      parentDoc = buildSyntheticParentDocFromRoute(id, application);
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      parentDoc = await Parent.findById(id).populate({
        path: 'children',
        populate: [
          { path: 'personalInfo.class', select: 'name' },
          { path: 'personalInfo.section', select: 'name' }
        ]
      }).lean();

      if (parentDoc) {
        parentDoc.photo = resolveParentProfilePhotoFromParentDoc(parentDoc);
      }

      if (!parentDoc) {
        // Try finding in AdmissionApplication
        const application = await AdmissionApplication.findById(id).lean();
        if (application) {
          const holder = normalizeParentIdAccountHolder(
            application.parents?.parentIdAccountHolder,
            application.parents || {}
          );
          const person = getPersonForHolder(application.parents || {}, holder);
          const accName =
            (person.name && String(person.name).trim()) ||
            application.parents?.father?.name ||
            application.personalInfo?.fatherName ||
            "N/A";
          const relLabel = displayRoleForHolder(application.parents || {}, holder);
          parentDoc = {
            _id: application._id,
            name: accName,
            fatherName: application.parents?.father?.name || application.personalInfo?.fatherName,
            motherName: application.parents?.mother?.name || application.personalInfo?.motherName,
            email: person.email || application.parents?.father?.email || application.parents?.mother?.email || application.contactInfo?.email,
            phone: person.phone || application.parents?.father?.phone || application.parents?.mother?.phone || application.contactInfo?.phone,
            occupation: person.occupation || "",
            relation: relLabel,
            role: relLabel,
            parentId: application.parents?.parentId || `PRN-ADM-${application._id.toString().slice(-6).toUpperCase()}`,
            password: "default123",
            address: application.contactInfo?.address,
            contactInfo: application.contactInfo,
            photo: resolveParentProfilePhotoFromApplication(application),
            children: [
              {
                personalInfo: {
                  stdId: application.personalInfo?.stdId,
                  name: application.personalInfo?.name,
                  class:
                    application.personalInfo?.classApplied ||
                    application.personalInfo?.class ||
                    "",
                  section: application.personalInfo?.section || "",
                  rollNo: application.personalInfo?.rollNo || "",
                },
              },
            ],
          };
        }
      }
    }

    if (!parentDoc) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    const data = formatParentProfileApiData(parentDoc);

    res.status(200).json({
      success: true,
      parent: data
    });

  } catch (error) {
    console.error("Error Viewing parent Profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.updateParent = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "ID invalid/missing",
      });
    }

    if (id.startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(id);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid admission parent id" });
      }

      const application = await AdmissionApplication.findById(parsed.applicationId);
      if (!application) {
        return res.status(404).json({
          success: false,
          message: "Parent not found in Admissions",
        });
      }

      const legacyHolder = legacySuffixToHolder(parsed.legacySuffix);
      const existingParents = application.parents?.toObject
        ? application.parents.toObject()
        : application.parents || {};
      const existingContact = application.contactInfo?.toObject
        ? application.contactInfo.toObject()
        : application.contactInfo || {};

      const holder = legacyHolder || normalizeParentIdAccountHolder(
        existingParents.parentIdAccountHolder,
        existingParents
      );
      const personKey =
        holder === "mother" ? "mother" : holder === "guardian" ? "guardian" : "father";

      const mergedParents = {
        ...existingParents,
        father: { ...(existingParents.father || {}) },
        mother: { ...(existingParents.mother || {}) },
        guardian: { ...(existingParents.guardian || {}) },
      };

      const prevPerson = { ...(mergedParents[personKey] || {}) };
      if (updateData.name !== undefined) prevPerson.name = updateData.name;
      if (updateData.occupation !== undefined) prevPerson.occupation = updateData.occupation;
      if (updateData.email !== undefined) prevPerson.email = updateData.email;
      if (updateData.phone !== undefined) prevPerson.phone = updateData.phone;
      if (personKey === "guardian" && updateData.relation !== undefined) {
        prevPerson.relation = updateData.relation;
      }
      mergedParents[personKey] = prevPerson;

      if (updateData.parentId !== undefined && String(updateData.parentId || "").trim() !== "") {
        mergedParents.parentId = String(updateData.parentId).trim();
      }

      mergedParents.parentIdAccountHolder = normalizeParentIdAccountHolder(
        mergedParents.parentIdAccountHolder ?? existingParents.parentIdAccountHolder,
        mergedParents
      );

      const accErr = validateParentAccountForHolder(
        mergedParents,
        mergedParents.parentIdAccountHolder
      );
      if (accErr) {
        return res.status(400).json({ success: false, message: accErr });
      }

      const mergedContact = { ...existingContact };
      if (updateData.email !== undefined) mergedContact.email = updateData.email;
      if (updateData.phone !== undefined) mergedContact.phone = updateData.phone;
      if (updateData.address !== undefined) mergedContact.address = updateData.address;

      try {
        await AdmissionApplication.findByIdAndUpdate(
          parsed.applicationId,
          { $set: { parents: mergedParents, contactInfo: mergedContact } },
          { new: true, runValidators: true }
        );
      } catch (dbErr) {
        console.error("Admission parent profile update failed:", dbErr);
        return res.status(400).json({
          success: false,
          message: dbErr.message || "Failed to save admission parent profile",
        });
      }

      const fresh = await AdmissionApplication.findById(parsed.applicationId).lean();
      const syntheticDoc = buildSyntheticParentDocFromRoute(id, fresh);
      const out = formatParentProfileApiData(syntheticDoc);
      return res.status(200).json({ success: true, parent: out });
    }

    const parentExist = await Parent.findById(id);
    if (!parentExist) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    let unhashedPassword = null;
    if (updateData.password) {
      const pw = String(updateData.password);
      const looksLikeBcryptHash =
        pw.startsWith("$2a$") ||
        pw.startsWith("$2b$") ||
        pw.startsWith("$2y$");
      // Client often echoes the stored hash; never re-hash that or login breaks.
      if (looksLikeBcryptHash) {
        delete updateData.password;
      } else {
        unhashedPassword = pw;
        updateData.password = await bcrypt.hash(unhashedPassword, 10);
      }
    }

    const updatedParent = await Parent.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("children")
      .lean();
    // console.log("updatedParent:", updatedParent);

    if (!updatedParent) {
      return res.status(404).json({
        success: false,
        message: "Update failed, parent not found",
      });
    }

    const responseData = {
      _id: updatedParent._id,
      name: updatedParent.name,
      email: updatedParent.email,
      phone: updatedParent.phone,
      parentId: updatedParent.parentId,
      status: updatedParent.status,
      role: updatedParent.role,
      occupation: updatedParent.occupation,
      relation: updatedParent.relation,
      address: updatedParent.address,
      children: updatedParent.children,
      password: unhashedPassword != null ? unhashedPassword : "",
    };
    // console.log("responseData:", responseData);

    res.status(200).json({
      success: true,
      parent: responseData,
    });

    // Sync Auth User
    try {
      const user = await require('../../models/User').findOne({ refId: id });
      if (user) {
        user.name = updateData.name || user.name;
        user.email = updateData.email || user.email;
        if (updateData.password) {
          user.password = req.body.password;
        }
        await user.save();
      }
    } catch (err) {
      console.error("Auth User sync failed for parent:", err.message);
    }

  } catch (error) {
    console.error("Error Updating parent Profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.deleteParentById = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedParent = await Parent.findByIdAndDelete(id);

    if (!deletedParent) {
      return res.status(404).json({
        success: false,
        message: "Parent not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Parent deleted successfully",
      deletedParent,
    });

    // Cleanup Auth User
    try {
      await require('../../models/User').findOneAndDelete({ refId: id });
    } catch (err) {
      console.error("Auth User cleanup failed for parent:", err.message);
    }

  } catch (error) {
    console.error("Error deleting parent:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting parent",
    });
  }
};

// Profile picture (image upload) — SIS Parent by Mongo id, or admission synthetic `adm-...`
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const ext = path.extname(req.file.originalname || "").toLowerCase();
    const imageExt = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"].includes(ext);
    const mime = String(req.file.mimetype || "");
    const imageMime = mime.startsWith("image/");
    if (!imageExt && !imageMime) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file (JPG, PNG, GIF, or WebP)",
      });
    }

    const { id } = req.params;
    const fileUrl = `/uploads/${req.file.filename}`;

    if (id.startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(id);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid admission parent id" });
      }
      const updated = await AdmissionApplication.findByIdAndUpdate(
        parsed.applicationId,
        { $set: { parentProfilePhoto: fileUrl } },
        { new: true }
      ).select("parentProfilePhoto");
      if (!updated) {
        return res.status(404).json({ success: false, message: "Admission record not found" });
      }
      return res.status(200).json({
        success: true,
        photo: fileUrl,
        message: "Profile photo updated",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid parent id" });
    }

    const parent = await Parent.findByIdAndUpdate(
      id,
      { $set: { profilePhoto: fileUrl } },
      { new: true, runValidators: true }
    ).select("profilePhoto");
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    return res.status(200).json({
      success: true,
      photo: fileUrl,
      message: "Profile photo updated",
    });
  } catch (error) {
    console.error("uploadProfilePhoto:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Document upload for parent (SIS Parent document, or AdmissionApplication.documents for `adm-...`)
exports.uploadDocument = async (req, res) => {
  console.log("req.file from uploaddoc parent", req.file);
  console.log("req.body:", req.body);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { parentId } = req.body; // send parentId from frontend
    console.log("Received parentId:", parentId);

    if (!parentId) {
      return res.status(400).json({ success: false, message: "Parent ID is required" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const documentData = {
      name: req.file.originalname,
      path: fileUrl,
      size: req.file.size,
      uploadedAt: new Date(),
      parentProfileUpload: true,
    };
    const admissionDocumentData = {
      ...documentData,
      fileType: req.file.mimetype || "",
    };

    if (String(parentId).startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(parentId);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid admission parent id" });
      }
      const updated = await AdmissionApplication.findByIdAndUpdate(
        parsed.applicationId,
        { $push: { documents: admissionDocumentData } },
        { new: true, runValidators: true }
      ).select("documents");
      if (!updated) {
        return res.status(404).json({ success: false, message: "Admission record not found" });
      }
      const savedDocument = updated.documents[updated.documents.length - 1];
      return res.status(201).json({
        success: true,
        message: "Document uploaded successfully",
        document: savedDocument,
      });
    }

    const parent = await Parent.findById(parentId);
    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    // Initialize documents array if it doesn't exist
    if (!parent.documents) {
      parent.documents = [];
    }

    parent.documents.push(documentData);
    await parent.save();
    const savedDocument = parent.documents[parent.documents.length - 1];

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      document: savedDocument,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get all documents for parent
exports.getAllDocuments = async (req, res) => {
  try {
    const { parentId } = req.params;
    console.log("Getting documents for parentId:", parentId);

    if (String(parentId).startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(parentId);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid admission parent id" });
      }
      const app = await AdmissionApplication.findById(parsed.applicationId)
        .select("documents")
        .lean();
      if (!app) {
        return res.status(404).json({ success: false, message: "Admission record not found" });
      }
      const onlyParentUploads = (app.documents || []).filter(
        (d) => d && d.parentProfileUpload === true
      );
      return res.status(200).json(onlyParentUploads);
    }

    const parent = await Parent.findById(parentId).select("documents");

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    res.status(200).json(parent.documents || []);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Preview document for parent
exports.previewDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = safeDocumentPath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Download document for parent
exports.downloadDocument = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = safeDocumentPath(filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    res.download(filePath);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const { parentId, documentId } = req.params;

    if (String(parentId).startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(parentId);
      if (!parsed) {
        return res.status(400).json({ success: false, message: "Invalid admission parent id" });
      }
      const application = await AdmissionApplication.findById(parsed.applicationId);
      if (!application) {
        return res.status(404).json({ success: false, message: "Admission record not found" });
      }
      const targetDocument = application.documents.id(documentId);
      if (!targetDocument) {
        return res.status(404).json({ success: false, message: "Document not found" });
      }
      if (!targetDocument.parentProfileUpload) {
        return res.status(403).json({
          success: false,
          message: "Only documents uploaded from the parent profile can be removed here.",
        });
      }
      if (targetDocument.path) {
        const filename = path.basename(targetDocument.path);
        const filePath = safeDocumentPath(filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      application.documents.pull({ _id: documentId });
      await application.save();
      return res.status(200).json({
        success: true,
        message: "Document deleted successfully",
      });
    }

    const parent = await Parent.findById(parentId);

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    const targetDocument = parent.documents.id(documentId);
    if (!targetDocument) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    if (targetDocument.path) {
      const filename = path.basename(targetDocument.path);
      const filePath = safeDocumentPath(filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    parent.documents.pull({ _id: documentId });
    await parent.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

exports.getParentDashboardStats = async (req, res) => {
  try {
    const { id } = req.params;
    let parent;
    
    if (id.startsWith("adm-")) {
      const parsed = parseAdmissionSyntheticParentRouteId(id);
      if (!parsed) {
        return res.status(404).json({ success: false, message: "Invalid admission parent id" });
      }
      parent = await AdmissionApplication.findById(parsed.applicationId);
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      parent = await Parent.findById(id).populate("children");
    }

    if (!parent) {
      return res.status(404).json({ success: false, message: "Parent not found" });
    }

    res.status(200).json({
      success: true,
      stats: {
        childrenCount: parent.children ? parent.children.length : (id.startsWith("adm-") ? 1 : 0),
        totalFees: 0,
        pendingFees: 12000,
        attendanceAverage: 93.5,
        upcomingPTA: "15 Oct",
      },
    });
  } catch (error) {
    console.error("Error fetching parent dashboard stats:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.getNextParentId = async (req, res) => {
  try {
    const nextParentId = await peekNextParentId();
    return res.status(200).json({
      success: true,
      nextParentId,
    });
  } catch (error) {
    console.error("Error fetching next parent ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.importParents = async (req, res) => {
  try {
    const parentsData = req.body;

    if (!parentsData || !Array.isArray(parentsData) || parentsData.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid data format: expected an array of parents",
      });
    }

    const results = { imported: [], skipped: [], errors: [] };
    const Role = require('../../models/Role');
    const parentRoleDoc = await Role.findOne({ name: 'parent' }).lean();

    const getVal = (row, keys) => {
      for (const k of keys) {
        if (row[k] !== undefined && row[k] !== null) return String(row[k]).trim();
      }
      return "";
    };

    for (const pData of parentsData) {
      try {
        const name = getVal(pData, ["Name", "name", "Parent Name", "Guardian Name", "Full Name", "Father Name", "Mother Name"]);
        const email = getVal(pData, ["Email", "email", "Email ID", "Email Address", "Contact Email"]);
        const phone = getVal(pData, ["Phone", "phone", "Mobile", "Mobile Number", "Contact", "Phone Number", "Contact Number"]);
        const studentIdStr = getVal(pData, ["Student ID", "StudentId", "studentId", "Student_ID", "SID"]);
        const linkedStudentIds = studentIdStr ? studentIdStr.split(",").map(id => id.trim()) : [];

        if (!name || !phone) {
          console.warn(`Import Parent failed: missing name/phone for row:`, pData);
          results.errors.push({ name: name || "Unknown", reason: "Name and Phone are required" });
          continue;
        }

        const existing = await Parent.findOne({ name, phone }).select("_id parentId").lean();
        if (existing) {
          results.skipped.push({ name, reason: `Exists (ID: ${existing.parentId || existing._id})` });
          continue;
        }

        const parentId = await generateNextParentId();
        const password = getVal(pData, ["Password", "password", "Pass"]) || "default123";

        const rawRole = getVal(pData, ["Role", "role", "Relation", "relation"]) || "Primary Guardian";
        const role = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();

        const parent = await Parent.create({
          name, email, phone, parentId, password,
          status: getVal(pData, ["Status", "status"]) || "Active",
          role: ["Primary Guardian", "Secondary Guardian", "Father", "Mother", "Guardian"].includes(role) ? role : "Guardian",
          children: []
        });

        if (linkedStudentIds.length > 0) {
          const students = await Student.find({ "personalInfo.stdId": { $in: linkedStudentIds } });
          if (students.length > 0) {
            await Student.updateMany({ _id: { $in: students.map(s => s._id) } }, { $set: { parent: parent._id } });
            parent.children.push(...students.map(s => s._id));
            await parent.save();
          }
        }

        results.imported.push({ _id: parent._id, name, parentId });

        if (parentRoleDoc) {
          try {
            await require('../../models/User').create({
              name, email: email || parentId, password,
              roleId: parentRoleDoc._id, refId: parent._id, status: 'active'
            });
          } catch (e) { console.warn(`Auth creation fail for ${name}:`, e.message); }
        }
      } catch (rowErr) {
        console.error(`Error processing parent row:`, rowErr.message);
        results.errors.push({ name: pData.Name || pData.name || "Unknown", reason: rowErr.message });
      }
    }

    res.status(201).json({ success: true, ...results });
  } catch (err) {
    console.error("Error in importParents:", err);
    res.status(500).json({ success: false, message: "Import failed", error: err.message });
  }
};
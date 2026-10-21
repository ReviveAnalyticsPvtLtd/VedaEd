const Staff = require("../staff/staffModels");
const {
    generateNextSupportStaffId,
    peekNextSupportStaffId,
} = require("./supportStaffIdCounter");

// Support staff live in the shared Staff collection (so dashboards, counts and
// tenant isolation come for free) and are identified by role="Other" PLUS a
// designation. HR-converted non-teaching employees also get role="Other" but
// never carry a designation, so they do not show up here.
const SUPPORT_STAFF_FILTER = {
    "personalInfo.role": "Other",
    "personalInfo.designation": { $exists: true, $ne: "" },
};

const MONGO_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const isAdult = (dobString) => {
    const dob = new Date(dobString);
    if (Number.isNaN(dob.getTime())) return false;
    const ageMs = Date.now() - dob.getTime();
    const eighteenYearsMs = 18 * 365.25 * 24 * 60 * 60 * 1000;
    return ageMs >= eighteenYearsMs;
};

const buildDocuments = (files) => {
    const documents = [];
    const push = (file, name) => {
        if (file) {
            documents.push({
                name,
                path: `/uploads/${file.filename}`,
                size: file.size,
            });
        }
    };
    if (files?.aadhaarDoc) push(files.aadhaarDoc[0], "Aadhaar Document");
    if (files?.otherDocs) push(files.otherDocs[0], "Other Document");
    return documents;
};

exports.getNextSupportStaffId = async (req, res) => {
    try {
        const staffId = await peekNextSupportStaffId();
        res.status(200).json({ success: true, data: { staffId } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createSupportStaff = async (req, res) => {
    try {
        const schoolId = req.user.schoolId;
        const {
            fullName,
            designation,
            department,
            phone,
            emergencyContact,
            aadhaar,
            gender,
            dob,
            bloodGroup,
            salary,
            joiningDate,
            status,
            profession,
            permanentAddress,
            currentAddress,
        } = req.body;

        if (!fullName || !designation || !department) {
            return res.status(400).json({
                success: false,
                message: "fullName, designation and department are required",
            });
        }
        if (dob && !isAdult(dob)) {
            return res
                .status(400)
                .json({ success: false, message: "Support staff must be 18+ years old" });
        }

        const staffId = await generateNextSupportStaffId();

        const personalInfo = {
            name: fullName,
            staffId,
            // personalInfo.username carries a unique index; the SS- id is
            // globally unique, so it doubles as a safe username placeholder
            // (support staff have no login account).
            username: staffId,
            role: "Other",
            designation,
            department,
            mobileNumber: phone || undefined,
            emergencyContact: emergencyContact || undefined,
            aadhaar: aadhaar || undefined,
            gender: gender || undefined,
            dob: dob || undefined,
            bloodGroup: bloodGroup || undefined,
            profession: profession || undefined,
            permanentAddress: permanentAddress || undefined,
            currentAddress: currentAddress || undefined,
        };
        if (req.files?.photo?.[0]) {
            personalInfo.image = `/uploads/${req.files.photo[0].filename}`;
        }

        const staff = await Staff.create({
            schoolId,
            personalInfo,
            status: status === "On Leave" ? "On Leave" : "Active",
            joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
            salaryDetails: salary ? { salary: String(salary) } : undefined,
            documents: buildDocuments(req.files),
        });

        res.status(201).json({ success: true, data: staff });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getSupportStaff = async (req, res) => {
    try {
        const staff = await Staff.find({
            schoolId: req.user.schoolId,
            ...SUPPORT_STAFF_FILTER,
        }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getSupportStaffById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!MONGO_ID_PATTERN.test(id)) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }
        const staff = await Staff.findOne({
            _id: id,
            schoolId: req.user.schoolId,
            ...SUPPORT_STAFF_FILTER,
        });
        if (!staff) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const UPDATABLE_FIELDS = [
    "designation",
    "department",
    "mobileNumber",
    "emergencyContact",
    "aadhaar",
    "gender",
    "dob",
    "bloodGroup",
    "profession",
    "permanentAddress",
    "currentAddress",
];

const FORM_TO_SCHEMA_FIELD = {
    phone: "mobileNumber",
    fullName: "name",
};

exports.updateSupportStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if (!MONGO_ID_PATTERN.test(id)) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }

        const set = {};
        for (const [key, value] of Object.entries(req.body)) {
            const field = FORM_TO_SCHEMA_FIELD[key] || key;
            if (UPDATABLE_FIELDS.includes(field)) set[`personalInfo.${field}`] = value;
        }
        if (req.body.status === "Active" || req.body.status === "On Leave") {
            set.status = req.body.status;
        }
        if (req.body.joiningDate) set.joiningDate = new Date(req.body.joiningDate);
        if (req.body.salary) set["salaryDetails.salary"] = String(req.body.salary);

        if (req.body.dob && !isAdult(req.body.dob)) {
            return res
                .status(400)
                .json({ success: false, message: "Support staff must be 18+ years old" });
        }

        const staff = await Staff.findOneAndUpdate(
            { _id: id, schoolId: req.user.schoolId, ...SUPPORT_STAFF_FILTER },
            { $set: set },
            { new: true, runValidators: true }
        );
        if (!staff) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }
        res.status(200).json({ success: true, data: staff });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteSupportStaff = async (req, res) => {
    try {
        const { id } = req.params;
        if (!MONGO_ID_PATTERN.test(id)) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }
        const staff = await Staff.findOneAndDelete({
            _id: id,
            schoolId: req.user.schoolId,
            ...SUPPORT_STAFF_FILTER,
        });
        if (!staff) {
            return res.status(404).json({ success: false, message: "Support staff not found" });
        }
        res.status(200).json({ success: true, message: "Support staff deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const AdmissionApplication = require("./admissionApplicationModel");
const {
    normalizeParentIdAccountHolder,
    validateParentAccountForHolder,
} = require("./parentAccountUtils");
const EntranceExam = require("./entranceExamModel");
const Interview = require("./interviewModel");
const { generateNextStudentId } = require("../../utils/studentIdGenerator");
const { generateNextParentId } = require("../../utils/parentIdGenerator");
const { generateStudentUsernameBase } = require("../../utils/studentUsernameGenerator");
const path = require("path");
const fs = require("fs");

function parseLegacyCombinedAddress(address = "") {
    if (!address || typeof address !== "string") {
        return { address: "", city: "", state: "", zipCode: "" };
    }

    const parts = address.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length < 2) {
        return { address: address.trim(), city: "", state: "", zipCode: "" };
    }

    if (parts.length >= 4) {
        const lastChunk = parts.slice(3).join(", ").trim();
        const zipMatch = lastChunk.match(/(\d{4,10})$/);
        const zipCode = zipMatch ? zipMatch[1] : "";
        const state = zipCode ? lastChunk.replace(/\d{4,10}\s*$/, "").trim() : lastChunk;
        return {
            address: parts[0] || "",
            city: parts[2] || "",
            state: state || parts[1] || "",
            zipCode,
        };
    }

    const stateZipChunk = parts.slice(2).join(", ").trim();
    const zipMatch = stateZipChunk.match(/(\d{4,10})$/);
    const zipCode = zipMatch ? zipMatch[1] : "";
    const state = zipCode ? stateZipChunk.replace(/\d{4,10}\s*$/, "").trim() : stateZipChunk;

    return {
        address: parts[0] || "",
        city: parts[1] || "",
        state,
        zipCode,
    };
}

function normalizeContactInfo(contactInfo = {}) {
    const normalized = { ...(contactInfo || {}) };
    const hasAddress = typeof normalized.address === "string" && normalized.address.trim();
    const hasCity = typeof normalized.city === "string" && normalized.city.trim();
    const hasState = typeof normalized.state === "string" && normalized.state.trim();
    const hasZip = typeof normalized.zipCode === "string" && normalized.zipCode.trim();

    if (hasAddress && (!hasCity || !hasState || !hasZip)) {
        const parsed = parseLegacyCombinedAddress(normalized.address);
        normalized.address = hasAddress ? (parsed.address || normalized.address).trim() : "";
        normalized.city = hasCity ? normalized.city.trim() : parsed.city;
        normalized.state = hasState ? normalized.state.trim() : parsed.state;
        normalized.zipCode = hasZip ? normalized.zipCode.trim() : parsed.zipCode;
        return normalized;
    }

    return {
        ...normalized,
        address: typeof normalized.address === "string" ? normalized.address.trim() : "",
        city: typeof normalized.city === "string" ? normalized.city.trim() : "",
        state: typeof normalized.state === "string" ? normalized.state.trim() : "",
        zipCode: typeof normalized.zipCode === "string" ? normalized.zipCode.trim() : "",
    };
}

async function ensureAdmissionParentId(applicationDoc) {
    if (!applicationDoc) return applicationDoc;
    if (applicationDoc.parents?.parentId) return applicationDoc;

    const generatedParentId = await generateNextParentId();
    applicationDoc.set("parents.parentId", generatedParentId);
    await applicationDoc.save();
    return applicationDoc;
}

async function ensureAdmissionStdId(applicationDoc) {
    if (!applicationDoc) return applicationDoc;
    
    // Ensure Student ID
    if (!applicationDoc.personalInfo?.stdId) {
        const generatedStdId = await generateNextStudentId();
        applicationDoc.set("personalInfo.stdId", generatedStdId);
    }

    // Ensure Parent ID
    if (!applicationDoc.parents?.parentId) {
        const generatedParentId = await generateNextParentId();
        applicationDoc.set("parents.parentId", generatedParentId);
    }

    await applicationDoc.save();
    return applicationDoc;
}

// Create a new admission application
exports.createApplication = async (req, res) => {
    try {
        console.log("Received application data:", JSON.stringify(req.body, null, 2));
        const applicationData = { ...req.body };
        if (applicationData.contactInfo && typeof applicationData.contactInfo === "object") {
            applicationData.contactInfo = normalizeContactInfo(applicationData.contactInfo);
        }

        if (applicationData.parents && typeof applicationData.parents === "object") {
            const parents = { ...applicationData.parents };
            parents.parentIdAccountHolder = normalizeParentIdAccountHolder(
                parents.parentIdAccountHolder,
                parents
            );
            const accErr = validateParentAccountForHolder(parents, parents.parentIdAccountHolder);
            if (accErr) {
                return res.status(400).json({ success: false, message: accErr });
            }
            applicationData.parents = parents;
        }

        // Check if marked as Paid on creation
        const feeStatus = String(
            applicationData.personalInfo?.fees || ""
        ).toLowerCase();
        const isPaid = feeStatus === "paid";

        if (isPaid) {
            // Generate Student ID
            if (!applicationData.personalInfo?.stdId) {
                const generatedStdId = await generateNextStudentId();
                if (applicationData.personalInfo) {
                    applicationData.personalInfo.stdId = generatedStdId;
                } else {
                    applicationData.personalInfo = { stdId: generatedStdId };
                }
            }

            // Generate Parent ID
            if (!applicationData.parents?.parentId) {
                const generatedParentId = await generateNextParentId();
                if (applicationData.parents) {
                    applicationData.parents.parentId = generatedParentId;
                } else {
                    applicationData.parents = { parentId: generatedParentId };
                }
            }

            if (!applicationData.personalInfo?.username) {
                const personalInfo = applicationData.personalInfo || {};
                const generatedUsername = generateStudentUsernameBase(
                    personalInfo.name,
                    personalInfo.dateOfBirth || personalInfo.DOB
                );
                if (applicationData.personalInfo) {
                    applicationData.personalInfo.username = generatedUsername;
                } else {
                    applicationData.personalInfo = { username: generatedUsername };
                }
            }
        }

        // Create new application
        const newApplication = new AdmissionApplication(applicationData);
        await newApplication.save();

        // Create Auth User if Paid
        if (isPaid) {
            try {
                const User = require("../../models/User");
                const Role = require("../../models/Role");
                const existingUser = await User.findOne({ refId: newApplication._id });
                
                if (!existingUser) {
                    const roleDoc = await Role.findOne({ name: 'student' });
                    if (roleDoc) {
                        const personalInfo = newApplication.personalInfo || {};
                        const contactInfo = newApplication.contactInfo || {};
                        
                        await User.create({
                            name: personalInfo.name,
                            email: contactInfo.email || personalInfo.stdId || personalInfo.username,
                            password: personalInfo.password || "default123",
                            roleId: roleDoc._id,
                            refId: newApplication._id,
                            status: 'active'
                        });
                        console.log("Auth User created for new admission student marked as paid");
                    }
                }
            } catch (err) {
                console.error("Failed to create auth user for new paid application:", err);
            }
        }

        res.status(201).json({
            success: true,
            data: newApplication,
            message: "Application submitted successfully",
        });
    } catch (error) {
        console.error("Error creating application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to submit application: " + error.message,
            error: error.message,
        });
    }
};

// Required document types for admission
const REQUIRED_DOCUMENTS = [
    "Passport Size Photo",
    "Aadhaar Copy",
    "Marksheet",
    "Migration Certificate",
];

// Upload documents for an application
exports.uploadApplicationDocument = async (req, res) => {
    try {
        console.log("Upload request received. Body:", req.body);
        console.log("Upload request file:", req.file);

        const applicationId = req.body.applicationId || req.params.id;

        if (!req.file) {
            console.error("No file in request");
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        if (!applicationId) {
            console.error("No applicationId in request");
            return res.status(400).json({ success: false, message: "No applicationId provided" });
        }

        const application = await AdmissionApplication.findById(applicationId);
        if (!application) {
            console.error("Application not found for ID:", applicationId);
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const docData = {
            name: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            fileType: req.file.mimetype,
        };

        if (req.body.type) {
            docData.type = req.body.type;
        }

        application.documents.push(docData);
        await application.save();
        console.log("Document saved successfully to application:", applicationId);

        // Check if all required documents are now present
        const uploadedTypes = application.documents.map(d => d.type);
        const missingDocs = REQUIRED_DOCUMENTS.filter(type => !uploadedTypes.includes(type));
        const allDocumentsUploaded = missingDocs.length === 0;

        res.status(200).json({
            success: true,
            message: allDocumentsUploaded
                ? "Document uploaded successfully. All required documents are now complete."
                : `Document uploaded successfully. Missing documents: ${missingDocs.join(", ")}`,
            data: application,
            document: application.documents[application.documents.length - 1],
            allDocumentsUploaded,
            missingDocuments: missingDocs,
        });
    } catch (error) {
        console.error("Error uploading document:", error);
        res.status(500).json({
            success: false,
            message: "Failed to upload document",
            error: error.message,
        });
    }
};

// Track Application Status
exports.trackApplication = async (req, res) => {
    try {
        const { id } = req.params; // Expecting applicationId (e.g. APP-123) OR _id

        let query = { applicationId: id };

        // Check if input might be a MongoDB _id (24 hex chars)
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            // It's a valid ObjectId format, verify if it finds anything, OR search applicationId
            // We can use $or to be safe
            query = { $or: [{ applicationId: id }, { _id: id }] };
        }

        const application = await AdmissionApplication.findOne(query);

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const entranceExam = await EntranceExam.findOne({ applicationId: application._id });
        const interview = await Interview.findOne({ applicationId: application._id });

        // Construct steps
        const steps = [];

        // 1. Admission Form - Always completed if application exists
        steps.push({
            label: "Admission Form",
            status: "completed",
            details: "Detailed application form submitted successfully.",
        });

        // 2. Application Listed/Review
        steps.push({
            label: "Application Listed",
            status: "completed", // Assuming listed if it exists
            details: "Application is under review by admin.",
        });

        // 3. Document Verification
        let docStatus = "pending";
        let docDetails = "Documents are pending verification.";
        const docVerStatus = (application.documentVerificationStatus || "").toLowerCase();

        if (docVerStatus === "verified") {
            docStatus = "completed";
            docDetails = "All documents verified successfully.";
        } else if (docVerStatus === "rejected") {
            docStatus = "pending"; // Or error/rejected
            docDetails = "Some documents were rejected. Please re-upload.";
        }

        steps.push({
            label: "Document Verification",
            status: docStatus,
            details: docDetails,
        });

        // 4. Entrance Exam (Optional/Conditional) - Show if exists
        if (entranceExam) {
            let examStatus = "pending";
            let examDetails = "Exam schedule pending.";

            if (entranceExam.status === "Completed" && entranceExam.result === "Qualified") {
                examStatus = "completed";
                examDetails = `Exam Qualified. Marks/Grade: ${entranceExam.result}`;
            } else if (entranceExam.status === "Completed" && entranceExam.result === "Disqualified") {
                examStatus = "pending";
                examDetails = "Exam Disqualified.";
            } else if (entranceExam.status === "Scheduled") {
                examStatus = "pending";
                examDetails = `Scheduled on ${new Date(entranceExam.examDate).toLocaleDateString()} at ${entranceExam.time || 'TBD'}`;
            }

            steps.push({
                label: "Entrance Exam",
                status: examStatus,
                details: examDetails,
            });
        }

        // 5. Interview
        if (interview) {
            let intStatus = "pending";
            let intDetails = "Interview schedule pending.";

            if (interview.status === "Completed" && interview.result === "Qualified") {
                intStatus = "completed";
                intDetails = "Interview Qualified.";
            } else if (interview.status === "Scheduled") {
                intStatus = "pending";
                intDetails = `Scheduled on ${new Date(interview.interviewDate).toLocaleDateString()}`;
            }

            steps.push({
                label: "Interview",
                status: intStatus,
                details: intDetails,
            });
        }

        // 6. Final Status / Offer
        let offerStatus = "upcoming";
        let offerDetails = "Pending final decision.";

        if (application.applicationStatus === "Approved") {
            offerStatus = "completed";
            offerDetails = "Application Approved. Offer Letter Generated.";
        } else if (application.applicationStatus === "Rejected") {
            offerStatus = "upcoming";
            offerDetails = "Application Rejected.";
        }

        steps.push({
            label: "Application Result",
            status: offerStatus,
            details: offerDetails,
        });

        // 7. Fees (Simple logic for now)
        steps.push({
            label: "Fees Confirmation",
            status: application.personalInfo?.fees === 'Paid' ? "completed" : "upcoming",
            details: application.personalInfo?.fees === 'Paid' ? "Fees Paid." : "Fees Payment Pending.",
        });


        const appliedClass = application.personalInfo?.classApplied || application.earlierAcademic?.lastClass || "";
        const result = {
            applicationId: application.applicationId,
            studentName: application.personalInfo?.name,
            classApplied: appliedClass,
            academicYear: application.earlierAcademic?.academicYear || "2025-26",
            steps: steps,
        };

        res.status(200).json({
            success: true,
            data: result,
        });

    } catch (error) {
        console.error("Error tracking application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to track application",
            error: error.message,
        });
    }
};

// Get all applications (for the 'Application Approval' list)
exports.getAllApplications = async (req, res) => {
    try {
        const applications = await AdmissionApplication.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: applications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch applications",
            error: error.message,
        });
    }
};

// Get single application
exports.getApplicationById = async (req, res) => {
    try {
        const application = await AdmissionApplication.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }
        const applicationData = application.toObject ? application.toObject() : application;
        if (applicationData.contactInfo && typeof applicationData.contactInfo === "object") {
            applicationData.contactInfo = normalizeContactInfo(applicationData.contactInfo);
        }
        res.status(200).json({
            success: true,
            data: applicationData,
            message: "Application fetched successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch application",
            error: error.message,
        });
    }
};

// Get Selected Students (Verified Documents)
exports.getSelectedStudents = async (req, res) => {
    try {
        const applications = await AdmissionApplication.find({
            // Student should appear in selected list only after successful document verification.
            documentVerificationStatus: { $in: ["Verified", "verified"] }
        }).sort({ createdAt: -1 });

        // ID generation is handled in updateApplication when marked as Paid.
        // We avoid calling ensureAdmissionStdId here to prevent slow/failing GET requests.

        // Normalize appliedClass for consumers that require a reliable class value.
        const normalizedApplications = applications.map((applicationDoc) => {
            const application = applicationDoc.toObject();
            const appliedClass =
                application.personalInfo?.classApplied ||
                application.personalInfo?.class ||
                
                "";
            const existingUsername = application.personalInfo?.username;
            const generatedUsername = generateStudentUsernameBase(
                application.personalInfo?.name,
                application.personalInfo?.dateOfBirth || application.personalInfo?.DOB
            );
            const normalizedUsername = existingUsername || generatedUsername;

            return {
                ...application,
                personalInfo: {
                    ...(application.personalInfo || {}),
                    username: normalizedUsername,
                },
                appliedClass,
            };
        });

        res.status(200).json({
            success: true,
            data: normalizedApplications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch selected students",
            error: error.message,
        });
    }
};

// Update full application details
exports.updateApplication = async (req, res) => {
    try {
        const updates = req.body;

        // Remove internal fields that shouldn't be updated manually
        delete updates._id;
        delete updates.__v;
        delete updates.createdAt;
        delete updates.updatedAt;

        const feeStatusFromDotPath = updates["personalInfo.fees"];
        const feeStatusFromObject = updates.personalInfo?.fees;
        const requestedFeeStatus = String(
            feeStatusFromDotPath ?? feeStatusFromObject ?? ""
        ).toLowerCase();
        const willMarkAsPaid = requestedFeeStatus === "paid";

        const updatePayload = { ...updates };
        const existingApplication = await AdmissionApplication.findById(req.params.id);
        if (!existingApplication) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        const existingPersonalInfo = existingApplication.personalInfo?.toObject
            ? existingApplication.personalInfo.toObject()
            : (existingApplication.personalInfo || {});
        const existingContactInfo = existingApplication.contactInfo?.toObject
            ? existingApplication.contactInfo.toObject()
            : (existingApplication.contactInfo || {});
        const existingAcademic = existingApplication.earlierAcademic?.toObject
            ? existingApplication.earlierAcademic.toObject()
            : (existingApplication.earlierAcademic || {});
        const existingParents = existingApplication.parents?.toObject
            ? existingApplication.parents.toObject()
            : (existingApplication.parents || {});

        if (updates.personalInfo && typeof updates.personalInfo === "object") {
            updatePayload.personalInfo = {
                ...existingPersonalInfo,
                ...updates.personalInfo,
            };
        }

        if (updates.contactInfo && typeof updates.contactInfo === "object") {
            updatePayload.contactInfo = {
                ...existingContactInfo,
                ...updates.contactInfo,
            };
            updatePayload.contactInfo = normalizeContactInfo(updatePayload.contactInfo);
        }

        if (updates.earlierAcademic && typeof updates.earlierAcademic === "object") {
            updatePayload.earlierAcademic = {
                ...existingAcademic,
                ...updates.earlierAcademic,
            };
        }

        if (updates.parents && typeof updates.parents === "object") {
            updatePayload.parents = {
                ...existingParents,
                ...updates.parents,
                father: {
                    ...(existingParents.father || {}),
                    ...(updates.parents.father || {}),
                },
                mother: {
                    ...(existingParents.mother || {}),
                    ...(updates.parents.mother || {}),
                },
                guardian: {
                    ...(existingParents.guardian || {}),
                    ...(updates.parents.guardian || {}),
                },
            };
            const merged = updatePayload.parents;
            merged.parentIdAccountHolder = normalizeParentIdAccountHolder(
                merged.parentIdAccountHolder ?? existingParents.parentIdAccountHolder,
                merged
            );
            const accErr = validateParentAccountForHolder(merged, merged.parentIdAccountHolder);
            if (accErr) {
                return res.status(400).json({ success: false, message: accErr });
            }
            updatePayload.parents = merged;
        }

        if (willMarkAsPaid) {
            // Generate Student ID if missing
            if (!existingApplication.personalInfo?.stdId) {
                const generatedStdId = await generateNextStudentId();
                if (updatePayload.personalInfo && typeof updatePayload.personalInfo === "object") {
                    updatePayload.personalInfo = {
                        ...updatePayload.personalInfo,
                        stdId: generatedStdId,
                    };
                } else {
                    updatePayload["personalInfo.stdId"] = generatedStdId;
                }
            }

            // Generate Parent ID if missing
            if (!existingApplication.parents?.parentId) {
                const generatedParentId = await generateNextParentId();
                if (updatePayload.parents && typeof updatePayload.parents === "object") {
                    updatePayload.parents = {
                        ...updatePayload.parents,
                        parentId: generatedParentId,
                    };
                } else {
                    updatePayload["parents.parentId"] = generatedParentId;
                }
            }

            const incomingPersonalInfo =
                updatePayload.personalInfo && typeof updatePayload.personalInfo === "object"
                    ? updatePayload.personalInfo
                    : {};
            const mergedPersonalInfo = {
                ...existingPersonalInfo,
                ...incomingPersonalInfo,
            };

            if (!mergedPersonalInfo.username) {
                const generatedUsername = generateStudentUsernameBase(
                    mergedPersonalInfo.name,
                    mergedPersonalInfo.dateOfBirth || mergedPersonalInfo.DOB
                );
                if (updatePayload.personalInfo && typeof updatePayload.personalInfo === "object") {
                    updatePayload.personalInfo = {
                        ...updatePayload.personalInfo,
                        username: generatedUsername,
                    };
                } else {
                    updatePayload["personalInfo.username"] = generatedUsername;
                }
            }

            // Create User record if it doesn't exist
            try {
                const User = require("../../models/User");
                const Role = require("../../models/Role");
                const existingUser = await User.findOne({ refId: existingApplication._id });
                
                if (!existingUser) {
                    const roleDoc = await Role.findOne({ name: 'student' });
                    if (roleDoc) {
                        const personalInfo = updatePayload.personalInfo || existingApplication.personalInfo || {};
                        const contactInfo = updatePayload.contactInfo || existingApplication.contactInfo || {};
                        
                        await User.create({
                            name: personalInfo.name,
                            email: contactInfo.email || personalInfo.stdId || personalInfo.username,
                            password: personalInfo.password || "default123",
                            roleId: roleDoc._id,
                            refId: existingApplication._id,
                            status: 'active'
                        });
                        console.log("Auth User created for admission student marked as paid");
                    }
                }
            } catch (err) {
                console.error("Failed to create auth user for paid application:", err);
            }
        }

        const application = await AdmissionApplication.findByIdAndUpdate(
            req.params.id,
            { $set: updatePayload },
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: application,
            message: "Application updated successfully",
        });
    } catch (error) {
        console.error("Error updating application:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update application",
            error: error.message,
        });
    }
};

// Update application status (Approve/Reject)
exports.updateApplicationStatus = async (req, res) => {
    try {
        const { status, remarks } = req.body;
        const application = await AdmissionApplication.findByIdAndUpdate(
            req.params.id,
            { applicationStatus: status },
            { new: true }
        );

        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        res.status(200).json({
            success: true,
            data: application,
            message: `Application ${status}`,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to update status",
            error: error.message,
        });
    }
};

// Delete a document
exports.deleteApplicationDocument = async (req, res) => {
    try {
        const { id, documentId } = req.params;

        const application = await AdmissionApplication.findById(id);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        // Filter out the document to delete
        // Assuming documents is an array of objects with _id
        const docIndex = application.documents.findIndex(d => d._id.toString() === documentId);

        if (docIndex === -1) {
            return res.status(404).json({ success: false, message: "Document not found" });
        }

        // Optional: Delete file from filesystem if needed
        // const docPath = application.documents[docIndex].path;
        // if (fs.existsSync(docPath)) fs.unlinkSync(docPath);

        application.documents.splice(docIndex, 1);
        await application.save();

        res.status(200).json({
            success: true,
            message: "Document deleted successfully",
            data: application
        });
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete document",
            error: error.message
        });
    }
};

// Verify/Reject a specific document
exports.verifyDocumentStatus = async (req, res) => {
    try {
        const { applicationId, documentId } = req.params;
        const { status, comment } = req.body;

        const application = await AdmissionApplication.findById(applicationId);
        if (!application) {
            return res.status(404).json({ success: false, message: "Application not found" });
        }

        // Find document subdocument
        const document = application.documents.id(documentId);
        if (!document) {
            // Fallback: match by _id string
            const docIndex = application.documents.findIndex(d => d._id.toString() === documentId);
            if (docIndex === -1) {
                return res.status(404).json({ success: false, message: "Document not found" });
            }
            application.documents[docIndex].verificationStatus = status;
            application.documents[docIndex].comment = comment;
            application.documents[docIndex].verifiedAt = new Date();
        } else {
            document.set({ verificationStatus: status, comment: comment, verifiedAt: new Date() });
        }

        // CHECK IF ALL DOCUMENTS ARE VERIFIED
        const allVerified = application.documents.length > 0 && application.documents.every(doc => (doc.verificationStatus || '').toLowerCase() === 'verified');
        const anyRejected = application.documents.some(doc => (doc.verificationStatus || '').toLowerCase() === 'rejected');

        if (allVerified) {
            application.documentVerificationStatus = 'Verified';
        } else if (anyRejected) {
            application.documentVerificationStatus = 'Rejected';
        } else {
            application.documentVerificationStatus = 'Pending';
        }

        await application.save();

        res.status(200).json({
            success: true,
            message: "Document status updated",
            data: application
        });
    } catch (error) {
        console.error("Error verifying document:", error);
        res.status(500).json({
            success: false,
            message: "Failed to verify document",
            error: error.message
        });
    }
};



 const Class = require("./classSchema");
const Section = require("../section/sectionSchema");
const Student = require('../student/studentModels');
const Timetable = require("../Timetable/timeTableSchema");
const AssignTeacher = require("../assignTeachersToClass/assignTeacherSchema");
const Assignment = require("../assignment/assignment");
const {
  normalizeClassName,
  matchesGrade,
  sortClasses,
} = require("./services/classAutomationService");

// @route   POST /api/classes/
exports.createClass = async (req, res) => {
  console.log("create class backend posted: ", req.body);
  const { name, sections, capacity } = req.body;
  try {
    if (!name || !sections)
      return res.status(400).json({ success: false, message: 'Required Fields Missing' });

    const normalizedName = normalizeClassName(name);

    // Validate Sections
    if (sections && sections.length > 0) {
      const sectionFound = await Section.find({ _id: { $in: sections } });
      if (sectionFound.length !== sections.length)
        return res.status(400).json({ success: false, message: 'Some sections not found' });
    }

    // Check if class already exists (exact or alias)
    const existingClasses = await Class.find({});
    const isclassExist = existingClasses.find((c) =>
      matchesGrade(c.name, normalizedName)
    );
    if (isclassExist)
      return res.status(409).json({ success: false, message: 'Class already exists' });

    const newClass = await Class.create({ name: normalizedName, sections, capacity });
    const reply = await Class.findById(newClass._id).populate("sections", "name");

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: reply,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// exports.createOrUpdateClass = async (req, res) => {
//   console.log("create/update class backend posted: ", req.body);
//   const { name, sections, capacity } = req.body;

//   try {
//     if (!name || !sections) {
//       return res.status(400).json({ success: false, message: "Required Fields Missing" });
//     }

//     // Validate sections
//     if (sections && sections.length > 0) {
//       const sectionFound = await Section.find({ _id: { $in: sections } });
//       if (sectionFound.length !== sections.length) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Some sections not found" });
//       }
//     }

//     // Check if class already exists
//     let existingClass = await Class.findOne({ name });

//     if (existingClass) {
//       // Merge new sections with old ones (avoid duplicates)
//       const updatedSections = [
//         ...new Set([...existingClass.sections.map(String), ...sections.map(String)]),
//       ];

//       existingClass.sections = updatedSections;
//       if (capacity) existingClass.capacity = capacity; // update capacity if passed

//       await existingClass.save();

//       const reply = await Class.findById(existingClass._id).populate("sections", "name");

//       return res.status(200).json({
//         success: true,
//         message: "Class updated successfully",
//         data: reply,
//       });
//     } else {
//       // Create new class if not found
//       const newClass = await Class.create({ name, sections, capacity });
//       const reply = await Class.findById(newClass._id).populate("sections", "name");

//       return res.status(201).json({
//         success: true,
//         message: "Class created successfully",
//         data: reply,
//       });
//     }
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: "Server error", error: err.message });
//   }
// };


// @desc    Get all classes
// @route   GET /api/classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.find({})
      .populate("sections", "name");

    const assignedTeachers = await AssignTeacher.find()
      .populate("classTeacher", "personalInfo.name");

    const updatedClasses = classes.map((cls) => {
      const validSections = Array.isArray(cls.sections) ? cls.sections.filter(Boolean) : [];
      const sectionsWithTeachers = validSections.map((sec) => {
        const teacherData = assignedTeachers.find(
          (item) =>
            item?.class &&
            item?.section &&
            sec?._id &&
            item.class.toString() === cls._id.toString() &&
            item.section.toString() === sec._id.toString()
        );

        return {
          ...(typeof sec?.toObject === "function" ? sec.toObject() : sec),
          classTeacher:
            teacherData?.classTeacher?.personalInfo?.name || "N/A",
        };
      });

      return {
        ...cls.toObject(),
        sections: sectionsWithTeachers,
      };
    });

    const sortedClasses = sortClasses(updatedClasses);

    res.status(200).json({
      success: true,
      count: sortedClasses.length,
      data: sortedClasses,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

//  GET /api/classes/:id
exports.getClassById = async (req, res) => {
  const {id}= req.params;
  try {

    if (!id) {
      return res.status(404).json({ success: false, message: "Invalid not found" });
    }

    const classData = await Class.findById(id).select("name");
    const assignTeacherDocs = await AssignTeacher.find({class:id})
        .populate("classTeacher", "personalInfo.name")
        .populate("section", "name"); 

    const details = assignTeacherDocs.map(item=>({
      section: item.section?.name, 
      classTeacher:item.classTeacher?.personalInfo?.name
    }))
    const data = {
      classData,
      details
    }
    res.status(200).json({ 
      success: true, 
      data
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
};

exports.getClassByIdAndSection = async (req, res) => {
  const { classId, sectionId } = req.params;

  try {
    if (!classId || !sectionId) {
      return res.status(400).json({ success: false, message: "ClassId and SectionId are required" });
    }

    // Get class info
    const classname = await Class.findById(classId).select("name");
    const sectionName = await Section.findById(sectionId).select("name");
    // Students of this class + section
    const students = await Student.find({
      "personalInfo.class": classId,
      "personalInfo.section": sectionId
    }).select("personalInfo.rollNo personalInfo.name personalInfo.gender");

    // Timetable for this class + section
    const timetableDocs = await Timetable.find({
      class: classId,
      section: sectionId
    })
      .populate("subject", "subjectName")
      .populate("teacher", "personalInfo.name");


  // timetableWithPeriods se hi kis subject ka konsa teacher hai map ho jayega in the frontend bro 
    const timetableWithPeriods = timetableDocs
    .sort((a, b) => a.timeFrom.localeCompare(b.timeFrom)) // sorted by time
    .map((item, index) => ({
      period: index + 1,
      day: item.day,
      timeFrom: item.timeFrom,
      timeTo: item.timeTo,
      subject: item.subject ? item.subject.subjectName : null,
      teacher: item.teacher ? item.teacher.personalInfo.name : null,
    }));
const assignedTeacher = await AssignTeacher.findOne({
  class: classId,
  section: sectionId,
}).populate("classTeacher", "personalInfo.name");
    const assignmentData = await Assignment.find({class:classId, section:sectionId})
      .populate("subject", "subjectName")
      .select("title dueDate");

    // console.log("timetable", timetableWithPeriods);
   res.status(200).json({
  success: true,
  data: {
    classname,
    sectionName,
    students,
    timetableWithPeriods,
    assignmentData,
    classTeacher: assignedTeacher?.classTeacher || null,
  }
});

  } catch (err) {
    console.error("Error fetching class+section data:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message
    });
  }
};



//PUT /api/classes/:id
exports.updateClass = async (req, res) => {
  try {
    const {id} = req.params;
    const {name, sections, capacity} = req.body;

    // Validate sections if provided
    if(sections && sections.length > 0){
      const sectionFound = await Section.find({_id:{$in:sections}});
      if(sectionFound.length !== sections.length) 
        return res.status(400).json({ success: false, message: 'Some sections not found' });
    }

    const updatePayload = {};
    if (name !== undefined) updatePayload.name = normalizeClassName(name);
    if (sections !== undefined) updatePayload.sections = sections;
    if (capacity !== undefined) updatePayload.capacity = capacity;

    const updatedClass = await Class.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    });

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const reply = await Class.findById(updatedClass._id).populate("sections", "name");

    res.status(200).json({
      success: true,
      message: "Class updated successfully",
      data: reply,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: "Update failed", error: err.message });
  }
};


//DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.findByIdAndDelete(req.params.id);

    if (!deletedClass) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    res.status(200).json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Delete failed", error: err.message });
  }
};


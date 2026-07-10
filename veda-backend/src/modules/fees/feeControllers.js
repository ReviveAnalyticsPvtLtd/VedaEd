const {
  AcademicYear,
  FeeCategory,
  GradeFee,
  InstallmentPlan,
  LateFeePolicy,
  DiscountRule,
  Fine,
  FeeTransaction
} = require("./feeModels");
const Student = require("../student/studentModels");

// --- Academic Year Controllers ---

exports.getAcademicYears = async (req, res) => {
  try {
    const years = await AcademicYear.find().sort({ createdAt: -1 });
    res.json(years);
  } catch (error) {
    res.status(500).json({ message: "Error fetching academic years", error });
  }
};

exports.createAcademicYear = async (req, res) => {
  try {
    const { label, startDate, endDate, isActive, terms } = req.body;

    if (isActive) {
      await AcademicYear.updateMany({}, { isActive: false });
    }

    const newYear = new AcademicYear({
      label,
      startDate,
      endDate,
      isActive,
      terms,
    });

    await newYear.save();
    res.status(201).json(newYear);
  } catch (error) {
    res.status(500).json({ message: "Error creating academic year", error });
  }
};

exports.updateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, startDate, endDate, isActive, terms } = req.body;

    if (isActive) {
      await AcademicYear.updateMany({ _id: { $ne: id } }, { isActive: false });
    }

    const updatedYear = await AcademicYear.findByIdAndUpdate(
      id,
      { label, startDate, endDate, isActive, terms },
      { new: true }
    );

    if (!updatedYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }
    res.json(updatedYear);
  } catch (error) {
    res.status(500).json({ message: "Error updating academic year", error });
  }
};

exports.deleteAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedYear = await AcademicYear.findByIdAndDelete(id);
    if (!deletedYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }
    res.json({ message: "Academic year deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting academic year", error });
  }
};

exports.activateAcademicYear = async (req, res) => {
  try {
    const { id } = req.params;

    // Deactivate all
    await AcademicYear.updateMany({}, { isActive: false });

    // Activate the selected one
    const activatedYear = await AcademicYear.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true }
    );

    if (!activatedYear) {
      return res.status(404).json({ message: "Academic year not found" });
    }
    res.json(activatedYear);
  } catch (error) {
    res.status(500).json({ message: "Error activating academic year", error });
  }
};

// --- Fee Category Controllers ---

exports.getFeeCategories = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.json([]); // No year selected and no active year found

    const query = { year };
    const categories = await FeeCategory.find(query).sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee categories", error });
  }
};

exports.createFeeCategory = async (req, res) => {
  try {
    const categoryData = req.body;
    const newCategory = new FeeCategory(categoryData);
    await newCategory.save();
    res.status(201).json(newCategory);
  } catch (error) {
    res.status(500).json({ message: "Error creating fee category", error });
  }
};

exports.updateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryData = req.body;
    const updatedCategory = await FeeCategory.findByIdAndUpdate(
      id,
      categoryData,
      { new: true }
    );
    if (!updatedCategory) {
      return res.status(404).json({ message: "Fee category not found" });
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(500).json({ message: "Error updating fee category", error });
  }
};

exports.deleteFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await FeeCategory.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "Fee category not found" });
    }
    res.json({ message: "Fee category deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting fee category", error });
  }
};

exports.toggleFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await FeeCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Fee category not found" });
    }
    category.active = !category.active;
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: "Error toggling fee category", error });
  }
};
// --- Grade Fee Controllers ---

exports.getGradeFees = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({ message: "Year is required" });
    }
    const fees = await GradeFee.find({ year });
    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: "Error fetching grade fees", error });
  }
};

exports.updateGradeFee = async (req, res) => {
  try {
    const { year, grade, field, value } = req.body;
    let feeDoc = await GradeFee.findOne({ year, grade });

    if (!feeDoc) {
      feeDoc = new GradeFee({ year, grade, fees: {} });
    }

    // Set the fee value in the map
    feeDoc.fees.set(field, value);
    await feeDoc.save();

    res.json(feeDoc);
  } catch (error) {
    res.status(500).json({ message: "Error updating grade fee", error });
  }
};

// --- Installment Plan Controllers ---

exports.getInstallmentPlans = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.json([]);

    const query = { year };
    const plans = await InstallmentPlan.find(query).sort({ createdAt: -1 });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching installment plans", error });
  }
};

exports.createInstallmentPlan = async (req, res) => {
  try {
    const planData = req.body;
    const newPlan = new InstallmentPlan(planData);
    await newPlan.save();
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ message: "Error creating installment plan", error });
  }
};

exports.updateInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const planData = req.body;
    const updatedPlan = await InstallmentPlan.findByIdAndUpdate(
      id,
      planData,
      { new: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ message: "Installment plan not found" });
    }
    res.json(updatedPlan);
  } catch (error) {
    res.status(500).json({ message: "Error updating installment plan", error });
  }
};

exports.deleteInstallmentPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPlan = await InstallmentPlan.findByIdAndDelete(id);
    if (!deletedPlan) {
      return res.status(404).json({ message: "Installment plan not found" });
    }
    res.json({ message: "Installment plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting installment plan", error });
  }
};
// --- Late Fee Policy Controllers ---
exports.getLateFeePolicies = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.json([]);

    const query = { year };
    const policies = await LateFeePolicy.find(query).sort({ createdAt: -1 });
    res.json(policies);
  } catch (error) {
    res.status(500).json({ message: "Error fetching late fee policies", error });
  }
};

exports.createLateFeePolicy = async (req, res) => {
  try {
    const newPolicy = new LateFeePolicy(req.body);
    await newPolicy.save();
    res.status(201).json(newPolicy);
  } catch (error) {
    res.status(500).json({ message: "Error creating late fee policy", error });
  }
};

exports.updateLateFeePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedPolicy = await LateFeePolicy.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedPolicy) return res.status(404).json({ message: "Late fee policy not found" });
    res.json(updatedPolicy);
  } catch (error) {
    res.status(500).json({ message: "Error updating late fee policy", error });
  }
};

exports.deleteLateFeePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPolicy = await LateFeePolicy.findByIdAndDelete(id);
    if (!deletedPolicy) return res.status(404).json({ message: "Late fee policy not found" });
    res.json({ message: "Policy deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting policy", error });
  }
};

// --- Discount Rule Controllers ---
exports.getDiscountRules = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.json([]);

    const query = { year };
    const rules = await DiscountRule.find(query).sort({ createdAt: -1 });
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: "Error fetching discount rules", error });
  }
};

exports.createDiscountRule = async (req, res) => {
  try {
    const newRule = new DiscountRule(req.body);
    await newRule.save();
    res.status(201).json(newRule);
  } catch (error) {
    res.status(500).json({ message: "Error creating discount rule", error });
  }
};

exports.updateDiscountRule = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedRule = await DiscountRule.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedRule) return res.status(404).json({ message: "Discount rule not found" });
    res.json(updatedRule);
  } catch (error) {
    res.status(500).json({ message: "Error updating discount rule", error });
  }
};

exports.deleteDiscountRule = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRule = await DiscountRule.findByIdAndDelete(id);
    if (!deletedRule) return res.status(404).json({ message: "Discount rule not found" });
    res.json({ message: "Discount rule deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting discount rule", error });
  }
};

// --- Fine Controllers ---
exports.getFines = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.json([]);

    const query = { year };
    const fines = await Fine.find(query).sort({ createdAt: -1 });
    res.json(fines);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fines", error });
  }
};

exports.createFine = async (req, res) => {
  try {
    const newFine = new Fine(req.body);
    await newFine.save();
    res.status(201).json(newFine);
  } catch (error) {
    res.status(500).json({ message: "Error creating fine", error });
  }
};

exports.updateFine = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFine = await Fine.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedFine) return res.status(404).json({ message: "Fine not found" });
    res.json(updatedFine);
  } catch (error) {
    res.status(500).json({ message: "Error updating fine", error });
  }
};

exports.deleteFine = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFine = await Fine.findByIdAndDelete(id);
    if (!deletedFine) return res.status(404).json({ message: "Fine not found" });
    res.json({ message: "Fine deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting fine", error });
  }
};

exports.toggleFineStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const fine = await Fine.findById(id);
    if (!fine) return res.status(404).json({ message: "Fine not found" });
    fine.active = !fine.active;
    await fine.save();
    res.json(fine);
  } catch (error) {
    res.status(500).json({ message: "Error toggling fine status", error });
  }
};
// --- Dashboard & Collection ---

exports.getFeesDashboard = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.status(400).json({ message: "No active session found" });

    // 1. Total Collection
    const transactions = await FeeTransaction.find({ year });
    const totalCollection = transactions.reduce((s, t) => s + t.totalAmount, 0);

    // 2. Collection Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionsToday = await FeeTransaction.find({
      year,
      date: { $gte: today }
    });
    const collectionToday = transactionsToday.reduce((s, t) => s + t.totalAmount, 0);

    // 3. Pending & Total Expected (Simplistic approach)
    const studentsList = await Student.find({}).populate("personalInfo.class");
    const gradeFees = await GradeFee.find({ year });

    let totalExpected = 0;
    studentsList.forEach(std => {
      const gName = std.personalInfo.class?.name;
      const gf = gradeFees.find(f => f.grade === gName);
      if (gf && gf.fees) {
        // gf.fees is a Map, sum its values
        for (let [cat, amt] of gf.fees) {
          totalExpected += Number(amt) || 0;
        }
      }
    });

    const pendingFees = totalExpected - totalCollection;

    // 4. Bar Chart Data (Last 5 months)
    const monthlyData = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for (let i = 4; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const m = d.getMonth();
      const y = d.getFullYear();
      const start = new Date(y, m, 1);
      const end = new Date(y, m + 1, 0, 23, 59, 59);

      const mt = await FeeTransaction.find({ date: { $gte: start, $lte: end } });
      monthlyData.push({
        month: monthNames[m],
        collection: mt.reduce((s, t) => s + t.totalAmount, 0)
      });
    }

    // 5. Recent Transactions
    const recent = await FeeTransaction.find({ year })
      .sort({ date: -1 })
      .limit(5)
      .populate('studentId');

    res.json({
      stats: {
        totalCollection,
        collectionToday,
        pendingFees,
        totalExpected,
        totalStudents: studentsList.length
      },
      monthlyData,
      recent: recent.map(r => ({
        name: r.studentId?.personalInfo?.name || "Unknown",
        cls: r.studentId?.personalInfo?.class?.name || "N/A", // Note: r.studentId.personalInfo.class might still need populate or manual find
        amt: `₹${r.totalAmount}`,
        date: r.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        status: r.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard error", error });
  }
};

exports.getStudentFeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    const student = await Student.findById(id).populate("personalInfo.class personalInfo.section");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Calculate Fees structure
    const gName = student.personalInfo.class?.name;
    const gf = await GradeFee.findOne({ year, grade: gName });
    const transactions = await FeeTransaction.find({ studentId: id, year });

    const feesList = [];
    if (gf && gf.fees) {
      for (let [category, amount] of gf.fees) {
        const paidForCategory = transactions.reduce((acc, t) => {
          const match = t.fees.find(f => f.category === category);
          return acc + (match ? match.amount : 0);
        }, 0);

        feesList.push({
          category,
          amount,
          paid: paidForCategory,
          balance: amount - paidForCategory,
          status: (amount - paidForCategory) <= 0 ? "Paid" : "Unpaid"
        });
      }
    }

    res.json({
      student: {
        name: student.personalInfo.name,
        class: student.personalInfo.class?.name,
        section: student.personalInfo.section?.name,
        father: student.parent?.fatherName || "N/A",
        admission: student.personalInfo.stdId,
        roll: student.personalInfo.rollNo,
        mobile: student.personalInfo.contactDetails?.mobileNumber || "N/A",
        id: student._id
      },
      feesData: feesList
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching student fee profile", error });
  }
};

exports.recordFeePayment = async (req, res) => {
  try {
    const { studentId, year, fees, totalAmount, paymentMethod, remark } = req.body;

    const transaction = new FeeTransaction({
      studentId,
      year,
      fees,
      totalAmount,
      paymentMethod,
      remark,
      status: 'Paid'
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Payment recording failed", error });
  }
};

exports.searchFeeTransactions = async (req, res) => {
  try {
    const { search, paymentMethod } = req.query;
    let query = {};
    if (paymentMethod && paymentMethod !== "All") {
      query.paymentMethod = paymentMethod;
    }
    if (search) {
      const students = await Student.find({
        $or: [
          { "personalInfo.name": { $regex: search, $options: "i" } },
          { "personalInfo.stdId": { $regex: search, $options: "i" } }
        ]
      });
      const studentIds = students.map(s => s._id);
      query.studentId = { $in: studentIds };
    }
    const transactions = await FeeTransaction.find(query)
      .sort({ date: -1 })
      .populate({
        path: "studentId",
        populate: { path: "personalInfo.class personalInfo.section" }
      });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error searching transactions", error });
  }
};

exports.getDueFees = async (req, res) => {
  try {
    const { class: className, section: sectionName } = req.query;
    let studentQuery = {};

    const studentsList = await Student.find(studentQuery)
      .populate("personalInfo.class personalInfo.section");

    const active = await AcademicYear.findOne({ isActive: true });
    const year = active?.label;
    if (!year) return res.json([]);

    const gradeFees = await GradeFee.find({ year });

    const dueList = [];
    for (const student of studentsList) {
      if (className && className !== "All" && student.personalInfo.class?.name !== className) continue;
      if (sectionName && sectionName !== "All" && student.personalInfo.section?.name !== sectionName) continue;

      const gName = student.personalInfo.class?.name;
      if (!gName) continue;

      const gf = gradeFees.find(f => f.grade === gName);
      if (!gf) continue;

      const transactions = await FeeTransaction.find({ studentId: student._id, year });

      let totalExpected = 0;
      if (gf.fees) {
        for (let [cat, amt] of gf.fees) {
          totalExpected += Number(amt) || 0;
        }
      }

      const totalPaid = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
      const balance = totalExpected - totalPaid;

      if (balance > 0) {
        dueList.push({
          student: {
            id: student._id,
            name: student.personalInfo.name,
            class: student.personalInfo.class?.name,
            section: student.personalInfo.section?.name,
            admission: student.personalInfo.stdId,
            mobile: student.personalInfo.contactDetails?.mobileNumber || "N/A"
          },
          totalExpected,
          totalPaid,
          balance
        });
      }
    }
    res.json(dueList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching due fees", error });
  }
};


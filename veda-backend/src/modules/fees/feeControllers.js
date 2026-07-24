const mongoose = require("mongoose");
const {
  AcademicYear,
  FeeCategory,
  GradeFee,
  InstallmentPlan,
  LateFeePolicy,
  DiscountRule,
  Fine,
  FeeTransaction,
  FeeLedger,
  FeeAuditLog
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

async function calculateStudentFees(student, year) {
  const gName = student.personalInfo.class?.name || (student.personalInfo.class && student.personalInfo.class.name);
  const gf = await GradeFee.findOne({ year, grade: gName });
  const transactions = await FeeTransaction.find({ studentId: student._id, year, status: 'Paid' });
  const discountRules = await DiscountRule.find({ year, active: true });
  const lateFeePolicies = await LateFeePolicy.find({ year });
  const installmentPlans = await InstallmentPlan.find({ year });

  let transportFee = 0;
  try {
    const { TransportStudent, RouteStop } = require("../transport/transportModels");
    const transportAssignment = await TransportStudent.findOne({ studentId: student._id, status: 'Active' });
    if (transportAssignment) {
      const routeStop = await RouteStop.findOne({
        route: transportAssignment.routeId,
        stop: transportAssignment.pickupPointId
      });
      if (routeStop && routeStop.fee) {
        transportFee = Number(routeStop.fee) || 0;
      }
    }
  } catch (err) {
    console.error("Error reading transport stop fee in helper:", err);
  }

  let hostelFee = 0;
  if (student.personalInfo?.hostel?.active) {
    hostelFee = Number(student.personalInfo.hostel.fee) || 0;
  }

  const studentOptionalFees = student.personalInfo?.optionalFees || [];
  const allCategories = await FeeCategory.find({ year, active: true });
  const dynamicFees = new Map();

  if (gf && gf.fees) {
    for (let [catName, amt] of gf.fees) {
      const category = allCategories.find(c => c.name === catName);
      if (category) {
        if (category.optional) {
          if (studentOptionalFees.includes(catName)) {
            dynamicFees.set(catName, Number(amt) || 0);
          }
        } else {
          let applicable = true;
          if (category.applicability && category.applicability !== "All") {
            const studentCategory = student.personalInfo.category || student.curriculum?.admissionType || "General";
            if (category.applicability.toLowerCase() !== studentCategory.toLowerCase()) {
              applicable = false;
            }
          }
          if (applicable) {
            dynamicFees.set(catName, Number(amt) || 0);
          }
        }
      } else {
        dynamicFees.set(catName, Number(amt) || 0);
      }
    }
  }

  if (transportFee > 0) {
    const transCat = allCategories.find(c => c.name.toLowerCase().includes("transport") || c.code.toLowerCase().includes("transport"));
    let transportCategoryName = transCat ? transCat.name : "Transport Fee";
    dynamicFees.set(transportCategoryName, transportFee);
  }

  if (hostelFee > 0) {
    const hostelCat = allCategories.find(c => c.name.toLowerCase().includes("hostel") || c.code.toLowerCase().includes("hostel"));
    let hostelCategoryName = hostelCat ? hostelCat.name : "Hostel Fee";
    dynamicFees.set(hostelCategoryName, hostelFee);
  }

  let totalExpected = 0;
  let totalDiscounts = 0;
  let totalFines = 0;
  let totalOverdue = 0;

  const hasSibling = student.parent ? (await Student.countDocuments({ parent: student.parent, _id: { $ne: student._id } })) > 0 : false;
  const studentCategory = student.personalInfo.category || student.curriculum?.admissionType || "General";
  const isRTE = studentCategory.toLowerCase() === "rte";

  for (let [category, amount] of dynamicFees) {
    totalExpected += amount;

    const paidForCategory = transactions.reduce((acc, t) => {
      const match = t.fees?.find(f => f.category === category);
      return acc + (match ? match.amount : 0);
    }, 0);

    let discountAmount = 0;
    if (isRTE && category.toLowerCase().includes("tuition")) {
      discountAmount = amount;
    } else {
      const applicableDiscounts = discountRules.filter(d => {
        const matchesCat = d.categories.length === 0 || d.categories.includes(category);
        const matchesGrade = d.grades.length === 0 || d.grades.includes(gName);
        let matchesBasis = true;
        if (d.basis === "EWS / RTE" && !isRTE) matchesBasis = false;
        if (d.name?.toLowerCase().includes("sibling") && !hasSibling) matchesBasis = false;
        return matchesCat && matchesGrade && matchesBasis;
      });

      let nonStackableMax = 0;
      let stackableSum = 0;
      applicableDiscounts.forEach(d => {
        let calc = 0;
        if (d.type === "Percentage (%)") {
          calc = (d.value * amount) / 100;
        } else {
          calc = d.value;
        }
        if (d.maxCap > 0 && calc > d.maxCap) calc = d.maxCap;

        if (d.stackable) {
          stackableSum += calc;
        } else {
          if (calc > nonStackableMax) nonStackableMax = calc;
        }
      });
      discountAmount = stackableSum + nonStackableMax;
      if (discountAmount > amount) discountAmount = amount;
    }
    totalDiscounts += discountAmount;

    const plan = installmentPlans.find(p => p.category === category);
    const policy = lateFeePolicies.find(p => p.category === category);
    let lateFineTotal = 0;

    const today = new Date();

    if (plan && plan.slices && plan.slices.length > 0) {
      let allocatedPaid = paidForCategory;
      const activeYear = await AcademicYear.findOne({ label: year });
      const academicYearStart = activeYear ? new Date(activeYear.startDate) : new Date();

      plan.slices.forEach(slice => {
        const sliceAmount = (slice.percent / 100) * amount;
        const sliceDiscount = (slice.percent / 100) * discountAmount;
        const sliceNetPayable = Math.max(0, sliceAmount - sliceDiscount);

        let slicePaid = 0;
        if (allocatedPaid >= sliceNetPayable) {
          slicePaid = sliceNetPayable;
          allocatedPaid -= sliceNetPayable;
        } else {
          slicePaid = allocatedPaid;
          allocatedPaid = 0;
        }

        const sliceBalance = Math.max(0, sliceNetPayable - slicePaid);
        const sliceDueDate = new Date(academicYearStart);
        sliceDueDate.setDate(sliceDueDate.getDate() + Number(slice.days || 0));

        let sliceFine = 0;
        if (policy && sliceBalance > 0 && today > sliceDueDate) {
          const diffTime = Math.abs(today - sliceDueDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const graceDays = policy.graceDays || 0;
          if (diffDays > graceDays) {
            const overdueDays = diffDays - graceDays;
            if (policy.type === "Flat") {
              sliceFine = policy.amount;
            } else if (policy.type === "Percentage") {
              sliceFine = (policy.amount * sliceBalance) / 100;
            } else if (policy.type === "Daily") {
              sliceFine = overdueDays * policy.amount;
            }
            if (policy.maxCap > 0 && sliceFine > policy.maxCap) {
              sliceFine = policy.maxCap;
            }
          }
        }
        lateFineTotal += sliceFine;

        if (today > sliceDueDate && (sliceBalance + sliceFine) > 0) {
          totalOverdue += (sliceBalance + sliceFine);
        }
      });
    } else {
      const activeYear = await AcademicYear.findOne({ label: year });
      let dueDate = activeYear && activeYear.terms && activeYear.terms.length > 0 ? new Date(activeYear.terms[0].dueDate) : new Date();
      let fineAmount = 0;

      const balanceWithoutFine = Math.max(0, amount - paidForCategory - discountAmount);

      if (policy && balanceWithoutFine > 0 && today > dueDate) {
        const diffTime = Math.abs(today - dueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const graceDays = policy.graceDays || 0;
        if (diffDays > graceDays) {
          const overdueDays = diffDays - graceDays;
          if (policy.type === "Flat") {
            fineAmount = policy.amount;
          } else if (policy.type === "Percentage") {
            fineAmount = (policy.amount * balanceWithoutFine) / 100;
          } else if (policy.type === "Daily") {
            fineAmount = overdueDays * policy.amount;
          }
          if (policy.maxCap > 0 && fineAmount > policy.maxCap) {
            fineAmount = policy.maxCap;
          }
        }
      }
      lateFineTotal = fineAmount;

      if (today > dueDate && (balanceWithoutFine + fineAmount) > 0) {
        totalOverdue += (balanceWithoutFine + fineAmount);
      }
    }
    totalFines += lateFineTotal;
  }

  const totalPaid = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
  const totalPayable = Math.max(0, totalExpected - totalDiscounts + totalFines);
  const balance = Math.max(0, totalPayable - totalPaid);

  return {
    totalExpected,
    totalDiscounts,
    totalFines,
    totalPaid,
    totalPayable,
    balance,
    overdue: totalOverdue
  };
}

exports.getFeesDashboard = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.status(400).json({ message: "No active session found" });

    // 1. Total Collection
    const transactions = await FeeTransaction.find({ year, status: 'Paid' });
    const totalCollection = transactions.reduce((s, t) => s + t.totalAmount, 0);

    // 2. Collection Today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const transactionsToday = await FeeTransaction.find({
      year,
      status: 'Paid',
      date: { $gte: today }
    });
    const collectionToday = transactionsToday.reduce((s, t) => s + t.totalAmount, 0);

    // 3. Pending & Total Expected (Dynamic calculation)
    const studentsList = await Student.find({}).populate("personalInfo.class");

    let totalExpected = 0;
    let pendingFees = 0;
    let overdue = 0;

    for (const std of studentsList) {
      const feesSummary = await calculateStudentFees(std, year);
      totalExpected += feesSummary.totalPayable; // dynamic expected amount includes fines minus discounts
      pendingFees += feesSummary.balance;
      overdue += feesSummary.overdue;
    }

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

      const mt = await FeeTransaction.find({ status: 'Paid', date: { $gte: start, $lte: end } });
      monthlyData.push({
        month: monthNames[m],
        collection: mt.reduce((s, t) => s + t.totalAmount, 0)
      });
    }

    // 5. Recent Transactions
    const recent = await FeeTransaction.find({ year, status: 'Paid' })
      .sort({ date: -1 })
      .limit(5)
      .populate('studentId');

    res.json({
      stats: {
        totalCollection,
        collectionToday,
        pendingFees,
        overdue,
        totalExpected,
        totalStudents: studentsList.length
      },
      monthlyData,
      recent: recent.map(r => ({
        name: r.studentId?.personalInfo?.name || "Unknown",
        cls: r.studentId?.personalInfo?.class?.name || "N/A",
        amt: `₹${r.totalAmount}`,
        date: r.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        status: r.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Dashboard error", error });
  }
};

async function initializeLedgerDebits(studentId, year) {
  const debitCount = await FeeLedger.countDocuments({ studentId, year, type: 'Debit' });
  if (debitCount > 0) return;

  const student = await Student.findById(studentId).populate("personalInfo.class personalInfo.section");
  if (!student) return;

  const gName = student.personalInfo.class?.name;
  const gf = await GradeFee.findOne({ year, grade: gName });
  const allCategories = await FeeCategory.find({ year, active: true });

  let transportFee = 0;
  let transportCategoryName = "Transport Fee";
  try {
    const { TransportStudent, RouteStop } = require("../transport/transportModels");
    const transportAssignment = await TransportStudent.findOne({ studentId, status: 'Active' });
    if (transportAssignment) {
      const routeStop = await RouteStop.findOne({
        route: transportAssignment.routeId,
        stop: transportAssignment.pickupPointId
      });
      if (routeStop && routeStop.fee) {
        transportFee = Number(routeStop.fee) || 0;
      }
    }
  } catch (err) {
    console.error("Error reading transport stop fee in ledger init:", err);
  }

  let hostelFee = 0;
  if (student.personalInfo?.hostel?.active) {
    hostelFee = Number(student.personalInfo.hostel.fee) || 0;
  }

  const studentOptionalFees = student.personalInfo?.optionalFees || [];

  if (gf && gf.fees) {
    for (let [catName, amt] of gf.fees) {
      const category = allCategories.find(c => c.name === catName);
      if (category) {
        if (category.optional) {
          if (studentOptionalFees.includes(catName)) {
            await FeeLedger.create({
              studentId,
              year,
              type: 'Debit',
              category: catName,
              amount: Number(amt) || 0,
              description: "Fee Assignment (Optional)"
            });
          }
        } else {
          let applicable = true;
          if (category.applicability && category.applicability !== "All") {
            const studentCategory = student.personalInfo.category || student.curriculum?.admissionType || "General";
            if (category.applicability.toLowerCase() !== studentCategory.toLowerCase()) {
              applicable = false;
            }
          }
          if (applicable) {
            await FeeLedger.create({
              studentId,
              year,
              type: 'Debit',
              category: catName,
              amount: Number(amt) || 0,
              description: "Fee Assignment"
            });
          }
        }
      }
    }
  }

  if (transportFee > 0) {
    const transCat = allCategories.find(c => c.name.toLowerCase().includes("transport") || c.code.toLowerCase().includes("transport"));
    if (transCat) transportCategoryName = transCat.name;
    await FeeLedger.create({
      studentId,
      year,
      type: 'Debit',
      category: transportCategoryName,
      amount: transportFee,
      description: "Fee Assignment (Transport)"
    });
  }

  if (hostelFee > 0) {
    let hostelCategoryName = "Hostel Fee";
    const hostelCat = allCategories.find(c => c.name.toLowerCase().includes("hostel") || c.code.toLowerCase().includes("hostel"));
    if (hostelCat) hostelCategoryName = hostelCat.name;
    await FeeLedger.create({
      studentId,
      year,
      type: 'Debit',
      category: hostelCategoryName,
      amount: hostelFee,
      description: "Fee Assignment (Hostel)"
    });
  }
}

exports.getStudentFeeProfile = async (req, res) => {
  try {
    const { id } = req.params;
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    if (!year) return res.status(400).json({ message: "No active academic year found" });

    const student = await Student.findById(id).populate("personalInfo.class personalInfo.section");
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Calculate Fees structure
    const gName = student.personalInfo.class?.name;
    const gf = await GradeFee.findOne({ year, grade: gName });
    const transactions = await FeeTransaction.find({ studentId: id, year });
    const discountRules = await DiscountRule.find({ year, active: true });
    const lateFeePolicies = await LateFeePolicy.find({ year });
    const installmentPlans = await InstallmentPlan.find({ year });

    let transportFee = 0;
    let transportCategoryName = "Transport Fee";
    try {
      const { TransportStudent, RouteStop } = require("../transport/transportModels");
      const transportAssignment = await TransportStudent.findOne({ studentId: id, status: 'Active' });
      if (transportAssignment) {
        const routeStop = await RouteStop.findOne({
          route: transportAssignment.routeId,
          stop: transportAssignment.pickupPointId
        });
        if (routeStop && routeStop.fee) {
          transportFee = Number(routeStop.fee) || 0;
        }
      }
    } catch (err) {
      console.error("Error reading transport assignment:", err);
    }

    let hostelFee = 0;
    if (student.personalInfo?.hostel?.active) {
      hostelFee = Number(student.personalInfo.hostel.fee) || 0;
    }

    const studentOptionalFees = student.personalInfo?.optionalFees || [];
    const allCategories = await FeeCategory.find({ year, active: true });
    const dynamicFees = new Map();

    if (gf && gf.fees) {
      for (let [catName, amt] of gf.fees) {
        const category = allCategories.find(c => c.name === catName);
        if (category) {
          if (category.optional) {
            if (studentOptionalFees.includes(catName)) {
              dynamicFees.set(catName, Number(amt) || 0);
            }
          } else {
            let applicable = true;
            if (category.applicability && category.applicability !== "All") {
              const studentCategory = student.personalInfo.category || student.curriculum?.admissionType || "General";
              if (category.applicability.toLowerCase() !== studentCategory.toLowerCase()) {
                applicable = false;
              }
            }
            if (applicable) {
              dynamicFees.set(catName, Number(amt) || 0);
            }
          }
        } else {
          dynamicFees.set(catName, Number(amt) || 0);
        }
      }
    }

    if (transportFee > 0) {
      const transCat = allCategories.find(c => c.name.toLowerCase().includes("transport") || c.code.toLowerCase().includes("transport"));
      if (transCat) transportCategoryName = transCat.name;
      dynamicFees.set(transportCategoryName, transportFee);
    }

    if (hostelFee > 0) {
      let hostelCategoryName = "Hostel Fee";
      const hostelCat = allCategories.find(c => c.name.toLowerCase().includes("hostel") || c.code.toLowerCase().includes("hostel"));
      if (hostelCat) hostelCategoryName = hostelCat.name;
      dynamicFees.set(hostelCategoryName, hostelFee);
    }

    const feesList = [];
    const installmentList = [];

    const hasSibling = student.parent ? (await Student.countDocuments({ parent: student.parent, _id: { $ne: id } })) > 0 : false;
    const studentCategory = student.personalInfo.category || student.curriculum?.admissionType || "General";
    const isRTE = studentCategory.toLowerCase() === "rte";

    for (let [category, amount] of dynamicFees) {
      const paidForCategory = transactions.reduce((acc, t) => {
        if (t.status !== 'Paid') return acc;
        const match = t.fees?.find(f => f.category === category);
        return acc + (match ? match.amount : 0);
      }, 0);

      let discountAmount = 0;
      if (isRTE && category.toLowerCase().includes("tuition")) {
        discountAmount = amount;
      } else {
        const applicableDiscounts = discountRules.filter(d => {
          const matchesCat = d.categories.length === 0 || d.categories.includes(category);
          const matchesGrade = d.grades.length === 0 || d.grades.includes(gName);

          let matchesBasis = true;
          if (d.basis === "EWS / RTE" && !isRTE) matchesBasis = false;
          if (d.name?.toLowerCase().includes("sibling") && !hasSibling) matchesBasis = false;

          return matchesCat && matchesGrade && matchesBasis;
        });

        let nonStackableMax = 0;
        let stackableSum = 0;
        applicableDiscounts.forEach(d => {
          let calc = 0;
          if (d.type === "Percentage (%)") {
            calc = (d.value * amount) / 100;
          } else {
            calc = d.value;
          }
          if (d.maxCap > 0 && calc > d.maxCap) calc = d.maxCap;

          if (d.stackable) {
            stackableSum += calc;
          } else {
            if (calc > nonStackableMax) nonStackableMax = calc;
          }
        });
        discountAmount = stackableSum + nonStackableMax;
        if (discountAmount > amount) discountAmount = amount;
      }

      const plan = installmentPlans.find(p => p.category === category);
      let lateFineTotal = 0;
      const policy = lateFeePolicies.find(p => p.category === category);

      if (plan && plan.slices && plan.slices.length > 0) {
        let allocatedPaid = paidForCategory;
        const activeYear = await AcademicYear.findOne({ label: year });
        const academicYearStart = activeYear ? new Date(activeYear.startDate) : new Date();

        plan.slices.forEach(slice => {
          const sliceAmount = (slice.percent / 100) * amount;
          const sliceDiscount = (slice.percent / 100) * discountAmount;
          const sliceNetPayable = Math.max(0, sliceAmount - sliceDiscount);

          let slicePaid = 0;
          if (allocatedPaid >= sliceNetPayable) {
            slicePaid = sliceNetPayable;
            allocatedPaid -= sliceNetPayable;
          } else {
            slicePaid = allocatedPaid;
            allocatedPaid = 0;
          }

          const sliceBalance = Math.max(0, sliceNetPayable - slicePaid);
          const sliceDueDate = new Date(academicYearStart);
          sliceDueDate.setDate(sliceDueDate.getDate() + Number(slice.days || 0));

          let sliceStatus = "Unpaid";
          if (sliceBalance <= 0) sliceStatus = "Paid";
          else if (slicePaid > 0) sliceStatus = "Partially Paid";

          let sliceFine = 0;
          const today = new Date();
          if (policy && sliceBalance > 0 && today > sliceDueDate) {
            const diffTime = Math.abs(today - sliceDueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const graceDays = policy.graceDays || 0;
            if (diffDays > graceDays) {
              const overdueDays = diffDays - graceDays;
              if (policy.type === "Flat") {
                sliceFine = policy.amount;
              } else if (policy.type === "Percentage") {
                sliceFine = (policy.amount * sliceBalance) / 100;
              } else if (policy.type === "Daily") {
                sliceFine = overdueDays * policy.amount;
              }
              if (policy.maxCap > 0 && sliceFine > policy.maxCap) {
                sliceFine = policy.maxCap;
              }
            }
          }

          lateFineTotal += sliceFine;

          installmentList.push({
            category,
            installmentName: slice.label,
            dueDate: sliceDueDate.toISOString().split("T")[0],
            amount: sliceAmount,
            discount: sliceDiscount,
            payable: sliceNetPayable,
            paid: slicePaid,
            fine: sliceFine,
            balance: sliceBalance + sliceFine,
            status: sliceStatus
          });
        });

      } else {
        const activeYear = await AcademicYear.findOne({ label: year });
        let dueDate = activeYear && activeYear.terms && activeYear.terms.length > 0 ? new Date(activeYear.terms[0].dueDate) : new Date();
        const today = new Date();
        let fineAmount = 0;

        const balanceWithoutFine = Math.max(0, amount - paidForCategory - discountAmount);

        if (policy && balanceWithoutFine > 0 && today > dueDate) {
          const diffTime = Math.abs(today - dueDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const graceDays = policy.graceDays || 0;
          if (diffDays > graceDays) {
            const overdueDays = diffDays - graceDays;
            if (policy.type === "Flat") {
              fineAmount = policy.amount;
            } else if (policy.type === "Percentage") {
              fineAmount = (policy.amount * balanceWithoutFine) / 100;
            } else if (policy.type === "Daily") {
              fineAmount = overdueDays * policy.amount;
            }
            if (policy.maxCap > 0 && fineAmount > policy.maxCap) {
              fineAmount = policy.maxCap;
            }
          }
        }

        lateFineTotal = fineAmount;

        installmentList.push({
          category,
          installmentName: "Full Payment",
          dueDate: dueDate.toISOString().split("T")[0],
          amount,
          discount: discountAmount,
          payable: Math.max(0, amount - discountAmount),
          paid: paidForCategory,
          fine: fineAmount,
          balance: balanceWithoutFine + fineAmount,
          status: balanceWithoutFine <= 0 ? "Paid" : (paidForCategory > 0 ? "Partially Paid" : "Unpaid")
        });
      }

      const balance = Math.max(0, amount - paidForCategory - discountAmount + lateFineTotal);

      feesList.push({
        category,
        amount,
        paid: paidForCategory,
        discount: discountAmount,
        fine: lateFineTotal,
        balance,
        status: balance <= 0 ? "Paid" : "Unpaid"
      });
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
        id: student._id,
        category: studentCategory,
        rte: isRTE ? "Yes" : "No"
      },
      feesData: feesList,
      installments: installmentList,
      timeline: transactions.map(t => ({
        id: t._id,
        date: t.date,
        totalAmount: t.totalAmount,
        paymentMethod: t.paymentMethod,
        remark: t.remark
      }))
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching student fee profile", error: error.message });
  }
};

exports.recordFeePayment = async (req, res) => {
  try {
    const { studentId, year, fees, totalAmount, paymentMethod, remark, performedBy } = req.body;

    if (!studentId || !year || !totalAmount || !fees || !Array.isArray(fees)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction payload. Ensure studentId, year, totalAmount, and fees are provided."
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Transaction total amount must be positive."
      });
    }

    const duplicateThreshold = new Date(Date.now() - 60000);
    const duplicate = await FeeTransaction.findOne({
      studentId,
      totalAmount,
      year,
      date: { $gte: duplicateThreshold }
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Duplicate payment transaction detected within a short interval (60 seconds). Please check payment logs."
      });
    }

    const transaction = new FeeTransaction({
      studentId,
      year,
      fees,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      remark,
      status: 'Paid'
    });

    await transaction.save();

    await initializeLedgerDebits(studentId, year);

    for (let f of fees) {
      await FeeLedger.create({
        studentId,
        year,
        type: 'Credit',
        category: f.category,
        amount: f.amount,
        transactionId: transaction._id,
        description: remark || "Fee Payment"
      });
    }

    const auditLog = new FeeAuditLog({
      action: "Payment Recorded",
      performedBy: performedBy || req.user?.username || "Admin",
      details: `Recorded payment of ₹${totalAmount} via ${paymentMethod || 'Cash'} for student ID ${studentId}. Paid fees breakdown: ${JSON.stringify(fees)}`,
      studentId,
      date: new Date()
    });
    await auditLog.save();

    const student = await Student.findById(studentId);
    if (student) {
      const clsName = student.personalInfo.class ? (await mongoose.model('Class').findById(student.personalInfo.class))?.name : "";
      const gf = await GradeFee.findOne({ year, grade: clsName });
      const transactions = await FeeTransaction.find({ studentId, year, status: 'Paid' });

      let totalExpected = 0;
      if (gf && gf.fees) {
        for (let [cat, amt] of gf.fees) {
          totalExpected += Number(amt) || 0;
        }
      }
      const totalPaid = transactions.reduce((acc, t) => acc + t.totalAmount, 0);
      if (totalPaid >= totalExpected) {
        student.personalInfo.fees = "Paid";
      } else {
        student.personalInfo.fees = "Due";
      }
      await student.save();
    }

    res.status(201).json(transaction);
  } catch (error) {
    console.error("Payment recording failed:", error);
    res.status(500).json({ message: "Payment recording failed", error: error.message });
  }
};

exports.getPaymentReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await FeeTransaction.findById(id).populate({
      path: "studentId",
      populate: { path: "personalInfo.class personalInfo.section" }
    });
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    res.json({
      receiptNo: transaction._id.toString().substring(transaction._id.toString().length - 8).toUpperCase(),
      date: transaction.date,
      paymentMethod: transaction.paymentMethod,
      totalAmount: transaction.totalAmount,
      remark: transaction.remark,
      status: transaction.status,
      student: {
        id: transaction.studentId?._id,
        name: transaction.studentId?.personalInfo?.name,
        stdId: transaction.studentId?.personalInfo?.stdId,
        class: transaction.studentId?.personalInfo?.class?.name,
        section: transaction.studentId?.personalInfo?.section?.name,
        rollNo: transaction.studentId?.personalInfo?.rollNo
      },
      fees: transaction.fees
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching payment receipt", error: error.message });
  }
};

exports.getStudentFeeLedger = async (req, res) => {
  try {
    const { id } = req.params;
    let { year } = req.query;
    if (!year || year === 'undefined' || year === 'null') {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }
    if (!year) return res.status(400).json({ message: "Active year required" });

    await initializeLedgerDebits(id, year);

    const ledgerEntries = await FeeLedger.find({ studentId: id, year }).sort({ date: 1 });
    res.json(ledgerEntries);
  } catch (error) {
    res.status(500).json({ message: "Error fetching fee ledger", error: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Paid', 'Cancelled', 'Pending'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const transaction = await FeeTransaction.findById(id);
    if (!transaction) return res.status(404).json({ message: "Transaction not found" });

    const oldStatus = transaction.status;
    transaction.status = status;
    await transaction.save();

    const auditLog = new FeeAuditLog({
      action: "Payment Status Updated",
      performedBy: req.user?.username || "Admin",
      details: `Updated payment ID ${id} status from ${oldStatus} to ${status}`,
      studentId: transaction.studentId,
      date: new Date()
    });
    await auditLog.save();

    if (status === 'Cancelled') {
      await FeeLedger.deleteMany({ transactionId: id });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Error updating payment status", error: error.message });
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

    const dueList = [];
    for (const student of studentsList) {
      if (className && className !== "All" && student.personalInfo.class?.name !== className) continue;
      if (sectionName && sectionName !== "All" && student.personalInfo.section?.name !== sectionName) continue;

      const gName = student.personalInfo.class?.name;
      if (!gName) continue;

      const feesSummary = await calculateStudentFees(student, year);

      if (feesSummary.balance > 0) {
        dueList.push({
          student: {
            id: student._id,
            name: student.personalInfo.name,
            class: student.personalInfo.class?.name,
            section: student.personalInfo.section?.name,
            admission: student.personalInfo.stdId,
            mobile: student.personalInfo.contactDetails?.mobileNumber || "N/A"
          },
          totalExpected: feesSummary.totalPayable,
          totalPaid: feesSummary.totalPaid,
          balance: feesSummary.balance
        });
      }
    }
    res.json(dueList);
  } catch (error) {
    res.status(500).json({ message: "Error fetching due fees", error });
  }
};

// --- Report Controllers ---

exports.getDailyCollectionReport = async (req, res) => {
  try {
    const { date } = req.query;
    let targetDate = new Date();
    if (date) {
      targetDate = new Date(date);
    }
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const transactions = await FeeTransaction.find({
      date: { $gte: start, $lte: end }
    }).populate({
      path: "studentId",
      populate: { path: "personalInfo.class" }
    });

    const totalCollected = transactions.reduce((sum, t) => sum + t.totalAmount, 0);
    const modeBreakdown = {};
    transactions.forEach(t => {
      const mode = t.paymentMethod || "Cash";
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + t.totalAmount;
    });

    res.json({
      success: true,
      reportDate: start.toISOString().split("T")[0],
      totalCollected,
      transactionCount: transactions.length,
      modeBreakdown,
      transactions: transactions.map(t => ({
        receiptNo: t._id.substring(t._id.length - 8).toUpperCase(),
        studentName: t.studentId?.personalInfo?.name || "Unknown",
        class: t.studentId?.personalInfo?.class?.name || "N/A",
        amount: t.totalAmount,
        mode: t.paymentMethod,
        date: t.date,
        remark: t.remark
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating daily collection report", error });
  }
};

exports.getMonthlyCollectionReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const today = new Date();
    const targetMonth = month ? parseInt(month) - 1 : today.getMonth();
    const targetYear = year ? parseInt(year) : today.getFullYear();

    const start = new Date(targetYear, targetMonth, 1);
    const end = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    const transactions = await FeeTransaction.find({
      date: { $gte: start, $lte: end }
    }).populate({
      path: "studentId",
      populate: { path: "personalInfo.class" }
    });

    const totalCollected = transactions.reduce((sum, t) => sum + t.totalAmount, 0);

    // Group by day of month
    const dailyMap = {};
    transactions.forEach(t => {
      const day = new Date(t.date).getDate();
      dailyMap[day] = (dailyMap[day] || 0) + t.totalAmount;
    });

    const dailyTrend = [];
    const daysInMonth = end.getDate();
    for (let day = 1; day <= daysInMonth; day++) {
      dailyTrend.push({
        day,
        amount: dailyMap[day] || 0
      });
    }

    res.json({
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      totalCollected,
      transactionCount: transactions.length,
      dailyTrend
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating monthly collection report", error });
  }
};

exports.getFeeDueReport = async (req, res) => {
  return exports.getDueFees(req, res);
};

exports.getClassWiseCollectionReport = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    const transactions = await FeeTransaction.find({ year }).populate({
      path: "studentId",
      populate: { path: "personalInfo.class" }
    });

    const classSummary = {};
    transactions.forEach(t => {
      const cName = t.studentId?.personalInfo?.class?.name || "Unassigned";
      classSummary[cName] = (classSummary[cName] || 0) + t.totalAmount;
    });

    res.json({
      success: true,
      year,
      classSummary
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating class-wise collection report", error });
  }
};

exports.getPaymentModeReport = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    const transactions = await FeeTransaction.find({ year });
    const modeSummary = {};
    transactions.forEach(t => {
      const mode = t.paymentMethod || "Cash";
      modeSummary[mode] = (modeSummary[mode] || 0) + t.totalAmount;
    });

    res.json({
      success: true,
      year,
      modeSummary
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating payment mode report", error });
  }
};

exports.getFineCollectionReport = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    const transactions = await FeeTransaction.find({ year }).populate({
      path: "studentId",
      populate: { path: "personalInfo.class" }
    });

    let totalFineCollected = 0;
    const fineList = [];

    transactions.forEach(t => {
      let transactionFine = 0;
      t.fees?.forEach(f => {
        if (f.category.toLowerCase().includes("fine") || f.category.toLowerCase().includes("late")) {
          transactionFine += f.amount;
        }
      });

      if (transactionFine > 0) {
        totalFineCollected += transactionFine;
        fineList.push({
          receiptNo: t._id.substring(t._id.length - 8).toUpperCase(),
          studentName: t.studentId?.personalInfo?.name || "Unknown",
          class: t.studentId?.personalInfo?.class?.name || "N/A",
          fineAmount: transactionFine,
          date: t.date
        });
      }
    });

    res.json({
      success: true,
      year,
      totalFineCollected,
      fines: fineList
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating fine collection report", error });
  }
};

exports.getDiscountReport = async (req, res) => {
  try {
    let { year } = req.query;
    if (!year) {
      const active = await AcademicYear.findOne({ isActive: true });
      year = active?.label;
    }

    const transactions = await FeeTransaction.find({ year }).populate({
      path: "studentId",
      populate: { path: "personalInfo.class" }
    });

    let totalDiscountsAmount = 0;
    const discountList = [];

    transactions.forEach(t => {
      let transactionDiscount = 0;
      t.fees?.forEach(f => {
        if (f.category.toLowerCase().includes("discount") || f.category.toLowerCase().includes("concession")) {
          transactionDiscount += f.amount;
        }
      });

      if (transactionDiscount > 0) {
        totalDiscountsAmount += transactionDiscount;
        discountList.push({
          receiptNo: t._id.substring(t._id.length - 8).toUpperCase(),
          studentName: t.studentId?.personalInfo?.name || "Unknown",
          class: t.studentId?.personalInfo?.class?.name || "N/A",
          discountAmount: transactionDiscount,
          date: t.date,
          remark: t.remark
        });
      }
    });

    res.json({
      success: true,
      year,
      totalDiscountsAmount,
      discounts: discountList
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating discount report", error });
  }
};


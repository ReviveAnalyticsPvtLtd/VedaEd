const mongoose = require("mongoose");
const connectDb = require("../src/config/db");
const Student = require("../src/modules/student/studentModels");
const Class = require("../src/modules/class/classSchema");
const Section = require("../src/modules/section/sectionSchema");
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
} = require("../src/modules/fees/feeModels");
const { TransportStudent, Route, PickupPoint, RouteStop } = require("../src/modules/transport/transportModels");
const feeControllers = require("../src/modules/fees/feeControllers");

async function run() {
  console.log("Connecting to database...");
  await connectDb();
  console.log("Database connected successfully.");

  // Clear existing test data
  const testSuffix = "_test_integration";
  console.log("Cleaning up previous test data if any...");
  await Student.deleteMany({ "personalInfo.name": new RegExp(testSuffix) });
  await Class.deleteMany({ name: new RegExp(testSuffix) });
  await Section.deleteMany({ name: new RegExp(testSuffix) });
  await AcademicYear.deleteMany({ label: new RegExp(testSuffix) });
  await FeeCategory.deleteMany({ name: new RegExp(testSuffix) });
  await GradeFee.deleteMany({ grade: new RegExp(testSuffix) });
  await InstallmentPlan.deleteMany({ name: new RegExp(testSuffix) });
  await DiscountRule.deleteMany({ name: new RegExp(testSuffix) });
  await LateFeePolicy.deleteMany({ category: new RegExp(testSuffix) });
  await Route.deleteMany({ title: new RegExp(testSuffix) });
  await PickupPoint.deleteMany({ name: new RegExp(testSuffix) });
  await RouteStop.deleteMany({});
  await TransportStudent.deleteMany({});
  await FeeTransaction.deleteMany({});
  await FeeLedger.deleteMany({});
  await FeeAuditLog.deleteMany({});

  console.log("Seeding test data...");

  // 1. Create Academic Year
  const yearLabel = "2026-27_test_integration";
  const academicYear = await AcademicYear.create({
    label: yearLabel,
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    isActive: true,
    terms: [
      { name: "Term 1", startDate: "2026-04-01", endDate: "2026-09-30", dueDate: "2026-05-15" }
    ]
  });

  // 2. Create Class & Section
  const cls = await Class.create({
    name: "Grade 8" + testSuffix,
    sections: []
  });
  const sec = await Section.create({
    name: "A" + testSuffix,
    class: cls._id
  });
  cls.sections.push(sec._id);
  await cls.save();

  // 3. Create Student
  const student = await Student.create({
    personalInfo: {
      name: "Alice" + testSuffix,
      stdId: "STD999",
      username: "alice_test",
      DOB: "2015-05-15",
      gender: "Female",
      class: cls._id,
      section: sec._id,
      rollNo: "25",
      password: "password123",
      fees: "Due",
      category: "General"
    },
    curriculum: {
      academicYear: yearLabel,
      admissionType: "Regular"
    }
  });

  // 4. Create Fee Categories
  const tuitionCat = await FeeCategory.create({
    name: "Tuition Fee" + testSuffix,
    code: "TUIT",
    frequency: "Termly",
    applicability: "All",
    year: yearLabel
  });

  const transportCat = await FeeCategory.create({
    name: "Transport Fee" + testSuffix,
    code: "TRANS",
    frequency: "Monthly",
    applicability: "All",
    year: yearLabel
  });

  // 5. Create Grade Fee
  const gradeFee = new GradeFee({
    year: yearLabel,
    grade: cls.name,
    fees: {}
  });
  gradeFee.fees.set(tuitionCat.name, 25000);
  await gradeFee.save();

  // 6. Create Installment Plan
  const plan = await InstallmentPlan.create({
    name: "Tuition Quarterly" + testSuffix,
    category: tuitionCat.name,
    year: yearLabel,
    slices: [
      { label: "1st Installment", days: 15, percent: 40 },
      { label: "2nd Installment", days: 150, percent: 60 }
    ]
  });

  // 7. Create Transport Assignment
  const route = await Route.create({ title: "Route 10" + testSuffix });
  const stop = await PickupPoint.create({ name: "Stop 1" + testSuffix, time: "07:30 AM" });
  const routeStop = await RouteStop.create({
    route: route._id,
    stop: stop._id,
    fee: "1500"
  });
  const transportStudent = await TransportStudent.create({
    studentId: student._id,
    routeId: route._id,
    pickupPointId: stop._id,
    status: "Active"
  });

  // 8. Create Sibling Student to check sibling discount
  const parentId = new mongoose.Types.ObjectId();
  student.parent = parentId;
  await student.save();

  const sibling = await Student.create({
    personalInfo: {
      name: "Bob" + testSuffix,
      stdId: "STD998",
      username: "bob_test",
      class: cls._id,
      section: sec._id,
      rollNo: "26",
      password: "password123",
      fees: "Due"
    },
    parent: parentId,
    curriculum: {
      academicYear: yearLabel,
      admissionType: "Regular"
    }
  });

  const siblingDiscount = await DiscountRule.create({
    name: "Sibling Concession" + testSuffix,
    description: "Sibling discount concession",
    basis: "Custom",
    type: "Percentage (%)",
    value: 10,
    categories: [tuitionCat.name],
    grades: [],
    stackable: false,
    active: true,
    year: yearLabel
  });

  // 9. Create Late Fee Policy
  const latePolicy = await LateFeePolicy.create({
    category: tuitionCat.name,
    graceDays: 5,
    type: "Flat",
    amount: 200,
    year: yearLabel
  });

  console.log("Mocking Req/Res for getStudentFeeProfile...");
  let resJson = null;
  const mockRes = {
    json: (data) => { resJson = data; },
    status: (code) => ({ json: (data) => { resJson = { error: data, code }; } })
  };

  await feeControllers.getStudentFeeProfile({
    params: { id: student._id.toString() },
    query: { year: yearLabel }
  }, mockRes);

  console.log("--- getStudentFeeProfile Output Verification ---");
  if (!resJson || resJson.error) {
    console.error("Failed to load student fee profile:", resJson);
    process.exit(1);
  }

  console.log("Student Name:", resJson.student.name);
  console.log("RTE:", resJson.student.rte);
  console.log("Category:", resJson.student.category);
  console.log("Fees Data:", JSON.stringify(resJson.feesData, null, 2));
  console.log("Installments:", JSON.stringify(resJson.installments, null, 2));

  // Assert Tuition Fee has Sibling discount applied (10% of 25000 = 2500)
  const tuitionFeeObj = resJson.feesData.find(f => f.category === tuitionCat.name);
  if (tuitionFeeObj.discount !== 2500) {
    console.error("Assertion Failed: Sibling discount not 2500, got", tuitionFeeObj.discount);
    process.exit(1);
  }
  console.log("✔ Sibling discount calculation verified.");

  // Assert Transport Fee stop fee was loaded (1500)
  const transFeeObj = resJson.feesData.find(f => f.category === transportCat.name);
  if (!transFeeObj || transFeeObj.amount !== 1500) {
    console.error("Assertion Failed: Transport stop fee not loaded as 1500, got", transFeeObj);
    process.exit(1);
  }
  console.log("✔ Transport stop fee dynamic resolving verified.");

  // Assert Late Fine is calculated for 1st installment
  const Q1Installment = resJson.installments.find(i => i.installmentName === "1st Installment");
  if (!Q1Installment || Q1Installment.fine !== 200) {
    console.error("Assertion Failed: Late fine not 200 for Q1 Installment, got:", Q1Installment);
    process.exit(1);
  }
  console.log("✔ Installment late fine calculation verified.");

  console.log("Mocking Req/Res for recordFeePayment...");
  let transactionResult = null;
  const mockResRecord = {
    status: (code) => ({
      json: (data) => {
        const plainData = typeof data.toObject === 'function' ? data.toObject() : data;
        transactionResult = { ...plainData, status_code: code };
      }
    }),
    json: (data) => {
      transactionResult = typeof data.toObject === 'function' ? data.toObject() : data;
    }
  };

  await feeControllers.recordFeePayment({
    body: {
      studentId: student._id.toString(),
      year: yearLabel,
      fees: [
        { category: tuitionCat.name, amount: 10000 }
      ],
      totalAmount: 10000,
      paymentMethod: "Cash",
      remark: "Verification Payment",
      performedBy: "Verifier"
    }
  }, mockResRecord);

  if (!transactionResult || transactionResult.error) {
    console.error("Failed to record fee payment:", transactionResult);
    process.exit(1);
  }
  console.log("Payment Recorded. Transaction ID:", transactionResult._id);

  // Assert Ledger entries are created
  const ledgerEntries = await FeeLedger.find({ studentId: student._id, year: yearLabel });
  console.log("Ledger entries count:", ledgerEntries.length);
  const debits = ledgerEntries.filter(l => l.type === 'Debit');
  const credits = ledgerEntries.filter(l => l.type === 'Credit');
  console.log("Debit entries:", debits.map(d => `${d.category}: ${d.amount}`));
  console.log("Credit entries:", credits.map(c => `${c.category}: ${c.amount}`));

  if (debits.length < 2 || credits.length !== 1) {
    console.error("Assertion Failed: Ledger debit/credit count mismatch.");
    process.exit(1);
  }
  console.log("✔ Ledger debit initialization and credit recording verified.");

  // Assert Audit Log was created
  const auditLogs = await FeeAuditLog.find({ studentId: student._id });
  console.log("Audit log count:", auditLogs.length);
  if (auditLogs.length !== 1) {
    console.error("Assertion Failed: Audit log not created.");
    process.exit(1);
  }
  console.log("Audit Log detail:", auditLogs[0].details);
  console.log("✔ Audit logging verified.");

  // Assert Receipt is generated
  let receiptResult = null;
  await feeControllers.getPaymentReceipt({
    params: { id: transactionResult._id.toString() }
  }, {
    json: (data) => { receiptResult = data; }
  });

  console.log("--- Receipt Output Verification ---");
  console.log("Receipt details:", JSON.stringify(receiptResult, null, 2));
  if (!receiptResult || receiptResult.receiptNo === undefined) {
    console.error("Assertion Failed: Receipt fetch failed.");
    process.exit(1);
  }
  console.log("✔ Receipt generation verified.");

  // Test status update
  console.log("Mocking status update to Cancelled...");
  let statusUpdateResult = null;
  await feeControllers.updatePaymentStatus({
    params: { id: transactionResult._id.toString() },
    body: { status: 'Cancelled' },
    user: { username: "Verifier" }
  }, {
    json: (data) => { statusUpdateResult = data; }
  });

  console.log("Status updated to:", statusUpdateResult.status);
  const voidedLedgerCount = await FeeLedger.countDocuments({ transactionId: transactionResult._id });
  console.log("Ledger credits remaining after cancel:", voidedLedgerCount);
  if (voidedLedgerCount !== 0) {
    console.error("Assertion Failed: Voiding of ledger credits failed.");
    process.exit(1);
  }
  console.log("✔ Payment cancellation and ledger reversal verified.");

  console.log("All interconnection tests passed successfully!");
  process.exit(0);
}

run().catch(err => {
  console.error("Execution failed:", err);
  process.exit(1);
});

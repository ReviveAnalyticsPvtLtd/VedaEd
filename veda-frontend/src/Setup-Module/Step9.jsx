import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Step9ExaminationSetup = () => {
  const navigate = useNavigate();

  const [examModel, setExamModel] = useState("Term Exams");
  const [resultFormat, setResultFormat] = useState("Marks + Grade");

  const [form, setForm] = useState({
    scaleScope: "Globally",
    passingMarks: 33,
    reportCardFormat: "Board-specific Standard",
    publishMode: "Admin Approval Required",
    reportSections: [
      "Scholastic",
      "Attendance",
      "Teacher Remarks",
    ],
  });

  const [grades, setGrades] = useState([
    { grade: "A+", min: 90, max: 100, desc: "Outstanding" },
    { grade: "A", min: 80, max: 89, desc: "Excellent" },
    { grade: "B", min: 70, max: 79, desc: "Very Good" },
    { grade: "C", min: 60, max: 69, desc: "Good" },
    { grade: "D", min: 33, max: 59, desc: "Pass" },
  ]);

  const [weightages, setWeightages] = useState([
    { name: "Unit Test", value: 20, type: "% Weight" },
    { name: "Internal Assessment", value: 20, type: "% Weight" },
    { name: "Final Exam", value: 60, type: "% Weight" },
  ]);

  const toggleSection = (section) => {
    setForm((prev) => ({
      ...prev,
      reportSections: prev.reportSections.includes(section)
        ? prev.reportSections.filter((s) => s !== section)
        : [...prev.reportSections, section],
    }));
  };

  const handleSave = async () => {
    const payload = {
      examModel,
      resultFormat,
      ...form,
      grades,
      weightages,
    };

    try {
      await axios.post(
        "/api/setup/examination-gradebook",
        payload
      );

      navigate("/setup/step-10");
    } catch (err) {
      alert("Failed to save examination setup");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Top Bar */}
      <div className="max-w-[1180px] mx-auto flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white flex items-center justify-center font-extrabold text-xl">
            V
          </div>
          <div>
            <h1 className="text-xl font-bold">VedaSchool</h1>
            <p className="text-slate-500 text-sm">School Setup Wizard</p>
          </div>
        </div>
        <button className="px-4 py-2 border rounded-full font-semibold text-slate-600 bg-white">
          Save & Exit
        </button>
      </div>

      {/* Card */}
      <div className="max-w-[1180px] mx-auto bg-white rounded-[32px] border shadow-2xl overflow-hidden">
        {/* Progress */}
        <div className="px-9 py-7 border-b bg-gradient-to-b from-white to-slate-50">
          <div className="flex justify-between text-sm font-bold text-slate-500 mb-4">
            <span>Step 9 of 13 · Examination & Gradebook</span>
            <span>Setup Progress: 82%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full w-[82%] bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" />
          </div>
        </div>

        {/* Content */}
        <div className="p-9">
          <span className="inline-flex px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-extrabold text-xs mb-5">
            Assessment Foundation
          </span>

          <h2 className="text-4xl font-bold tracking-tight mb-3">
            Configure exams, grading, and gradebook rules
          </h2>
          <p className="text-slate-500 max-w-3xl mb-10">
            Define how assessments are planned, marks are entered, grades
            are calculated, report cards are generated, and promotion rules are connected.
          </p>

          <div className="grid lg:grid-cols-[1.85fr_1fr] gap-6">
            {/* LEFT */}
            <div className="space-y-6">
              {/* Assessment Model */}
              <Card title="Assessment Model" required>
                <div className="grid md:grid-cols-2 gap-4">
                  {["Term Exams", "Continuous Assessment", "Unit Test + Final", "Custom"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setExamModel(m)}
                      className={`p-5 rounded-2xl border text-left transition
                      ${examModel === m
                          ? "border-blue-600 bg-blue-50"
                          : "hover:shadow-lg"
                        }`}
                    >
                      <h4 className="font-bold mb-1">{m}</h4>
                      <p className="text-sm text-slate-500">
                        Configure exam structure
                      </p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Result Format */}
              <Card title="Result Display Format" recommended>
                <div className="flex flex-wrap gap-2">
                  {["Percentage", "Grade", "Marks + Grade", "GPA"].map((f) => (
                    <Pill
                      key={f}
                      active={resultFormat === f}
                      onClick={() => setResultFormat(f)}
                      label={f}
                    />
                  ))}
                </div>
              </Card>

            
               {/* Grade Scale */}
<Card title="Marks Range & Grade Scale" required>
  <p className="text-[15px] text-slate-500 mb-6">
    Define the default grade boundaries. These can be global, grade-wise,
    or subject-wise.
  </p>

  {/* Top Controls */}
  <div className="grid md:grid-cols-2 gap-5 mb-7">
    {/* Scope */}
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
        Apply Grade Scale
      </label>

      <select
        value={form.scaleScope}
        onChange={(e) =>
          setForm({ ...form, scaleScope: e.target.value })
        }
        className="w-full h-[60px] rounded-[20px] border border-slate-200 bg-white px-5 text-[17px] font-medium text-slate-800 outline-none focus:border-blue-500"
      >
        <option>Globally</option>
        <option>Grade-wise</option>
        <option>Subject-wise</option>
      </select>
    </div>

    {/* Passing Marks */}
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
        Default Passing Marks %
      </label>

      <input
        type="number"
        min={0}
        max={100}
        value={form.passingMarks}
        onChange={(e) => {
          const value = Math.max(
            0,
            Math.min(100, Number(e.target.value))
          );

          setForm({
            ...form,
            passingMarks: value,
          });
        }}
        className="w-full h-[60px] rounded-[20px] border border-slate-200 bg-white px-5 text-[17px] font-medium text-slate-800 outline-none focus:border-blue-500"
      />
    </div>
  </div>

  {/* Table Header */}
  <div className="grid grid-cols-4 gap-4 px-4 mb-3">
    <p className="text-[13px] font-bold tracking-wide text-slate-500 uppercase">
      Grade
    </p>
    <p className="text-[13px] font-bold tracking-wide text-slate-500 uppercase">
      Min %
    </p>
    <p className="text-[13px] font-bold tracking-wide text-slate-500 uppercase">
      Max %
    </p>
    <p className="text-[13px] font-bold tracking-wide text-slate-500 uppercase">
      Description
    </p>
  </div>

  {/* Rows */}
  <div className="space-y-4">
    {grades.map((g, i) => (
      <div
        key={i}
        className="grid grid-cols-4 gap-4 border border-slate-200 rounded-[22px] p-3 bg-slate-50/40"
      >
        {/* Grade */}
        <input
          value={g.grade}
          onChange={(e) => {
            const updated = [...grades];
            updated[i].grade = e.target.value;
            setGrades(updated);
          }}
          className="h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />

        {/* Min */}
        <input
          type="number"
          min={0}
          max={100}
          value={g.min}
          onChange={(e) => {
            const updated = [...grades];

            updated[i].min = Math.max(
              0,
              Math.min(100, Number(e.target.value))
            );

            setGrades(updated);
          }}
          className="h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />

        {/* Max */}
        <input
          type="number"
          min={0}
          max={100}
          value={g.max}
          onChange={(e) => {
            const updated = [...grades];

            updated[i].max = Math.max(
              0,
              Math.min(100, Number(e.target.value))
            );

            setGrades(updated);
          }}
          className="h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />

        {/* Desc */}
        <input
          value={g.desc}
          onChange={(e) => {
            const updated = [...grades];
            updated[i].desc = e.target.value;
            setGrades(updated);
          }}
          className="h-[56px] rounded-[16px] border border-slate-200 bg-white px-4 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />
      </div>
    ))}
  </div>
</Card>

{/* Assessment Weightage */}
<Card title="Assessment Weightage">
  <p className="text-[15px] text-slate-500 mb-6">
    Set how different assessment components contribute to the final result.
  </p>

  <div className="space-y-4">
    {weightages.map((w, i) => (
      <div
        key={i}
        className="grid grid-cols-3 gap-4"
      >
        {/* Name */}
        <input
          value={w.name}
          onChange={(e) => {
            const updated = [...weightages];
            updated[i].name = e.target.value;
            setWeightages(updated);
          }}
          className="h-[58px] rounded-[18px] border border-slate-200 bg-white px-5 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />

        {/* Value */}
        <input
          type="number"
          min={0}
          max={100}
          value={w.value}
          onChange={(e) => {
            const updated = [...weightages];

            updated[i].value = Math.max(
              0,
              Math.min(100, Number(e.target.value))
            );

            setWeightages(updated);
          }}
          className="h-[58px] rounded-[18px] border border-slate-200 bg-white px-5 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        />

        {/* Type */}
        <select
          value={w.type}
          onChange={(e) => {
            const updated = [...weightages];
            updated[i].type = e.target.value;
            setWeightages(updated);
          }}
          className="h-[58px] rounded-[18px] border border-slate-200 bg-white px-5 text-[17px] text-slate-800 outline-none focus:border-blue-500"
        >
          <option>% Weight</option>
          <option>Marks</option>
        </select>
      </div>
    ))}
  </div>
</Card>

{/* Report Card */}
<Card title="Report Card Setup" required>
  <p className="text-[15px] text-slate-500 mb-6">
    Choose the default report card style and publishing control.
  </p>

  <div className="grid md:grid-cols-2 gap-5 mb-6">
    {/* Report Card Format */}
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
        Report Card Format
      </label>

      <select
        value={form.reportCardFormat}
        onChange={(e) =>
          setForm({
            ...form,
            reportCardFormat: e.target.value,
          })
        }
        className="w-full h-[58px] rounded-[18px] border border-slate-200 bg-white px-5 text-[17px] text-slate-800 outline-none focus:border-blue-500"
      >
        <option>Board-specific Standard</option>
        <option>Simple School Format</option>
        <option>Detailed Performance Format</option>
        <option>Custom Template</option>
      </select>
    </div>

    {/* Publishing */}
    <div>
      <label className="block text-[13px] font-semibold text-slate-700 mb-2 uppercase tracking-wide">
        Result Publishing
      </label>

      <select
        value={form.publishMode}
        onChange={(e) =>
          setForm({
            ...form,
            publishMode: e.target.value,
          })
        }
        className="w-full h-[58px] rounded-[18px] border border-slate-200 bg-white px-5 text-[17px] text-slate-800 outline-none focus:border-blue-500"
      >
        <option>Admin Approval Required</option>
        <option>Auto Publish After Marks Finalized</option>
        <option>Principal Approval Required</option>
        <option>Manual Publish Only</option>
      </select>
    </div>
  </div>

  {/* Chips */}
  <div>
    <p className="text-[13px] font-bold tracking-wide text-slate-500 uppercase mb-3">
      Report Card Sections
    </p>

    <div className="flex flex-wrap gap-3">
      {[
        "Scholastic",
        "Attendance",
        "Teacher Remarks",
        "Co-scholastic",
        "Behavior",
      ].map((item, idx) => (
        <button
          key={idx}
          className={`px-5 h-[46px] rounded-full text-[16px] font-semibold transition-all ${
            ["Scholastic", "Attendance", "Teacher Remarks"].includes(item)
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-slate-300 text-slate-700"
          }`}
        >
          {item}
        </button>
      ))}
    </div>
  </div>
</Card>
            </div>

            {/* RIGHT SIDEBAR */}
            <div className="space-y-5 sticky top-6">
              <div className="rounded-3xl p-6 text-white bg-gradient-to-br from-blue-700 to-indigo-800">
                <h3 className="text-xl font-bold mb-2">Exam Summary</h3>
                <p className="text-blue-100 text-sm mb-4">
                  {examModel} with {resultFormat} is being prepared.
                </p>
                <div className="space-y-2 text-sm">
                  <Summary text={`Model: ${examModel}`} />
                  <Summary text={`Result: ${resultFormat}`} />
                  <Summary text={`Passing: ${form.passingMarks}%`} />
                  <Summary text={`Scale: ${form.scaleScope}`} />
                </div>
              </div>
               <div className="bg-white border rounded-[28px] p-6">
  <div className="mb-4">
    <h3 className="text-lg font-bold">Dependency Impact</h3>
    <p className="text-sm text-slate-500">
      Exam setup feeds these modules.
    </p>
  </div>

  <ul className="space-y-3 text-sm">
    {[
      "Gradebook",
      "Report Cards",
      "Promotion Rules",
      "Parent Portal",
    ].map((item) => (
      <li
        key={item}
        className="flex justify-between border-b pb-2 last:border-b-0"
      >
        <span className="text-slate-600">{item}</span>
        <span className="font-bold text-green-600">Feeds</span>
      </li>
    ))}
  </ul>
</div><div className="bg-slate-50 border rounded-[22px] p-5">
  <h4 className="font-bold mb-2">Recommendation</h4>
  <p className="text-sm text-slate-600 leading-relaxed">
    For CBSE K12, use Term Exams with Marks + Grade and
    board-specific report card format.
  </p>
</div><div className="bg-amber-50 border border-amber-300 rounded-[22px] p-5">
  <h4 className="font-bold text-amber-800 mb-2">
    Smart Check
  </h4>
  <p className="text-sm text-amber-700 leading-relaxed">
    Changing grading after exams are published should
    create a new version instead of overwriting existing results.
  </p>
</div>
            </div>
           
          </div>

          {/* Footer */}
          <div className="flex justify-between mt-10 pt-6 border-t">
            <button
              onClick={() => navigate("/setup/step-8")}
              className="px-6 py-3 border rounded-xl font-bold"
            >
              Back
            </button>
            <button
              onClick={handleSave,()=>navigate("/form/step-10")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg"
            >
              Save & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

const Card = ({ title, children, required, recommended }) => (
  <div className="bg-white border rounded-[28px] p-6">
    <div className="flex justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold">{title}</h3>
      </div>
      {required && <Tag text="Required" color="yellow" />}
      {recommended && <Tag text="Recommended" color="green" />}
    </div>
    {children}
  </div>
);

const Tag = ({ text, color }) => (
  <span
    className={`px-3 py-1 rounded-full text-xs font-extrabold
    ${color === "yellow" && "bg-amber-100 text-amber-800"}
    ${color === "green" && "bg-emerald-100 text-emerald-700"}`}
  >
    {text}
  </span>
);

const Pill = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-bold border
    ${active ? "bg-blue-600 text-white border-blue-600" : ""}`}
  >
    {label}
  </button>
);

const Input = ({ label, ...props }) => (
  <div>
    <label className="text-xs font-bold text-slate-600 mb-1 block">
      {label}
    </label>
    <input {...props} className="input" />
  </div>
);

const Select = ({ label, value, onChange, options }) => (
  <div>
    <label className="text-xs font-bold text-slate-600 mb-1 block">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input"
    >
      {options.map((o) => (
        <option key={o}>{o}</option>
      ))}
    </select>
  </div>
);

const Summary = ({ text }) => (
  <div className="bg-white/10 border border-white/20 rounded-xl px-3 py-2">
    {text}
  </div>
);

export default Step9ExaminationSetup;
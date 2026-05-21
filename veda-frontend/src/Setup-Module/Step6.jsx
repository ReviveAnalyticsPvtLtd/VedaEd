import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const TERM_OPTIONS = ["2 Terms", "3 Terms", "Quarters", "Custom"];

const SUBJECT_MODES = [
  { key: "recommended", title: "Use Recommended Template", desc: "Apply CBSE/K12 subject templates based on grades and streams." },
  { key: "manual", title: "Create Manually", desc: "Enter subjects, electives, and groups manually." },
  { key: "import", title: "Import from Excel", desc: "Upload existing subject structure from a spreadsheet." },
  { key: "later", title: "Configure Later", desc: "Timetable and exams may remain locked." },
];

const Step6AcademicStructure = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    yearName: "2026–2027",
    pattern: "apr_mar",
    startDate: "2026-04-01",
    endDate: "2027-03-31",
    termType: "2 Terms",
    gradeFrom: "Grade 1",
    gradeTo: "Grade 12",
    expectedStudents: 1200,
    maxSectionSize: 40,
    sectionMode: "auto",
    subjectMode: "recommended",
    streams: ["Science", "Commerce", "Arts / Humanities"],
  });

  const sections = Math.ceil(
    Number(form.expectedStudents) / Number(form.maxSectionSize || 1)
  );

  const showStreams = form.gradeTo === "Grade 12";

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePattern = (value) => {
    const map = {
      apr_mar: ["2026-04-01", "2027-03-31"],
      jun_may: ["2026-06-01", "2027-05-31"],
      aug_jun: ["2026-08-01", "2027-06-30"],
    };
    setForm({
      ...form,
      pattern: value,
      startDate: map[value]?.[0] || form.startDate,
      endDate: map[value]?.[1] || form.endDate,
    });
  };

  const toggleStream = (s) => {
    setForm((p) => ({
      ...p,
      streams: p.streams.includes(s)
        ? p.streams.filter((x) => x !== s)
        : [...p.streams, s],
    }));
  };

  const handleSubmit = () => {
    localStorage.setItem("step6Data", JSON.stringify(form));
    navigate("/form/step-7");
  };

  return (
   <div className="min-h-screen bg-gray-100 flex justify-center py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-indigo-600 text-white p-2 rounded-lg">⚙️</div>
          <h2 className="text-lg font-semibold text-indigo-600">VedaEdu</h2>
        </div>
        {/* Progress */}
        <div className="p-6 border-b bg-gradient-to-b from-white to-gray-50">
          <div className="flex justify-between text-sm font-semibold text-gray-500 mb-3">
            <span>STEP 6 OF 13 · Academic Structure</span>
            <span>54% COMPLETE</span>
          </div>
          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div className="bg-indigo-600 h-2 rounded-full w-[54%]" />
          </div>
        </div>

        <div className="p-8 grid grid-cols-3 gap-6">
          
          {/* LEFT */}
          <div className="col-span-2 space-y-6">

            {/* Academic Year */}
            <Card title="Academic Year" required desc="Create the active academic session for your school.">
              <Grid>
                <Input label="Academic Year Name" name="yearName" value={form.yearName} onChange={handleChange} />
                <Select
                  label="Recommended Pattern"
                  value={form.pattern}
                  onChange={(e) => handlePattern(e.target.value)}
                  options={[
                    { v: "apr_mar", l: "April – March" },
                    { v: "jun_may", l: "June – May" },
                    { v: "aug_jun", l: "August – June" },
                  ]}
                />
                <Input type="date" label="Start Date" name="startDate" value={form.startDate} onChange={handleChange} />
                <Input type="date" label="End Date" name="endDate" value={form.endDate} onChange={handleChange} />
              </Grid>
            </Card>

            {/* Terms */}
            <Card title="Terms / Semesters" badge="CBSE Recommended">
              <div className="flex gap-2 flex-wrap">
                {TERM_OPTIONS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, termType: t })}
                    className={`px-4 py-2 rounded-full font-semibold border
                      ${form.termType === t
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-600"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </Card>

            {/* Grades */}
            <Card title="Grades & Sections" required desc="Define classes and section logic.">
              <Grid>
                <Select label="Grade From" value={form.gradeFrom} onChange={(e)=>setForm({...form,gradeFrom:e.target.value})}
                  options={["Nursery","KG","Grade 1","Grade 6","Grade 9","Grade 11"].map(v=>({v,l:v}))} />
                <Select label="Grade To" value={form.gradeTo} onChange={(e)=>setForm({...form,gradeTo:e.target.value})}
                  options={["KG","Grade 5","Grade 8","Grade 10","Grade 12"].map(v=>({v,l:v}))} />
                <Input type="number" label="Expected Students" name="expectedStudents" value={form.expectedStudents} onChange={handleChange} />
                <Input type="number" label="Max Students / Section" name="maxSectionSize" value={form.maxSectionSize} onChange={handleChange}
                  hint={`Estimated total sections: ${sections}`} />
              </Grid>
            </Card>

            {/* Streams */}
            <Card title="Streams & Electives" badge="Dynamic">
              {showStreams ? (
                <>
                  <div className="flex gap-2 flex-wrap">
                    {["Science","Commerce","Arts / Humanities","Vocational"].map(s=>(
                      <button key={s} onClick={()=>toggleStream(s)}
                        className={`px-4 py-2 rounded-full font-semibold border
                        ${form.streams.includes(s) ? "bg-indigo-600 text-white" : ""}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Streams enabled because Grade 11–12 is selected.
                  </p>
                </>
              ) : (
                <p className="text-gray-500 text-sm">
                  Streams are not required for the selected grade range.
                </p>
              )}
            </Card>

            {/* Subject Framework */}
            <Card title="Subject Framework" required>
              <div className="grid grid-cols-2 gap-4">
                {SUBJECT_MODES.map((m)=>(
                  <div key={m.key}
                    onClick={()=>setForm({...form,subjectMode:m.key})}
                    className={`border rounded-xl p-4 cursor-pointer
                      ${form.subjectMode===m.key?"border-indigo-600 bg-indigo-50":""}`}>
                    <h4 className="font-semibold">{m.title}</h4>
                    <p className="text-sm text-gray-500">{m.desc}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-2">Academic Summary</h3>
              <ul className="space-y-2 text-sm">
                <li>Academic Year: {form.yearName}</li>
                <li>Division: {form.termType}</li>
                <li>Grades: {form.gradeFrom} – {form.gradeTo}</li>
                <li>Estimated Sections: {sections}</li>
              </ul>
            </div>

            <InfoBox title="Dependency Impact">
              Attendance, Timetable, Exams & Fees depend on this setup.
            </InfoBox>

            <InfoBox title="Recommendation">
              For CBSE K12, April–March year, 2 terms & streams for 11–12 are recommended.
            </InfoBox>

            <InfoBox warning title="Smart Check">
              {form.subjectMode === "later"
                ? "Subject setup deferred. Timetable & exams may remain locked."
                : "Academic structure looks ready."}
            </InfoBox>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t">
          <button onClick={()=>navigate("/form/step-5")}
            className="px-6 py-3 border rounded-lg font-semibold">
            Back
          </button>
          <button onClick={handleSubmit}
            className="px-8 py-3 rounded-lg text-white font-semibold
            bg-gradient-to-r from-indigo-600 to-purple-600">
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

/* ---------- Helpers ---------- */
const Card = ({ title, desc, badge, required, children }) => (
  <div className="border rounded-2xl p-5">
    <div className="flex justify-between mb-3">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {desc && <p className="text-sm text-gray-500">{desc}</p>}
      </div>
      {(required || badge) && (
        <span className={`text-xs px-3 py-1 rounded-full font-bold
          ${required?"bg-yellow-100 text-yellow-700":"bg-green-100 text-green-700"}`}>
          {required ? "Required" : badge}
        </span>
      )}
    </div>
    {children}
  </div>
);

const Grid = ({ children }) => (
  <div className="grid grid-cols-2 gap-4">{children}</div>
);

const Input = ({ label, hint, ...p }) => (
  <div>
    <label className="block text-sm font-semibold mb-1">{label}</label>
    <input {...p} className="w-full border rounded-xl px-4 py-2" />
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Select = ({ label, options, ...p }) => (
  <div>
    <label className="block text-sm font-semibold mb-1">{label}</label>
    <select {...p} className="w-full border rounded-xl px-4 py-2">
      {options.map(o=>(
        <option key={o.v} value={o.v}>{o.l}</option>
      ))}
    </select>
  </div>
);

const InfoBox = ({ title, children, warning }) => (
  <div className={`border rounded-xl p-4 ${warning?"bg-yellow-50 border-yellow-300":"bg-gray-50"}`}>
    <h4 className="font-semibold mb-1">{title}</h4>
    <p className="text-sm text-gray-600">{children}</p>
  </div>
);

export default Step6AcademicStructure;
export const initialTemplates = [
  {
    id: 1,
    name: "Assignment Reminder",
    type: "SMS",
    category: "Academic",
    content:
      "Dear students, please submit your {subject} assignment by {due_date}. - Teacher",
  },
  {
    id: 2,
    name: "Parent Meeting",
    type: "Email",
    category: "Communication",
    content:
      "Dear {parent_name}, we would like to schedule a parent-teacher meeting for {student_name} on {date} at {time}. Please confirm your availability. - Teacher",
  },
  {
    id: 3,
    name: "Exam Schedule",
    type: "SMS",
    category: "Academic",
    content:
      "Dear students, your {exam_name} exam is scheduled on {exam_date} at {exam_time}. Please be prepared. - Teacher",
  },
  {
    id: 4,
    name: "Homework Reminder",
    type: "SMS",
    category: "Academic",
    content:
      "Dear students, please complete your {subject} homework and bring it tomorrow. - Teacher",
  },
];

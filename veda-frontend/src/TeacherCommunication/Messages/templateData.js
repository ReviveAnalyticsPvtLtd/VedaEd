export const initialTemplates = [
  {
    id: 1,
    name: "Assignment Reminder",
    type: "SMS",
    content:
      "Dear {student_name}, please submit your {subject} assignment by {due_date}. - Teacher",
    category: "Academic",
  },
  {
    id: 2,
    name: "Parent Meeting",
    type: "Email",
    content:
      "Dear {parent_name}, we would like to schedule a parent-teacher meeting for {student_name} on {date} at {time}. Please confirm your availability. - Teacher",
    category: "Communication",
  },
  {
    id: 3,
    name: "Exam Schedule",
    type: "SMS",
    content:
      "Dear {student_name}, your {exam_name} exam is scheduled on {exam_date} at {exam_time}. Please be prepared. - Teacher",
    category: "Academic",
  },
  {
    id: 4,
    name: "Homework Reminder",
    type: "SMS",
    content:
      "Dear {student_name}, please complete your {subject} homework and bring it tomorrow. - Teacher",
    category: "Academic",
  },
];
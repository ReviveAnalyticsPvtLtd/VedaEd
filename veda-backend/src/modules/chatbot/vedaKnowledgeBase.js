// VedaEd Context-Aware Knowledge Base and Suggestions Dictionary

const pages = {
  "/admin": {
    title: "Admin Dashboard",
    description: "Overview of student count, attendance rates, pending fees, and quick actions.",
    tips: [
      "Check the high-level student and staff statistics cards.",
      "Access 'Quick Actions' to jump directly to collect fees or search payments."
    ],
    faqs: ["setup_wizard", "add_staff"],
    suggestions: [
      { label: "Add New Student", query: "how to add a student" },
      { label: "Collect Fees", query: "how to collect student fees" },
      { label: "Mark Attendance", query: "attendance kaise mark kru" }
    ]
  },
  "/admin/students": {
    title: "Student Directory",
    description: "Manage registered students, view detailed student profiles, and register new enrollments.",
    tips: [
      "Use the search bar to locate specific students by name or enrollment ID.",
      "Click 'Add Student' to fill in the profile and link parents."
    ],
    faqs: ["add_student"],
    suggestions: [
      { label: "Student Admission Guide", query: "how to add student" },
      { label: "Add Student Entry", query: "add new student" }
    ]
  },
  "/admin/fees": {
    title: "Fees Dashboard",
    description: "Configure fee categories, reminder triggers, discount concessions, and track pending dues.",
    tips: [
      "Manage fee categories, groups, and types under the settings panels.",
      "Set up automatic overdue reminders to alert parents."
    ],
    faqs: ["collect_fees", "fee_reminder", "fee_discount"],
    suggestions: [
      { label: "Collect Student Fee", query: "how to collect fees" },
      { label: "Setup Reminders", query: "how to configure fee reminders" },
      { label: "Create Fee Concession", query: "how to apply fee discounts" }
    ]
  },
  "/admin/fees/collect-fees": {
    title: "Fees Collection Portal",
    description: "Search student records and collect installment payments.",
    tips: [
      "Search for the student using their Name or Admission ID.",
      "Click 'Collect Fees' on their record to submit a payment and print a receipt."
    ],
    faqs: ["collect_fees"],
    suggestions: [
      { label: "Fee Collection Steps", query: "how do I collect fees?" },
      { label: "Create Receipt Slip", query: "receipt kaha milegi" }
    ]
  },
  "/parent-front": {
    title: "Parent Portal Dashboard",
    description: "View child's weekly timetable, report cards, daily attendance alerts, and transport tracking.",
    tips: [
      "Check the notice board widget for recent school circulars.",
      "Review upcoming exams and homework due dates."
    ],
    faqs: ["pay_fees", "submit_complaint"],
    suggestions: [
      { label: "Pay School Fees", query: "pay school fees online" },
      { label: "Download Receipt", query: "receipt kaha milegi" },
      { label: "File a Complaint", query: "how to submit complaint" }
    ]
  },
  "/parent/fees": {
    title: "Parent Fees Portal",
    description: "Review outstanding fee installment schedules, pay fees online, and access receipts history.",
    tips: [
      "Check due dates to avoid late fee penalties.",
      "Click 'Pay Now' next to any invoice to open the payment gateway."
    ],
    faqs: ["pay_fees", "view_receipts"],
    suggestions: [
      { label: "Make Payment Now", query: "how to pay school fees" },
      { label: "Get Receipt PDF", query: "where to download receipt" }
    ]
  },
  "/admin/attendance/overview": {
    title: "Attendance Management",
    description: "Track student attendance overview rates, mark daily statuses, and compile monthly sheets.",
    tips: [
      "View school-wide, grade-wise, or section-wise attendance trends.",
      "Toggle between By-Class and By-Student registers."
    ],
    faqs: ["mark_attendance", "attendance_reports"],
    suggestions: [
      { label: "Marking Attendance Register", query: "how do I mark attendance?" },
      { label: "Print Attendance Sheets", query: "how to check student attendance" }
    ]
  },
  "/admin/classes-schedules/classes": {
    title: "Class Configuration Portal",
    description: "Create grade tiers, configure sections, and assign subjects.",
    tips: [
      "Set up your classrooms and section identifiers first.",
      "Link subject groups to sections in the configurations."
    ],
    faqs: ["add_class_section", "assign_teachers"],
    suggestions: [
      { label: "Class Setup Guide", query: "how do I add a class?" },
      { label: "Assign Class Teachers", query: "how do I allocate a teacher?" }
    ]
  },
  "/admin/classes-schedules/timetable": {
    title: "Timetable Management",
    description: "Build weekly period grids for each class and section.",
    tips: [
      "Search by class and section to view or update schedule slots.",
      "Assign subject teachers without period timing conflicts."
    ],
    faqs: ["create_timetable"],
    suggestions: [
      { label: "Create Timetable Grid", query: "how to create a timetable" }
    ]
  },
  "/admin/transport": {
    title: "Transport Operations",
    description: "Configure routes, stops, bus allocation, driver admissions, and calculate transport fees.",
    tips: [
      "Register new pickup points and specify monthly distances/fares.",
      "Allocate students to routes and calculate transport fees."
    ],
    faqs: ["transport_setup", "assign_transport"],
    suggestions: [
      { label: "Setup Bus Stops", query: "how to add routes and buses" },
      { label: "Allocate Bus to Student", query: "how to assign transport to student" }
    ]
  },
  "/visitor-book": {
    title: "Receptionist Visitor Logbook",
    description: "Track visitor entries, purpose of visit, and check-out logs.",
    tips: [
      "Click 'Record Check-In' to print a guest badge.",
      "Ensure checkout time is filled when visitors leave the campus."
    ],
    faqs: ["visitor_checkin"],
    suggestions: [
      { label: "Visitor Entry Log", query: "how to log guest checkin" }
    ]
  },
  "/teacher": {
    title: "Teacher Workspace",
    description: "Overview of your assigned classes, subject groups, daily timetable, and quick shortcuts.",
    tips: [
      "View today's teaching periods on the workspace timetable.",
      "Click shortcuts to quickly mark attendance or post assignments."
    ],
    faqs: ["mark_attendance", "create_assignment"],
    suggestions: [
      { label: "Mark Attendance Today", query: "attendance kaise mark kru" },
      { label: "Create Assignment", query: "how to create assignment" },
      { label: "Gradebook entry", query: "how to input student grades" }
    ]
  },
  "/teacher/attendance/mark": {
    title: "Teacher Attendance Marking Portal",
    description: "Mark Present, Absent, Late, or Leave statuses for your current class roster.",
    tips: [
      "Select Class, Section, and Date and click Search.",
      "Toggle statuses and submit. Absentee alerts will dispatch automatically."
    ],
    faqs: ["mark_attendance"],
    suggestions: [
      { label: "Attendance Steps", query: "how to mark student attendance" }
    ]
  },
  "/teacher/assignment/create": {
    title: "Assignment Creation Desk",
    description: "Post homework tasks, upload attachment files, and set submission rules.",
    tips: [
      "Input a description and due date details.",
      "Check 'Enable Online Submission' if files should be uploaded."
    ],
    faqs: ["create_assignment"],
    suggestions: [
      { label: "Assign Homework Guide", query: "how do teachers assign homework" }
    ]
  },
  "/student": {
    title: "Student Workspace",
    description: "Overview of your class timetable, pending assignments, exam results, and notice updates.",
    tips: [
      "Check for overdue homework due notifications.",
      "Track your cumulative attendance percentage."
    ],
    faqs: ["submit_complaint"],
    suggestions: [
      { label: "Check My Timetable", query: "timetable check kaise kare" },
      { label: "Raise a Complaint", query: "how to raise concern" }
    ]
  }
};

const faqs = [
  {
    id: "add_student",
    category: "student",
    question: "How do I add a new student?",
    keywords: [
      "add student", "new student", "create student", 
      "register student", "admit student", "student admission",
      "student add kaise kare", "bacche ka admission", "new admission",
      "student ki entry", "admit a student", "nava student"
    ],
    roles: ["admin", "superadmin", "receptionist"],
    answer: "To add a new student in VedaEd:\n\n1. Go to the **Student Directory** (/admin/students).\n2. Click the **Add Student** button at the top-right of the directory.\n3. Input the student's personal details (Name, DOB, gender, blood group).\n4. Select their academic allocation (**Class** and **Section**).\n5. Input parent/guardian contact details and link them.\n6. Click **Save Student** to register them. The system will auto-generate parent/student portal logins.\n\nWould you like to navigate to the Student Directory and start?",
    action: {
      label: "Open Student Directory",
      path: {
        admin: "/admin/students",
        superadmin: "/admin/students",
        receptionist: "/admin/students"
      }
    }
  },
  {
    id: "mark_attendance",
    category: "attendance",
    question: "How do I mark student attendance?",
    keywords: [
      "mark attendance", "take attendance", "record attendance", 
      "check attendance", "student attendance", "attendance mark",
      "attendance kaise mark kru", "haziri kaise lagaye", "present absent kaise lagaye",
      "attendance lagana", "attendance register", "take class attendance"
    ],
    roles: ["admin", "superadmin", "teacher"],
    answer: "To mark class attendance in VedaEd:\n\n1. Navigate to the **Attendance Portal**.\n2. Choose the **Class**, **Section**, and **Date**, then click **Search**.\n3. Mark each student's status: **Present**, **Absent**, **Late**, or **Half-Day**.\n4. Click **Submit Attendance** to save. Absent alerts will send to parents automatically.\n\nWould you like to open the attendance screen?",
    action: {
      label: "Mark Attendance Now",
      path: {
        teacher: "/teacher/attendance/mark",
        admin: "/admin/attendance/overview",
        superadmin: "/admin/attendance/overview"
      }
    }
  },
  {
    id: "collect_fees",
    category: "fees",
    question: "How do I collect student fees?",
    keywords: [
      "collect fees", "fee collection", "record payment", 
      "pay fee admin", "receive payment", "cashier fee",
      "fees collect kaise kare", "fees jama karna", "fees record",
      "collect money", "fees payment entry"
    ],
    roles: ["admin", "superadmin", "cashier"],
    answer: "To collect student fees:\n\n1. Go to the **Fees Collection Portal**.\n2. Search for the student by name, class, or admission number.\n3. Click **Collect Fees** on the student's row.\n4. Choose the due installment/invoice in their profile and click **Pay**.\n5. Select payment mode (Cash, Card, UPI, Cheque), enter details, and click **Submit Payment**.\n6. Download or print the receipt slip.\n\nWould you like to go to the Fees Collection page?",
    action: {
      label: "Collect Student Fees",
      path: {
        admin: "/admin/fees/collect-fees",
        superadmin: "/admin/fees/collect-fees",
        cashier: "/admin/fees/collect-fees"
      }
    }
  },
  {
    id: "pay_fees",
    category: "fees",
    question: "How can parents pay school fees online?",
    keywords: [
      "pay fees", "online payment", "parent pay", 
      "pay school fees", "fee payment portal", "outstanding fees",
      "fees bharna", "fees submit kaise kare", "fees pay online",
      "student ki fees kaha dekhu", "fees portal check"
    ],
    roles: ["parent"],
    answer: "To pay your child's fees online:\n\n1. Navigate to the **Fees Portal**.\n2. On the **Fees Overview** tab, check the pending dues list.\n3. Click the **Pay Now** button next to a pending fee installment.\n4. Select your payment method (UPI, Card, Wallet, Net Banking) and authorize transaction.\n5. Download the PDF receipt from the **Payment History** tab.\n\nWould you like to open the Fees Portal now?",
    action: {
      label: "Open Parent Fees Portal",
      path: {
        parent: "/parent/fees"
      }
    }
  },
  {
    id: "view_receipts",
    category: "fees",
    question: "Where do parents find fee receipts?",
    keywords: [
      "receipt", "fee receipt", "download receipt", 
      "payment history", "payment proof", "receipts",
      "receipt kaha milegi", "payment slip", "receipt download",
      "fees slip", "download payment slip"
    ],
    roles: ["parent"],
    answer: "To find and download fee receipts:\n\n1. Go to the **Fees Portal**.\n2. Click on the **Payment History** or **Receipts** tab.\n3. Locate the row matching your paid invoice date and category.\n4. Click the **Download PDF** icon on the right side of the row.\n\nWould you like to navigate to your Receipts tab?",
    action: {
      label: "Open Receipts History",
      path: {
        parent: "/parent/fees/receipts"
      }
    }
  },
  {
    id: "fee_reminder",
    category: "fees",
    question: "How do I configure fee reminders?",
    keywords: [
      "fee reminder", "send reminder", "reminder settings", 
      "reminder rules", "due reminder", "reminder alerts"
    ],
    roles: ["admin", "superadmin"],
    answer: "To configure fee reminders:\n\n1. Navigate to **Admin Fees** -> **Fee Reminder**.\n2. Turn on the automated reminder switches.\n3. Define rules (e.g., 'Send notice 5 days before due date' or 'Send notice 2 days after due date').\n4. Check the communication delivery channels (SMS, Email, or In-App Notices).\n5. Click **Save Settings** to enable.\n\nWould you like to open the Fee Reminders settings page?",
    action: {
      label: "Open Fee Reminders",
      path: {
        admin: "/admin/fees" // Reminders layout is within /admin/fees settings tabs
      }
    }
  },
  {
    id: "fee_discount",
    category: "fees",
    question: "How do I apply fee discounts?",
    keywords: [
      "fee discount", "apply discount", "discount rule", 
      "concession", "scholarship discount", "sibling discount"
    ],
    roles: ["admin", "superadmin"],
    answer: "To apply fee discounts:\n\n1. Navigate to **Admin Fees** -> **Fee Discount**.\n2. Click **Create Discount Rule** to register a percentage/flat concession.\n3. To apply it to a student: search for the student via **Collect Fees**, click **Apply Discount**, choose your rule, and confirm.\n\nWould you like to navigate to the Fee Discount rule page?",
    action: {
      label: "Open Discount Setup",
      path: {
        admin: "/admin/fees" // Discount setup is within /admin/fees
      }
    }
  },
  {
    id: "create_timetable",
    category: "timetable",
    question: "How do I create or edit the timetable?",
    keywords: [
      "create timetable", "timetable", "edit schedule", 
      "class timetable", "teacher schedule", "assign periods",
      "timetable check kaise kare", "timetable check", "timetable schedule",
      "timetable kaha hai", "period time table"
    ],
    roles: ["admin", "superadmin", "teacher", "student", "parent"],
    answer: "To manage timetables in VedaEd:\n\n* **For Admins**: Go to **Classes & Schedules** -> **Timetable** -> select class/section -> click **Add/Edit Slot** to allocate subjects/teachers.\n* **For Teachers**: View your daily teaching grids via **TTimetable** -> **My Timetable**.\n* **For Students/Parents**: View your weekly class timings directly in your workspace **Timetable**.\n\nWould you like to navigate to the Timetable screen?",
    action: {
      label: "Open Timetable Grid",
      path: {
        admin: "/admin/classes-schedules/timetable",
        superadmin: "/admin/classes-schedules/timetable",
        teacher: "/teacher/timetable/my",
        student: "/student/timetable",
        parent: "/parent-front"
      }
    }
  },
  {
    id: "assign_teachers",
    category: "timetable",
    question: "How do I assign teachers to classes?",
    keywords: [
      "assign teacher", "allocate teacher", "class teacher", 
      "subject teacher", "assign teachers to class", "teacher allocation"
    ],
    roles: ["admin", "superadmin"],
    answer: "To assign teachers to classes and subjects:\n\n1. Go to **Classes & Schedules** -> **Assign Teacher**.\n2. Click the **Assign Teacher to Class** button.\n3. Choose the target **Class**, **Section**, and **Subject Group**.\n4. Select the teacher matching each subject, and declare the designated **Class Teacher**.\n5. Click **Save Allocation**.\n\nWould you like to open the teacher allocation desk?",
    action: {
      label: "Open Teacher Allocation",
      path: {
        admin: "/admin/classes-schedules" // Nested in classes-schedules sub-routes
      }
    }
  },
  {
    id: "add_class_section",
    category: "timetable",
    question: "How do I add a class or section?",
    keywords: [
      "add class", "create class", "add section", 
      "new class", "new section", "configure classes",
      "classroom add", "add class section"
    ],
    roles: ["admin", "superadmin"],
    answer: "To configure classes and sections:\n\n1. Go to **Classes & Schedules**.\n2. In the **Classes** tab, click **Add Class** (e.g. 'Grade 10').\n3. In the **Sections** tab, click **Add Section** (e.g. 'Section A').\n4. Link sections to classes during editing and click **Save**.\n\nWould you like to open the Classes setup screen?",
    action: {
      label: "Configure Classes Setup",
      path: {
        admin: "/admin/classes-schedules"
      }
    }
  },
  {
    id: "assign_transport",
    category: "transport",
    question: "How do I allocate a student to a transport route?",
    keywords: [
      "assign transport", "bus route allocation", "allocate bus", 
      "transport registration", "link bus", "student transport allocation"
    ],
    roles: ["admin", "superadmin"],
    answer: "To assign a student to a transport route:\n\n1. Navigate to the **Transport Module** (/admin/transport).\n2. Click the **Student Transport Fees** or **Student Allocation** tab.\n3. Find the student and click **Edit Transport**.\n4. Select the designated **Route** and **Pickup Point**. The transport fare calculates automatically.\n5. Save allocation.\n\nWould you like to go to the Transport page?",
    action: {
      label: "Open Transport Portal",
      path: {
        admin: "/admin/transport"
      }
    }
  },
  {
    id: "transport_setup",
    category: "transport",
    question: "How do I add transport routes and buses?",
    keywords: [
      "add route", "create bus route", "add vehicle", 
      "new bus", "pickup point setup", "driver admission",
      "transport assign", "routes bus setup", "fleet vehicle register"
    ],
    roles: ["admin", "superadmin", "fleetmanager"],
    answer: "To configure routes and buses in VedaEd:\n\n1. Go to the **Transport page**.\n2. In **Pickup Point**, add stopping locations and monthly fares.\n3. In **Routes**, create routes (e.g., 'East campus route') and check pickup locations.\n4. In **Vehicles**, log registration details for buses/vans.\n5. Use **Assign Vehicle** to link routes, vehicles, and drivers.\n\nWould you like to open the Transport configuration?",
    action: {
      label: "Configure Transport Setup",
      path: {
        admin: "/admin/transport",
        superadmin: "/superadmin/transport"
      }
    }
  },
  {
    id: "create_assignment",
    category: "assignment",
    question: "How do teachers assign homework or assignments?",
    keywords: [
      "create assignment", "assign homework", "add homework", 
      "give assignment", "upload homework", "homework assign"
    ],
    roles: ["admin", "superadmin", "teacher"],
    answer: "To assign homework tasks:\n\n1. Go to **Assignments** page.\n2. Click **Create Assignment**.\n3. Choose Class, Section, and Subject.\n4. Fill in title, description, max marks, and set the **Due Date**.\n5. Attach materials (PDFs/Images) and click **Create & Publish** to notify students.\n\nWould you like to open the homework creator?",
    action: {
      label: "Create Homework Assignment",
      path: {
        teacher: "/teacher/assignment/create",
        admin: "/admin"
      }
    }
  },
  {
    id: "gradebook_setup",
    category: "exams",
    question: "How do I input student grades or marks?",
    keywords: [
      "enter grades", "gradebook", "input marks", 
      "record exam marks", "marks entry", "add grades",
      "marksheet fill", "bacche ka result check karna hai", "bacche ka result"
    ],
    roles: ["admin", "superadmin", "teacher", "parent", "student"],
    answer: "To record exam results and student grades:\n\n* **For Teachers**: Go to **Teacher SIS** -> **Gradebook** -> select exam/class/subject -> input marks next to students -> click **Save Marks**.\n* **For Parents/Students**: Navigate to the **Exams** tab on your workspace dashboard to check published report card scores.\n\nWould you like to open your exams or grades portal?",
    action: {
      label: "Open Academic Performance",
      path: {
        teacher: "/teacher/gradebook",
        parent: "/parent-front",
        student: "/student"
      }
    }
  },
  {
    id: "post_notice",
    category: "communication",
    question: "How do I post a notice or bulletin update?",
    keywords: [
      "post notice", "create notice", "send announcement", 
      "school notice", "add notice board", "circular dispatch"
    ],
    roles: ["admin", "superadmin", "teacher"],
    answer: "To post an announcement notice:\n\n1. Go to **Communication** -> **Notices**.\n2. Click **Post Notice**.\n3. Draft your announcement details, choose the target audience (Students, Parents, or Staff), select delivery channels (Email/SMS), and click **Publish Notice**.\n\nWould you like to open the notice screen?",
    action: {
      label: "Post Circular Notice",
      path: {
        teacher: "/teacher/communication"
      }
    }
  },
  {
    id: "submit_complaint",
    category: "communication",
    question: "How do parents or students submit complaints?",
    keywords: [
      "complaint", "submit complaint", "report issue", 
      "raise concern", "file complaint", "grievance box"
    ],
    roles: ["parent", "student"],
    answer: "To raise a complaint or report a grievance:\n\n1. Go to the **Communication** -> **Complaints** page.\n2. Click **Submit New Complaint**.\n3. Choose category (Academic, Facilities, Transport, Behaviour), write title and description, and submit. School admins will review and update status.\n\nWould you like to raise a concern?",
    action: {
      label: "File A Complaint",
      path: {
        parent: "/parent-front",
        student: "/student"
      }
    }
  },
  {
    id: "add_staff",
    category: "staff",
    question: "How do I hire or register a staff member?",
    keywords: [
      "add staff", "hire staff", "register teacher", 
      "new teacher", "staff directory", "staff add",
      "nayi joining", "staff profile create"
    ],
    roles: ["admin", "superadmin", "hr"],
    answer: "To add a new employee or teacher:\n\n1. Navigate to **HR Module** -> **Staff Directory**.\n2. Click the **Add Staff** or **Invite Staff** button.\n3. Enter their personal profile, assigned role (Teacher, Accountant, receptionist), and salary grades.\n4. Click **Save** to complete enrollment.\n\nWould you like to navigate to the Staff directory?",
    action: {
      label: "Open Staff Directory",
      path: {
        admin: "/admin/staff",
        superadmin: "/admin/staff"
      }
    }
  },
  {
    id: "visitor_checkin",
    category: "reception",
    question: "How do I register a guest check-in?",
    keywords: [
      "visitor", "guest log", "visitor checkin", 
      "visitor book", "front office", "guest entry"
    ],
    roles: ["admin", "superadmin", "receptionist"],
    answer: "To log a guest check-in:\n\n1. Navigate to the **Visitor Book** page (/visitor-book).\n2. Click **Record Check-In**.\n3. Fill in guest Name, Purpose of Visit, Contact details, and Person to meet.\n4. Save entry. When they leave click **Check Out** on their active row.\n\nWould you like to open the Visitor Book?",
    action: {
      label: "Open Visitor Book",
      path: {
        admin: "/visitor-book",
        superadmin: "/visitor-book",
        receptionist: "/visitor-book"
      }
    }
  },
  {
    id: "setup_wizard",
    category: "setup",
    question: "How do I complete the institution setup wizard?",
    keywords: [
      "setup wizard", "onboarding steps", "configure school", 
      "initial setup", "project setup", "wizard steps"
    ],
    roles: ["admin", "superadmin"],
    answer: "To configure VedaEd school parameters:\n\n1. Open the **Setup Wizard** (/setup/start).\n2. Save and proceed through the 12 configuration steps (Basic info, campus, classrooms, sections, subject groups, teachers, billing account details, routes).\n\nWould you like to start the wizard?",
    action: {
      label: "Start Setup Wizard",
      path: {
        admin: "/setup/start",
        superadmin: "/setup/start"
      }
    }
  }
];

const roleSuggestions = {
  superadmin: [
    { label: "Institution Onboarding", query: "how to complete the setup wizard" },
    { label: "Invite Administrative Staff", query: "how do I add staff" },
    { label: "Create Student Profile", query: "how to add a student" }
  ],
  admin: [
    { label: "Student Admission", query: "how to add a student" },
    { label: "Fees Collection", query: "how to collect student fees" },
    { label: "Class Timetables", query: "how to create a timetable" },
    { label: "Transport Routes", query: "how to add transport routes" },
    { label: "Fee Reminders", query: "how to configure fee reminders" }
  ],
  teacher: [
    { label: "Mark Class Attendance", query: "attendance kaise mark kru" },
    { label: "Create Homework Assignment", query: "how to create assignment" },
    { label: "Input Exam Marks", query: "how do I input student grades" },
    { label: "Post Announcement Notice", query: "how do I post a notice" }
  ],
  student: [
    { label: "Check Class Timetable", query: "timetable check kaise kare" },
    { label: "File a Grievance", query: "how to submit complaint" }
  ],
  parent: [
    { label: "Online Fee Payments", query: "student ki fees kaha dekhu" },
    { label: "Download Receipt PDF", query: "receipt kaha milegi" },
    { label: "Raise a Complaint", query: "how to submit complaint" }
  ],
  receptionist: [
    { label: "Log Visitor Entry", query: "how to log guest checkin" },
    { label: "Student Admission", query: "how to add a student" }
  ],
  fleetmanager: [
    { label: "Manage Transport Routes", query: "how to add transport routes" }
  ],
  cashier: [
    { label: "Collect Fees", query: "how do I collect fees?" }
  ],
  guest: [
    { label: "School Setup Wizard", query: "how to complete the setup wizard" }
  ]
};

module.exports = {
  pages,
  faqs,
  roleSuggestions
};

const { askChatbot } = require("../src/modules/chatbot/chatbotController");

// Helper to create mock request and response
const createMockRequest = (message, role, userName, history = [], currentPage = "") => ({
  body: { message, role, userName, history, currentPage }
});

const createMockResponse = (label, callback) => ({
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(data) {
    console.log(`\n=================== TEST: ${label} ===================`);
    console.log("Response Status:", this.statusCode || 200);
    console.log("Response Content:\n", data.data);
    if (data.suggestions) {
      console.log("Returned Suggestions:", data.suggestions.map(s => s.label));
    }
    if (data.actions) {
      console.log("Returned Action Buttons:", data.actions.map(a => `${a.label} -> ${a.path}`));
    }
    if (callback) callback(data);
  }
});

async function runTests() {
  console.log("Starting Advanced Veda Smart Assistant Engine Verification...\n");

  // Test 1: Initialization __INIT__ on admin fees page
  const req1 = createMockRequest("__INIT__", "admin", "Alice", [], "/admin/fees");
  const res1 = createMockResponse("Init Greeting & suggestions for Admin on Fees Dashboard");
  await askChatbot(req1, res1);

  // Test 2: Hinglish Match "student ki fees kaha dekhu" as a parent
  const req2 = createMockRequest("student ki fees kaha dekhu", "parent", "Bob", [], "/parent-front");
  const res2 = createMockResponse("Hinglish query - parent fees lookup");
  await askChatbot(req2, res2);

  // Test 3: Role-specific action buttons for Teachers (attendance kaise mark kru)
  const req3 = createMockRequest("attendance kaise mark kru", "teacher", "Charlie", [], "/teacher");
  const res3 = createMockResponse("Hinglish query - teacher marking attendance");
  await askChatbot(req3, res3);

  // Test 4: Role-specific action buttons for Admins (attendance kaise mark kru)
  const req4 = createMockRequest("attendance kaise mark kru", "admin", "Alice", [], "/admin");
  const res4 = createMockResponse("Hinglish query - admin checking attendance");
  await askChatbot(req4, res4);

  // Test 5: Follow-up matching ("how to do it") after discussing Student Admission
  const history = [
    { role: "user", parts: [{ text: "new student admission" }] },
    { 
      role: "model", 
      parts: [{ 
        text: "To add a new student in VedaEd: 1. Go to the Student Directory (/admin/students)..." 
      }] 
    }
  ];
  const req5 = createMockRequest("how to do it", "admin", "Alice", history, "");
  const res5 = createMockResponse("Conversational Follow-up Context matching");
  await askChatbot(req5, res5);

  // Test 6: Fallback and security (unauthorized student asking to collect fees)
  const req6 = createMockRequest("How to collect fees from class", "student", "David", [], "/student");
  const res6 = createMockResponse("Security check - student asking to collect fees (Fallback suggestion list)");
  await askChatbot(req6, res6);
}

runTests().catch(err => console.error("Testing Error:", err));

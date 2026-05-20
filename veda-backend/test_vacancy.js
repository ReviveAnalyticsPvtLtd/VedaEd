const axios = require("axios");

async function test() {
    try {
        const res = await axios.post("http://localhost:5000/api/hr-recruitment/vacancies", {
            vacancyId: "TEST-01",
            department: "Math",
            jobTitle: "Teacher",
            roleType: "Teaching",
            openings: 1
        });
        console.log("Success:", res.data);
    } catch (err) {
        console.error("Error:", err.response ? err.response.data : err.message);
    }
}
test();

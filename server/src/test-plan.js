require("dotenv").config();

const {
  generatePreparationPlan,
} = require("./services/aiPreparation.service");

async function testPlan() {
  const start = Date.now();

  try {
    const plan = await generatePreparationPlan({
      targetRole: "Frontend Developer",
      experience: "Fresher",
      targetCompany: "",
      jobDescription: "",
      interviewTypes: ["Technical", "HR"],
      difficulty: "Beginner",
      duration: "7 Days",
      dailyTime: "1 hour",
      resumeText: "Skills: JavaScript, React, HTML, CSS.",
    });

    console.log(JSON.stringify(plan, null, 2));
    console.log(
      `Generation time: ${((Date.now() - start) / 1000).toFixed(2)} seconds`
    );
  } catch (error) {
    console.error("Plan generation failed:", error.message);
    process.exitCode = 1;
  }
}

testPlan();
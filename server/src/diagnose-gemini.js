require("dotenv").config();

const { ai, GEMINI_MODEL } = require("./config/gemini.config");

async function testGemini() {
    const startTime = Date.now();

    try {

        const response = await ai.interactions.create({
            model: GEMINI_MODEL,
            input: "Reply with exactly: PrepPilot connection successful",
            generation_config: {
                thinking_level: "low",
            },
        });


        const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log("Model:", GEMINI_MODEL);
        console.log("Response:", response.output_text);
        console.log(`Response time: ${elapsedTime} seconds`);
    } catch (error) {
        console.error("Gemini test failed:", error.message);
        process.exitCode = 1;
    }
}

testGemini();
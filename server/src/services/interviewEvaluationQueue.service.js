const InterviewEvaluationJob = require("../models/interviewEvaluationJob.model");
const MockInterview = require("../models/mockInterview.model");

const MAX_ATTEMPTS = 3;
const STALE_LOCK_MS = 2 * 60 * 1000;

const enqueueInterviewEvaluation = async (interviewId) => {
  try {
    await InterviewEvaluationJob.findOneAndUpdate(
      { interview: interviewId },
      {
        $setOnInsert: {
          interview: interviewId,
          status: "pending",
          nextRunAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
  }
};

const recoverPendingEvaluations = async () => {
  const interviews = await MockInterview.find({
    status: "completed",
    evaluationStatus: { $in: ["pending", "processing"] },
  })
    .select("_id")
    .limit(100)
    .lean();

  for (const interview of interviews) {
    await enqueueInterviewEvaluation(interview._id);
  }
};

const startInterviewEvaluationWorker = (evaluateInterview) => {
  let running = false;

  const runNext = async () => {
    if (running) return;
    running = true;

    try {
      await recoverPendingEvaluations();
      const now = new Date();
      const staleBefore = new Date(now.getTime() - STALE_LOCK_MS);
      const job = await InterviewEvaluationJob.findOneAndUpdate(
        {
          $or: [
            { status: "pending", nextRunAt: { $lte: now } },
            { status: "processing", lockedAt: { $lte: staleBefore } },
          ],
        },
        {
          $set: { status: "processing", lockedAt: now },
          $inc: { attempts: 1 },
        },
        { new: true, sort: { createdAt: 1 } }
      );

      if (!job) return;

      const heartbeat = setInterval(() => {
        InterviewEvaluationJob.updateOne(
          { _id: job._id, status: "processing" },
          { $set: { lockedAt: new Date() } }
        ).catch((error) => {
          console.error("Evaluation job heartbeat failed:", error.message);
        });
      }, 30 * 1000);
      heartbeat.unref?.();

      try {
        await evaluateInterview(job.interview);
        await InterviewEvaluationJob.updateOne(
          { _id: job._id, status: "processing" },
          { $set: { status: "completed", lockedAt: null, lastError: "" } }
        );
      } catch (error) {
        const failedPermanently = job.attempts >= MAX_ATTEMPTS;
        const retryDelayMs = Math.min(5 * 60 * 1000, job.attempts * 30 * 1000);

        await InterviewEvaluationJob.updateOne(
          { _id: job._id, status: "processing" },
          {
            $set: {
              status: failedPermanently ? "failed" : "pending",
              lockedAt: null,
              nextRunAt: new Date(Date.now() + retryDelayMs),
              lastError: String(error.message || error).slice(0, 500),
            },
          }
        );

        await MockInterview.updateOne(
          { _id: job.interview, status: "completed" },
          {
            $set: {
              evaluationStatus: failedPermanently ? "failed" : "pending",
              ...(failedPermanently
                ? { "report.summary": "Evaluation failed after several attempts. Please try again later." }
                : {}),
            },
          }
        );
        console.error("Mock interview evaluation job failed:", error.message);
      } finally {
        clearInterval(heartbeat);
      }
    } catch (error) {
      console.error("Interview evaluation worker error:", error.message);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(runNext, 2000);
  timer.unref?.();
  runNext();
  return () => clearInterval(timer);
};

module.exports = {
  enqueueInterviewEvaluation,
  startInterviewEvaluationWorker,
};

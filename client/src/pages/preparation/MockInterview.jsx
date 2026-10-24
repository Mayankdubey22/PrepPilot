import { useCallback, useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Flag,
  LoaderCircle,
  ShieldAlert,
  Trophy,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getMockInterview,
  prepareMockInterviewQuestions,
  startMockInterview,
  saveMockAnswer,
  terminateMockInterview,
  completeMockInterview,
} from "../../services/mockInterview.service";

const formatTime = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

const MockInterview = () => {
  const { preparationId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedMilestone = Number(
    searchParams.get("milestone") || 50
  );

  const milestone = [50, 75, 100].includes(requestedMilestone)
    ? requestedMilestone
    : 50;

  const { token } = useAuth();

  const [interview, setInterview] = useState(null);
  const [questionSet, setQuestionSet] = useState(null);
  const [isRetryingGeneration, setIsRetryingGeneration] =
    useState(false);

  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const [remainingSeconds, setRemainingSeconds] = useState(1800);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);

  const [error, setError] = useState("");
  const [sessionLocked, setSessionLocked] = useState(false);
  const [lockReason, setLockReason] = useState("");

  const questions = interview?.questions || [];
  const status = interview?.status;

  const isActive = status === "active";
  const isFinished = status === "completed";
  const isTerminated = status === "terminated";

  const answeredCount = questions.filter((question) =>
    String(
      answers[question._id] || question.userAnswer || ""
    ).trim()
  ).length;

  const currentQuestion = questions[currentIndex];

  const currentAnswer = currentQuestion
    ? answers[currentQuestion._id] || ""
    : "";

  const loadInterview = useCallback(async () => {
    if (!preparationId || !token) {
      setError("Preparation ID or authentication is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getMockInterview(
        preparationId,
        token,
        milestone
      );

      if (!result.success) {
        setError(
          result.data?.message ||
            "Unable to load the mock interview."
        );
        return;
      }

      const loadedInterview = result.data?.interview || null;

      setInterview(loadedInterview);
      setQuestionSet(result.data?.questionSet || null);

      if (loadedInterview) {
        const initialAnswers = {};

        loadedInterview.questions?.forEach((question) => {
          initialAnswers[question._id] =
            question.userAnswer || "";
        });

        setAnswers(initialAnswers);

        if (loadedInterview.endsAt) {
          setRemainingSeconds(
            Math.max(
              0,
              Math.ceil(
                (new Date(loadedInterview.endsAt).getTime() -
                  Date.now()) /
                  1000
              )
            )
          );
        }

        if (loadedInterview.status === "completed") {
          const finalDuration =
            loadedInterview.actualDurationSeconds ??
            (loadedInterview.startedAt &&
            loadedInterview.completedAt
              ? Math.max(
                  0,
                  Math.floor(
                    (new Date(
                      loadedInterview.completedAt
                    ).getTime() -
                      new Date(
                        loadedInterview.startedAt
                      ).getTime()) /
                      1000
                  )
                )
              : 0);

          setElapsedSeconds(finalDuration);
        } else if (loadedInterview.startedAt) {
          setElapsedSeconds(
            Math.max(
              0,
              Math.floor(
                (Date.now() -
                  new Date(
                    loadedInterview.startedAt
                  ).getTime()) /
                  1000
              )
            )
          );
        }

        if (loadedInterview.status === "terminated") {
          setSessionLocked(true);
          setLockReason(
            loadedInterview.terminationReason ||
              "This mock interview has been terminated."
          );
        } else {
          setSessionLocked(false);
          setLockReason("");
        }
      } else {
        setAnswers({});
        setCurrentIndex(0);
        setSessionLocked(false);
        setLockReason("");
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }, [preparationId, token, milestone]);

  useEffect(() => {
    loadInterview();
  }, [loadInterview]);

  // Poll the selected milestone while background generation is running.
  useEffect(() => {
    if (!preparationId || !token || interview) {
      return undefined;
    }

    if (["ready", "failed"].includes(questionSet?.status)) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId;

    const pollQuestionSet = async () => {
      try {
        const result = await getMockInterview(
          preparationId,
          token,
          milestone
        );

        if (cancelled) return;

        if (result.success) {
          const latestQuestionSet =
            result.data?.questionSet || null;

          const latestInterview =
            result.data?.interview || null;

          setQuestionSet(latestQuestionSet);

          if (latestInterview) {
            setInterview(latestInterview);
          } else if (
            !["ready", "failed"].includes(
              latestQuestionSet?.status
            )
          ) {
            timeoutId = window.setTimeout(
              pollQuestionSet,
              3000
            );
          }
        } else {
          timeoutId = window.setTimeout(
            pollQuestionSet,
            5000
          );
        }
      } catch {
        if (!cancelled) {
          timeoutId = window.setTimeout(
            pollQuestionSet,
            5000
          );
        }
      }
    };

    timeoutId = window.setTimeout(pollQuestionSet, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [
    preparationId,
    token,
    milestone,
    questionSet?.status,
    interview,
  ]);

  // Refresh evaluation while Gemini processes submitted answers.
  useEffect(() => {
    if (
      interview?.status !== "completed" ||
      !["pending", "processing"].includes(
        interview?.evaluationStatus
      )
    ) {
      return undefined;
    }

    let isMounted = true;

    const refreshEvaluation = async () => {
      try {
        const result = await getMockInterview(
          preparationId,
          token,
          milestone
        );

        if (
          isMounted &&
          result.success &&
          result.data?.interview
        ) {
          const latestInterview = result.data.interview;

          setInterview(latestInterview);

          setAnswers((previous) => {
            const next = { ...previous };

            latestInterview.questions?.forEach((question) => {
              next[question._id] =
                question.userAnswer ||
                next[question._id] ||
                "";
            });

            return next;
          });
        }
      } catch (refreshError) {
        console.error(
          "Unable to refresh evaluation:",
          refreshError
        );
      }
    };

    const intervalId = window.setInterval(
      refreshEvaluation,
      3000
    );

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [
    interview?.status,
    interview?.evaluationStatus,
    preparationId,
    token,
    milestone,
  ]);
    // Keep the timer synchronized with the server's saved end time.
  useEffect(() => {
    if (!isActive || sessionLocked || !interview?.endsAt) {
      return undefined;
    }

    const updateTimer = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(interview.endsAt).getTime() - Date.now()) /
            1000
        )
      );

      setRemainingSeconds(remaining);

      if (interview.startedAt) {
        setElapsedSeconds(
          Math.max(
            0,
            Math.floor(
              (Date.now() -
                new Date(interview.startedAt).getTime()) /
                1000
            )
          )
        );
      }

      if (remaining <= 0) {
        setError("The interview time has expired.");
      }
    };

    updateTimer();

    const timerId = window.setInterval(updateTimer, 1000);

    return () => window.clearInterval(timerId);
  }, [
    isActive,
    sessionLocked,
    interview?.endsAt,
    interview?.startedAt,
  ]);

  // Terminate an active interview if the browser tab becomes hidden.
  useEffect(() => {
    if (!isActive || sessionLocked || !interview?._id) {
      return undefined;
    }

    let terminationRequested = false;

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "hidden" &&
        !terminationRequested
      ) {
        terminationRequested = true;

        setSessionLocked(true);

        setLockReason(
          "The interview stopped because you switched tabs, minimized the browser, or left this page."
        );

        setInterview((previous) =>
          previous
            ? {
                ...previous,
                status: "terminated",
                terminationReason:
                  "Interview screen became hidden",
              }
            : previous
        );

        terminateMockInterview(
          interview._id,
          "Interview screen became hidden",
          token
        )
          .then((result) => {
            if (!result.success) {
              console.error(
                "Unable to persist mock interview termination:",
                result.data?.message
              );
            } else if (result.data?.interview) {
              setInterview(result.data.interview);
            }
          })
          .catch((terminationError) => {
            console.error(
              "Unable to terminate mock interview:",
              terminationError
            );
          });
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [isActive, sessionLocked, interview?._id, token]);

  // Warn before closing or refreshing an active interview.
  useEffect(() => {
    if (!isActive || sessionLocked) {
      return undefined;
    }

    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [isActive, sessionLocked]);

  // Retry generation if the background question-set generation failed.
  const handleRetryGeneration = async () => {
    if (
      !preparationId ||
      !token ||
      isRetryingGeneration
    ) {
      return;
    }

    setIsRetryingGeneration(true);
    setError("");

    try {
      const result = await prepareMockInterviewQuestions(
        preparationId,
        token,
        milestone
      );

      if (result.success) {
        setQuestionSet(
          result.data?.questionSet || {
            status: "generating",
          }
        );

        await loadInterview();
      } else {
        setError(
          result.data?.message ||
            "Unable to retry question generation."
        );
      }
    } catch {
      setError("Unable to connect to the server.");
    } finally {
      setIsRetryingGeneration(false);
    }
  };

  const handleStart = async () => {
    if (!preparationId || !token || isStarting) {
      return;
    }

    setIsStarting(true);
    setError("");

    try {
      // Check whether the selected milestone's questions are ready.
      const preparationResult = await prepareMockInterviewQuestions(
        preparationId,
        token,
        milestone
      );

      if (!preparationResult.success) {
        const latestQuestionSet =
          preparationResult.data?.questionSet;

        if (latestQuestionSet) {
          setQuestionSet(latestQuestionSet);
        }

        setError(
          preparationResult.data?.message ||
            "Questions are still being prepared. Please wait and try again."
        );

        return;
      }

      const readyQuestionSet =
        preparationResult.data?.questionSet;

      if (
        readyQuestionSet?.status !== "ready" ||
        !Array.isArray(readyQuestionSet.questions) ||
        readyQuestionSet.questions.length !== 12
      ) {
        setQuestionSet(
          readyQuestionSet || { status: "generating" }
        );

        setError(
          "Your 12 questions are not ready yet. Please wait while they are generated."
        );

        return;
      }

      setQuestionSet(readyQuestionSet);

      const result = await startMockInterview(
        preparationId,
        token,
        milestone
      );

      if (!result.success) {
        if (result.data?.interview) {
          setInterview(result.data.interview);

          if (result.data.interview.status === "terminated") {
            setSessionLocked(true);

            setLockReason(
              result.data.interview.terminationReason ||
                "This session has been terminated."
            );
          }
        }

        setError(
          result.data?.message ||
            "Unable to start the mock interview."
        );

        return;
      }

      const newInterview = result.data?.interview;

      if (!newInterview?._id || !newInterview.questions?.length) {
        setError(
          "The server did not return a valid mock interview."
        );
        return;
      }

      setInterview(newInterview);
      setCurrentIndex(0);

      setAnswers(
        Object.fromEntries(
          newInterview.questions.map((question) => [
            question._id,
            question.userAnswer || "",
          ])
        )
      );

      setRemainingSeconds(newInterview.durationSeconds || 1800);
      setElapsedSeconds(0);
      setSessionLocked(false);
      setLockReason("");
    } catch {
      setError("Unable to start the mock interview.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleAnswerChange = (value) => {
    if (
      !isActive ||
      sessionLocked ||
      isSaving ||
      !currentQuestion
    ) {
      return;
    }

    setAnswers((previous) => ({
      ...previous,
      [currentQuestion._id]: value,
    }));
  };

  const saveCurrentAnswer = async () => {
    if (!currentQuestion || !interview?._id || !isActive) {
      return false;
    }

    if (remainingSeconds <= 0) {
      setError("The interview time has expired.");
      return false;
    }

    const answer = answers[currentQuestion._id] || "";

    if (!answer.trim()) {
      setError("Please enter your answer before continuing.");
      return false;
    }

    setIsSaving(true);
    setError("");

    try {
      const result = await saveMockAnswer(
        interview._id,
        currentQuestion._id,
        answer,
        token
      );

      if (!result.success) {
        setError(
          result.data?.message || "Unable to save your answer."
        );

        if (result.status === 409) {
          await loadInterview();
        }

        return false;
      }

      setInterview((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          questions: previous.questions.map((question) =>
            question._id === currentQuestion._id
              ? {
                  ...question,
                  userAnswer: answer.trim(),
                  answeredAt: new Date().toISOString(),
                }
              : question
          ),
        };
      });

      return true;
    } catch {
      setError("Unable to save your answer.");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    const saved = await saveCurrentAnswer();

    if (!saved) return;

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((previous) => previous + 1);
    }
  };

  const handlePrevious = () => {
    if (!isActive || isSaving || currentIndex === 0) {
      return;
    }

    setCurrentIndex((previous) => previous - 1);
    setError("");
  };

  const handleFinish = async () => {
    if (!isActive || isFinishing || isSaving) {
      return;
    }

    const saved = await saveCurrentAnswer();

    if (!saved) return;

    setIsFinishing(true);
    setError("");

    try {
      const result = await completeMockInterview(
        interview._id,
        token
      );

      if (!result.success) {
        setError(
          result.data?.message ||
            "Unable to complete the interview."
        );

        if (result.status === 409) {
          await loadInterview();
        }

        return;
      }

      const completedInterview =
        result.data?.interview || interview;

      const submittedInterviewId =
        completedInterview?._id || interview._id;

      if (completedInterview) {
        setInterview(completedInterview);

        const finalDuration =
          completedInterview.actualDurationSeconds ??
          (completedInterview.startedAt &&
          completedInterview.completedAt
            ? Math.max(
                0,
                Math.floor(
                  (new Date(
                    completedInterview.completedAt
                  ).getTime() -
                    new Date(
                      completedInterview.startedAt
                    ).getTime()) /
                    1000
                )
              )
            : elapsedSeconds);

        setElapsedSeconds(finalDuration);
      }

      // Return to the preparation page after submission.
      navigate(`/preparation/${preparationId}`, {
        state: {
          mockInterviewSubmitted: true,
          interviewId: submittedInterviewId,
          milestone,
        },
      });
    } catch {
      setError("Unable to complete the interview.");
    } finally {
      setIsFinishing(false);
    }
  };
    if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3">
        <LoaderCircle
          className="animate-spin text-[var(--primary)]"
          size={25}
        />
        <p className="text-[var(--muted)]">
          Loading mock interview...
        </p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
        <Link
          to={`/preparation/${preparationId}`}
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)]"
        >
          <ArrowLeft size={16} />
          Back to preparation
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <p className="text-[var(--danger)]" role="alert">
            {error}
          </p>

          <button
            type="button"
            onClick={() => {
              setError("");
              loadInterview();
            }}
            className="mt-4 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const questionGenerationStatus = questionSet?.status;

  const questionsReady =
    questionGenerationStatus === "ready" &&
    Array.isArray(questionSet?.questions) &&
    questionSet.questions.length === 12;

  const generationFailed =
    questionGenerationStatus === "failed";

  const isGenerating =
    !questionsReady && !generationFailed;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 md:px-8">
      <Link
        to={`/preparation/${preparationId}`}
        className="inline-flex items-center gap-2 text-sm text-[var(--muted)] transition hover:text-[var(--primary)]"
      >
        <ArrowLeft size={16} />
        Back to preparation
      </Link>

      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-[var(--primary)]/10 p-3 text-[var(--primary)]">
              <Brain size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                {milestone === 50
                  ? "Mock Test 1"
                  : milestone === 75
                    ? "Mock Test 2"
                    : "Final Mock Test"}
              </h1>

              <p className="mt-2 text-sm text-[var(--muted)]">
                Your dedicated question set for the {milestone}%
                preparation milestone.
              </p>
            </div>
          </div>

          {(isActive || isFinished) && (
            <div className="flex items-center gap-2 rounded-xl bg-[var(--surface-secondary)] px-4 py-3">
              <Clock3
                size={19}
                className="text-[var(--primary)]"
              />
              <span className="font-mono text-lg font-bold">
                {formatTime(
                  isActive ? remainingSeconds : elapsedSeconds
                )}
              </span>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
            <p className="text-sm text-[var(--muted)]">
              Total questions
            </p>
            <p className="mt-1 text-2xl font-bold">
              {questions.length || (questionsReady ? 12 : 0)}
            </p>
          </div>

          <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
            <p className="text-sm text-[var(--muted)]">
              Answered
            </p>
            <p className="mt-1 text-2xl font-bold">
              {answeredCount}
            </p>
          </div>

          <div className="col-span-2 rounded-xl bg-[var(--surface-secondary)] p-4 sm:col-span-1">
            <p className="text-sm text-[var(--muted)]">
              Session status
            </p>
            <p className="mt-1 text-lg font-semibold capitalize">
              {sessionLocked || isTerminated
                ? "Terminated"
                : status ||
                  questionGenerationStatus ||
                  "Preparing"}
            </p>
          </div>
        </div>

        {questions.length > 0 && (
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all"
              style={{
                width: `${
                  (answeredCount / questions.length) * 100
                }%`,
              }}
            />
          </div>
        )}
      </header>

      {sessionLocked || isTerminated ? (
        <section className="rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30 md:p-8">
          <ShieldAlert
            size={40}
            className="text-red-600 dark:text-red-400"
          />

          <h2 className="mt-4 text-xl font-bold text-red-700 dark:text-red-300">
            Mock test stopped
          </h2>

          <p className="mt-3 text-sm leading-6 text-red-700 dark:text-red-300">
            {lockReason ||
              interview?.terminationReason ||
              "This interview session has been terminated."}
          </p>

          <Link
            to={`/preparation/${preparationId}`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700"
          >
            Return to preparation
          </Link>
        </section>
      ) : isFinished ? (
        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-emerald-600">
              <Trophy size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Mock test submitted
              </h2>

              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                Your answers have been saved. Return to your
                preparation to check your evaluation, or open the
                detailed report for this attempt.
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4">
            <p className="font-semibold">Evaluation status</p>

            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
              {interview.evaluationStatus === "pending" ||
              interview.evaluationStatus === "processing"
                ? "Your answers have been submitted. AI is evaluating them..."
                : interview.evaluationStatus === "failed"
                  ? interview.report?.summary ||
                    "Evaluation failed. Please check again later."
                  : interview.report?.summary ||
                    "Your interview has been submitted."}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate(`/preparation/${preparationId}`)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
            >
              Back to preparation
              <ArrowRight size={17} />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/mock-interview/${preparationId}/report/${interview._id}`
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold"
            >
              View detailed report
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      ) : !isActive ? (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex items-start gap-3">
            <ShieldAlert
              size={25}
              className="shrink-0 text-amber-500"
            />

            <div>
              <h2 className="text-xl font-bold">
                Before you begin
              </h2>

              <ul className="mt-3 list-inside list-disc space-y-2 text-sm leading-6 text-[var(--muted)]">
                <li>
                  This test uses a question set reserved for the{" "}
                  {milestone}% milestone.
                </li>
                <li>
                  The test contains 12 questions displayed one at
                  a time.
                </li>
                <li>
                  Your answers are saved to this mock interview
                  session.
                </li>
                <li>
                  Switching tabs or hiding the browser can
                  terminate the session.
                </li>
                <li>The time limit is 30 minutes.</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
            {questionsReady ? (
              <>
                <div className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle2 size={21} />
                  <h3 className="font-semibold">
                    Questions ready
                  </h3>
                </div>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  Your 12 questions are ready. You can start the
                  {` ${milestone}% `}milestone mock test.
                </p>
              </>
            ) : generationFailed ? (
              <>
                <div className="flex items-center gap-2 text-[var(--danger)]">
                  <CircleAlert size={21} />
                  <h3 className="font-semibold">
                    Question generation failed
                  </h3>
                </div>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  {questionSet?.generationError ||
                    "We couldn't generate your questions. Please retry."}
                </p>

                <button
                  type="button"
                  onClick={handleRetryGeneration}
                  disabled={isRetryingGeneration}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {isRetryingGeneration && (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  )}
                  {isRetryingGeneration
                    ? "Retrying..."
                    : "Retry question generation"}
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <LoaderCircle
                    size={21}
                    className="animate-spin"
                  />
                  <h3 className="font-semibold">
                    Preparing your questions
                  </h3>
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Questions are being generated in the background.
                  This page will check their status automatically.
                  You can return to your preparation and come back
                  later.
                </p>

                <p className="mt-3 text-xs text-[var(--muted)]">
                  Current status:{" "}
                  {questionGenerationStatus || "Checking status"}
                </p>
              </>
            )}
          </div>

          {error && (
            <p
              className="mt-4 text-sm text-[var(--danger)]"
              role="alert"
            >
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleStart}
            disabled={!questionsReady || isStarting}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isStarting && (
              <LoaderCircle
                size={17}
                className="animate-spin"
              />
            )}

            {isStarting
              ? "Starting mock test..."
              : questionsReady
                ? "Start Mock Test"
                : "Waiting for questions"}

            {!isStarting && questionsReady && (
              <ArrowRight size={17} />
            )}
          </button>
        </section>
      ) : (
        <section className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-[var(--primary)]">
                QUESTION {currentIndex + 1} OF {questions.length}
              </p>

              <h2 className="mt-2 text-xl font-bold md:text-2xl">
                {currentQuestion?.question}
              </h2>
            </div>

            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs font-medium">
              {currentQuestion?.difficulty || "Medium"}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentQuestion?.topic && (
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs text-[var(--primary)]">
                {currentQuestion.topic}
              </span>
            )}

            {currentQuestion?.type && (
              <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs text-[var(--muted)]">
                {currentQuestion.type}
              </span>
            )}
          </div>

          <div>
            <p className="font-semibold">Your answer</p>

            {currentQuestion?.type === "MCQ" ? (
              <div className="mt-3 space-y-3">
                {(currentQuestion.options || []).map(
                  (option, index) => {
                    const selected =
                      currentAnswer === String(index);

                    return (
                      <label
                        key={`${currentQuestion._id}-${index}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          selected
                            ? "border-[var(--primary)] bg-[var(--primary)]/10"
                            : "border-[var(--border)] hover:bg-[var(--surface-secondary)]"
                        } ${
                          isSaving || remainingSeconds <= 0
                            ? "cursor-not-allowed opacity-60"
                            : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name={`answer-${currentQuestion._id}`}
                          value={String(index)}
                          checked={selected}
                          onChange={() =>
                            handleAnswerChange(String(index))
                          }
                          disabled={
                            isSaving || remainingSeconds <= 0
                          }
                          className="mt-1 accent-violet-600"
                        />

                        <span className="font-medium">
                          <span className="mr-2 text-[var(--muted)]">
                            {String.fromCharCode(65 + index)}.
                          </span>
                          {option}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            ) : (
              <>
                <textarea
                  id="mock-answer"
                  value={currentAnswer}
                  onChange={(event) =>
                    handleAnswerChange(event.target.value)
                  }
                  disabled={
                    isSaving || remainingSeconds <= 0
                  }
                  rows={8}
                  maxLength={15000}
                  placeholder="Type your answer here..."
                  className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-4 text-sm leading-6 outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 disabled:opacity-60"
                />

                <p className="mt-1 text-right text-xs text-[var(--muted)]">
                  {currentAnswer.length}/15000 characters
                </p>
              </>
            )}
          </div>

          {error && (
            <div
              className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
              role="alert"
            >
              <CircleAlert
                size={18}
                className="mt-0.5 shrink-0"
              />
              <p>{error}</p>
            </div>
          )}

          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
              <LoaderCircle
                size={18}
                className="animate-spin text-[var(--primary)]"
              />
              Saving your answer...
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-5">
            <button
              type="button"
              onClick={handlePrevious}
              disabled={currentIndex === 0 || isSaving}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft size={16} />
              Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={
                  isSaving || remainingSeconds <= 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save & Next"}
                {!isSaving && <ArrowRight size={16} />}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={
                  isSaving ||
                  isFinishing ||
                  remainingSeconds <= 0
                }
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFinishing ? (
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                ) : (
                  <Flag size={17} />
                )}

                {isFinishing
                  ? "Finishing..."
                  : "Finish Interview"}
              </button>
            )}
          </div>

          <p className="text-center text-xs text-[var(--muted)]">
            <CheckCircle2
              className="mr-1 inline"
              size={14}
            />
            Your answers are saved independently from Interview
            Practice.
          </p>
        </section>
      )}
    </div>
  );
};

export default MockInterview; 
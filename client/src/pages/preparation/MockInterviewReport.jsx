import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LoaderCircle,
  Target,
  Trophy,
  XCircle,
} from "lucide-react";

import AppLayout from "../../layouts/AppLayout";
import { useAuth } from "../../context/AuthContext";

const API_URL = "http://localhost:5000/api/mock-interviews";

const apiRequest = async (endpoint, token) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json().catch(() => ({}));
    return { success: response.ok, status: response.status, data };
  } catch {
    return {
      success: false,
      status: 0,
      data: { message: "Unable to connect to the server. Please try again." },
    };
  }
};

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

const formatDuration = (seconds) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

const scoreTone = (score) => {
  if (score >= 80) return "text-emerald-600";
  if (score >= 60) return "text-amber-600";
  return "text-rose-600";
};

const MockInterviewReport = () => {
  const { preparationId, interviewId } = useParams();
  const { token } = useAuth();

  const [interview, setInterview] = useState(null);
  const [preparation, setPreparation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadReport = useCallback(async () => {
    if (!preparationId || !interviewId || !token) {
      setError("Preparation, interview, or authentication information is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await apiRequest(
      `/${preparationId}/report/${interviewId}`,
      token
    );

    if (!result.success) {
      setError(
        result.data?.message ||
          "Unable to load this report. Please try again."
      );
      setIsLoading(false);
      return;
    }

    setInterview(result.data?.interview || null);
    setPreparation(result.data?.preparation || null);
    setIsLoading(false);
  }, [preparationId, interviewId, token]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const questions = interview?.questions || [];
  const report = interview?.report || {};
  const scoredQuestions = questions.filter(
    (question) =>
      question.evaluation?.score !== null &&
      question.evaluation?.score !== undefined
  );
  const answeredCount = questions.filter((question) =>
    String(question.userAnswer || "").trim()
  ).length;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center gap-3 text-slate-600">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          <span>Loading your interview report…</span>
        </div>
      </AppLayout>
    );
  }

  if (error || !interview) {
    return (
      <AppLayout>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
            <div className="flex items-start gap-3">
              <CircleAlert className="mt-0.5 h-6 w-6 shrink-0" />
              <div>
                <h1 className="text-lg font-semibold">Report unavailable</h1>
                <p className="mt-2 text-sm">{error || "This report could not be found."}</p>
                <button
                  type="button"
                  onClick={loadReport}
                  className="mt-4 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
          <Link
            to={`/preparation/${preparationId}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft className="h-4 w-4" /> Back to preparation
          </Link>
        </div>
      </AppLayout>
    );
  }

  const averageScore =
    typeof report.averageScore === "number" ? report.averageScore : null;
  const evaluationStatus = interview.evaluationStatus || "not_started";

  return (
    <AppLayout>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          to={`/preparation/${preparationId}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to preparation
        </Link>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-indigo-950 via-indigo-800 to-violet-700 px-6 py-8 text-white sm:px-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-medium text-indigo-200">PrepPilot · Mock Interview Report</p>
                <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                  {preparation?.targetRole || "Interview"} performance report
                </h1>
                <p className="mt-2 text-sm text-indigo-100">
                  {preparation?.targetCompany
                    ? `Target company: ${preparation.targetCompany}`
                    : "Review your answers and feedback"}
                </p>
                <p className="mt-3 text-sm text-indigo-200">
                  Submitted {formatDate(interview.completedAt || interview.createdAt)}
                </p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold capitalize">
                {evaluationStatus === "completed" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : evaluationStatus === "failed" ? (
                  <CircleAlert className="h-4 w-4" />
                ) : (
                  <Clock3 className="h-4 w-4" />
                )}
                {evaluationStatus.replaceAll("_", " ")}
              </span>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4 sm:p-8">
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Trophy className="h-4 w-4" /> Overall score
              </div>
              <p className={`mt-3 text-3xl font-bold ${averageScore === null ? "text-slate-400" : scoreTone(averageScore)}`}>
                {averageScore === null ? "—" : `${averageScore}%`}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {averageScore === null ? "Score not available yet" : "Average of evaluated answers"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Target className="h-4 w-4" /> Answered
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{answeredCount}/{questions.length}</p>
              <p className="mt-1 text-xs text-slate-500">Questions with an answer</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <CheckCircle2 className="h-4 w-4" /> Evaluated
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{scoredQuestions.length}</p>
              <p className="mt-1 text-xs text-slate-500">Answers with a score</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock3 className="h-4 w-4" /> Duration
              </div>
              <p className="mt-3 text-3xl font-bold text-slate-900">{formatDuration(interview.actualDurationSeconds)}</p>
              <p className="mt-1 text-xs text-slate-500">Time spent in this attempt</p>
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-6 sm:px-8">
            <h2 className="text-lg font-semibold text-slate-900">Performance summary</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {report.summary || "No evaluation summary is available."}
            </p>
            {evaluationStatus === "pending" || evaluationStatus === "processing" ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Evaluation is still running. Refresh this page in a moment to see the completed feedback.
                <button
                  type="button"
                  onClick={loadReport}
                  className="rounded-lg border border-amber-300 px-3 py-1.5 font-semibold hover:bg-amber-100"
                >
                  Refresh report
                </button>
              </div>
            ) : null}
            {evaluationStatus === "failed" ? (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                Some or all answers could not be evaluated. The report shows the results that were saved successfully.
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Question-by-question review</h2>
              <p className="mt-1 text-sm text-slate-500">Review your answer, result, and recommended improvements.</p>
            </div>
            <span className="text-sm text-slate-500">{questions.length} questions</span>
          </div>

          <div className="space-y-5">
            {questions.map((question, index) => {
              const evaluation = question.evaluation || {};
              const hasAnswer = Boolean(String(question.userAnswer || "").trim());
              const hasScore =
                evaluation.score !== null && evaluation.score !== undefined;
              const correctMCQ =
                question.type === "MCQ" &&
                question.correctAnswer &&
                String(question.userAnswer) === String(question.correctOption);

              return (
                <article key={question._id || index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                        Question {index + 1} · {question.topic || "General"}
                      </p>
                      <h3 className="mt-2 text-base font-semibold leading-7 text-slate-900">{question.question}</h3>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{question.type || "Question"}</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{question.difficulty || "Medium"}</span>
                      {hasScore ? (
                        <span className={`rounded-full bg-slate-100 px-3 py-1 text-xs font-bold ${scoreTone(evaluation.score)}`}>{evaluation.score}%</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">Not scored</span>
                      )}
                    </div>
                  </div>

                  {question.type === "MCQ" && Array.isArray(question.options) ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option, optionIndex) => {
                        const selected = String(question.userAnswer) === String(optionIndex);
                        const correct = Number.isInteger(question.correctOption) && optionIndex === question.correctOption;
                        return (
                          <div key={`${question._id}-option-${optionIndex}`} className={`rounded-xl border p-3 text-sm ${correct ? "border-emerald-300 bg-emerald-50 text-emerald-900" : selected ? "border-rose-300 bg-rose-50 text-rose-900" : "border-slate-200 text-slate-600"}`}>
                            <span className="mr-2 font-semibold">{String.fromCharCode(65 + optionIndex)}.</span>
                            {option}
                            {selected ? <span className="ml-2 text-xs font-semibold">(Your answer)</span> : null}
                            {correct ? <span className="ml-2 text-xs font-semibold">(Correct answer)</span> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-5 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <h4 className="text-sm font-semibold text-slate-800">Your answer</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {hasAnswer
                          ? question.type === "MCQ"
                            ? question.options?.[Number(question.userAnswer)] || question.userAnswer
                            : question.userAnswer
                          : "No answer submitted."}
                      </p>
                      {question.type === "MCQ" && hasAnswer ? (
                        <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${correctMCQ ? "text-emerald-700" : "text-rose-700"}`}>
                          {correctMCQ ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          {correctMCQ ? "Correct" : "Incorrect"}
                        </p>
                      ) : null}
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4">
                      <h4 className="text-sm font-semibold text-indigo-950">Evaluation feedback</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {evaluation.feedback || (hasAnswer ? "Feedback is not available for this answer." : "This question was left unanswered.")}
                      </p>
                    </div>
                  </div>

                  {question.correctAnswer ? (
                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                      <h4 className="text-sm font-semibold text-emerald-950">Correct answer</h4>
                      <p className="mt-2 text-sm leading-6 text-emerald-900">{question.correctAnswer}</p>
                    </div>
                  ) : null}

                  {evaluation.suggestedAnswer ? (
                    <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                      <h4 className="text-sm font-semibold text-violet-950">Suggested answer</h4>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-violet-900">{evaluation.suggestedAnswer}</p>
                    </div>
                  ) : null}

                  
                </article>
              );
            })}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to={`/preparation/${preparationId}`}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to preparation
          </Link>
          <Link
            to={`/mock-interview/${preparationId}`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View mock interview history
          </Link>
        </div>
      </main>
    </AppLayout>
  );
};

export default MockInterviewReport;

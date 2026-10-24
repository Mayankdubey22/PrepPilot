
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Brain,
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import {
  getInterviewPractice,
  generateInterviewPractice,
  saveInterviewAnswer,
  evaluateInterviewAnswer,
} from "../../services/interviewPractice.service";

function InterviewPractice() {
  const { preparationId } = useParams();
  const { token } = useAuth();

  const [practice, setPractice] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [expandedQuestion, setExpandedQuestion] = useState(null);
  const [draftAnswers, setDraftAnswers] = useState({});
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [saveMessages, setSaveMessages] = useState({});
  const [evaluatingQuestionId, setEvaluatingQuestionId] = useState(null);
  const [evaluationErrors, setEvaluationErrors] = useState({});

  const loadPractice = useCallback(async () => {
    if (!preparationId || !token) {
      setError("Preparation ID or authentication is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getInterviewPractice(preparationId, token);

      if (!result.success) {
        setError(
          result.data?.message || "Unable to load interview practice."
        );
        return;
      }

      setPractice(result.data.practice || null);
      setDraftAnswers({});
      setSaveMessages({});
      setEvaluationErrors({});
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }, [preparationId, token]);

  useEffect(() => {
    loadPractice();
  }, [loadPractice]);

  const handleGenerate = async () => {
    if (!preparationId || !token || isGenerating) return;

    setIsGenerating(true);
    setError("");

    try {
      const result = await generateInterviewPractice(
        preparationId,
        token
      );

      if (!result.success) {
        setError(
          result.data?.message || "Unable to generate interview questions."
        );
        return;
      }

      setPractice(result.data.practice || null);
      setDraftAnswers({});
      setSaveMessages({});
      setEvaluationErrors({});
      setExpandedQuestion(null);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setDraftAnswers((previous) => ({
      ...previous,
      [questionId]: answer,
    }));

    setSaveMessages((previous) => ({
      ...previous,
      [questionId]: "",
    }));

    setEvaluationErrors((previous) => ({
      ...previous,
      [questionId]: "",
    }));

    // Hide the previous evaluation while the answer is being edited.
    setPractice((previous) => {
      if (!previous) return previous;

      return {
        ...previous,
        questions: previous.questions.map((question) =>
          question._id === questionId
            ? { ...question, evaluation: null }
            : question
        ),
      };
    });
  };

  const handleSaveAnswer = async (question) => {
    const questionId = question._id;
    const userAnswer =
      draftAnswers[questionId] ?? question.userAnswer ?? "";

    if (!questionId || !preparationId || !token) {
      setSaveMessages((previous) => ({
        ...previous,
        [questionId]: "Preparation or authentication is missing.",
      }));
      return;
    }

    if (savingQuestionId !== null || evaluatingQuestionId !== null) {
      return;
    }

    setSavingQuestionId(questionId);

    setSaveMessages((previous) => ({
      ...previous,
      [questionId]: "",
    }));

    try {
      const result = await saveInterviewAnswer(
        preparationId,
        questionId,
        userAnswer,
        token
      );

      if (!result.success) {
        setSaveMessages((previous) => ({
          ...previous,
          [questionId]:
            result.data?.message || "Unable to save your answer.",
        }));
        return;
      }

      setPractice((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          questions: previous.questions.map((item) =>
            item._id === questionId
              ? {
                ...item,
                userAnswer: result.data.question.userAnswer,
                answeredAt: result.data.question.answeredAt,
                evaluation: null,
              }
              : item
          ),
          status: userAnswer.trim() ? "in-progress" : previous.status,
        };
      });

      setDraftAnswers((previous) => {
        const updated = { ...previous };
        delete updated[questionId];
        return updated;
      });

      setSaveMessages((previous) => ({
        ...previous,
        [questionId]: "Answer saved successfully.",
      }));

      setEvaluationErrors((previous) => ({
        ...previous,
        [questionId]: "",
      }));
    } catch (err) {
      setSaveMessages((previous) => ({
        ...previous,
        [questionId]: err.message || "Unable to connect to the server.",
      }));
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleEvaluateAnswer = async (question) => {
    const questionId = question._id;

    if (!questionId || !preparationId || !token) {
      setEvaluationErrors((previous) => ({
        ...previous,
        [questionId]: "Preparation or authentication is missing.",
      }));
      return;
    }

    if (savingQuestionId !== null || evaluatingQuestionId !== null) {
      return;
    }

    const currentAnswer =
      draftAnswers[questionId] ?? question.userAnswer ?? "";

    if (!currentAnswer.trim()) {
      setEvaluationErrors((previous) => ({
        ...previous,
        [questionId]: "Write an answer before requesting evaluation.",
      }));
      return;
    }

    setEvaluatingQuestionId(questionId);
    setEvaluationErrors((previous) => ({
      ...previous,
      [questionId]: "",
    }));
    setSaveMessages((previous) => ({
      ...previous,
      [questionId]: "",
    }));

    try {
      // Save the latest draft before requesting an evaluation.
      if (currentAnswer !== (question.userAnswer ?? "")) {
        const saveResult = await saveInterviewAnswer(
          preparationId,
          questionId,
          currentAnswer,
          token
        );

        if (!saveResult.success) {
          setEvaluationErrors((previous) => ({
            ...previous,
            [questionId]:
              saveResult.data?.message || "Unable to save your answer.",
          }));
          return;
        }

        setPractice((previous) => {
          if (!previous) return previous;

          return {
            ...previous,
            questions: previous.questions.map((item) =>
              item._id === questionId
                ? {
                  ...item,
                  userAnswer: saveResult.data.question.userAnswer,
                  answeredAt: saveResult.data.question.answeredAt,
                  evaluation: null,
                }
                : item
            ),
          };
        });

        setDraftAnswers((previous) => {
          const updated = { ...previous };
          delete updated[questionId];
          return updated;
        });
      }

      const result = await evaluateInterviewAnswer(
        preparationId,
        questionId,
        token
      );

      if (!result.success) {
        setEvaluationErrors((previous) => ({
          ...previous,
          [questionId]:
            result.data?.message || "Unable to evaluate your answer.",
        }));
        return;
      }

      if (!result.data?.evaluation) {
        setEvaluationErrors((previous) => ({
          ...previous,
          [questionId]: "The server did not return an evaluation.",
        }));
        return;
      }

      setPractice((previous) => {
        if (!previous) return previous;

        return {
          ...previous,
          questions: previous.questions.map((item) =>
            item._id === questionId
              ? { ...item, evaluation: result.data.evaluation }
              : item
          ),
        };
      });
    } catch (err) {
      setEvaluationErrors((previous) => ({
        ...previous,
        [questionId]: err.message || "Unable to connect to the server.",
      }));
    } finally {
      setEvaluatingQuestionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoaderCircle className="animate-spin" size={28} />
        <span className="ml-3 text-gray-500">
          Loading interview practice...
        </span>
      </div>
    );
  }

  const questions = practice?.questions || [];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <Link
        to={`/preparation/${preparationId}`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-indigo-600"
      >
        <ArrowLeft size={16} />
        Back to preparation
      </Link>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:p-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <Brain size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white md:text-3xl">
                Interview Practice
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Practice role-specific questions generated with AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || savingQuestionId !== null || evaluatingQuestionId !== null}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isGenerating ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <RefreshCw size={18} />
            )}
            {isGenerating ? "Generating..." : "Load or Generate"}
          </button>
        </div>

        {error && (
          <div
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            role="alert"
          >
            {error}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total questions
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {questions.length}
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Draft answers
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
              {
                Object.values(draftAnswers).filter(
                  (answer) => answer.trim().length > 0
                ).length
              }
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Session status
            </p>
            <p className="mt-1 text-lg font-semibold capitalize text-gray-900 dark:text-white">
              {practice?.status?.replace("-", " ") || "Not started"}
            </p>
          </div>
        </div>
      </section>

      {!practice && !error && (
        <section className="rounded-2xl border border-dashed border-gray-300 p-8 text-center dark:border-gray-700">
          <Brain
            size={36}
            className="mx-auto text-indigo-500"
          />
          <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
            Ready to practice?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500 dark:text-gray-400">
            Generate personalized interview questions based on your
            selected preparation and resume.
          </p>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="mt-5 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {isGenerating ? "Generating questions..." : "Generate Questions"}
          </button>
        </section>
      )}

      {questions.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Your questions
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Select a question to view details and draft your answer.
            </p>
          </div>

          {questions.map((question, index) => {
            const questionId = question._id || String(index);
            const isExpanded = expandedQuestion === questionId;
            const evaluation = question.evaluation;

            return (
              <article
                key={questionId}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedQuestion(isExpanded ? null : questionId)
                  }
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      {index + 1}
                    </span>

                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {question.question}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          {question.topic || "General"}
                        </span>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {question.type || "Technical"}
                        </span>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {question.difficulty || "Medium"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="shrink-0" size={20} />
                  ) : (
                    <ChevronDown className="shrink-0" size={20} />
                  )}
                </button>

                {isExpanded && (
                  <div className="space-y-5 border-t border-gray-200 p-5 dark:border-gray-800">
                    {question.expectedPoints?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Key points to consider
                        </h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600 dark:text-gray-300">
                          {question.expectedPoints.map((point, pointIndex) => (
                            <li key={pointIndex}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor={`answer-${questionId}`}
                        className="font-semibold text-gray-900 dark:text-white"
                      >
                        Your answer
                      </label>

                      <textarea
                        id={`answer-${questionId}`}
                        value={
                          draftAnswers[questionId] ??
                          question.userAnswer ??
                          ""
                        }
                        onChange={(event) =>
                          handleAnswerChange(questionId, event.target.value)
                        }
                        rows={5}
                        placeholder="Write your answer here..."
                        className="mt-2 w-full rounded-xl border border-gray-300 bg-white p-4 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-indigo-950"
                      />

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveAnswer(question)}
                          disabled={
                            savingQuestionId !== null ||
                            evaluatingQuestionId !== null
                          }
                          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingQuestionId === questionId
                            ? "Saving..."
                            : "Save Answer"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEvaluateAnswer(question)}
                          disabled={
                            savingQuestionId !== null ||
                            evaluatingQuestionId !== null
                          }
                          className="rounded-xl border border-indigo-200 px-4 py-2.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950"
                        >
                          {evaluatingQuestionId === questionId
                            ? "Evaluating..."
                            : "Evaluate Answer"}
                        </button>
                      </div>

                      {saveMessages[questionId] && (
                        <p
                          className={`mt-2 text-sm ${saveMessages[questionId] ===
                              "Answer saved successfully."
                              ? "text-green-600"
                              : "text-red-500"
                            }`}
                          role="status"
                        >
                          {saveMessages[questionId]}
                        </p>
                      )}

                      {evaluationErrors[questionId] && (
                        <p className="mt-2 text-sm text-red-500" role="alert">
                          {evaluationErrors[questionId]}
                        </p>
                      )}
                    </div>


                    {evaluation && (
                      <div className="space-y-5 rounded-xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                              AI Evaluation
                            </h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                              Feedback on your interview answer
                            </p>
                          </div>

                          <div className="rounded-xl bg-white px-4 py-3 text-center dark:bg-gray-900">
                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                              {Number.isFinite(Number(evaluation.score))
                                ? `${Number(evaluation.score)}/100`
                                : "Score unavailable"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Answer score
                            </p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Overall feedback
                          </h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                            {evaluation.feedback || "No feedback provided."}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            Suggested answer
                          </h4>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600 dark:text-gray-300">
                            {evaluation.suggestedAnswer || "No suggested answer provided."}
                          </p>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default InterviewPractice;

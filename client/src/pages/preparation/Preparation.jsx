
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  GraduationCap,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/useAuth";
import { getMockInterview } from "../../services/mockInterview.service";
import {
  getMyPreparations,
  getPreparationPlan,
  generatePreparationPlan,
  updatePreparationTask,
} from "../../services/preparation.service";

const Preparation = () => {
  const { token } = useAuth();
  const { preparationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [preparation, setPreparation] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [expandedDays, setExpandedDays] = useState([1]);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [mockInterviewData, setMockInterviewData] = useState(null);
  const [showResultPopup, setShowResultPopup] = useState(false);
  const [resultPopupMessage, setResultPopupMessage] = useState("");
  const [resultInterviewId, setResultInterviewId] = useState("");

  const loadPreparation = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");
    setPlanError("");
    setPlan(null);
    setPreparation(null);

    try {
      const result = await getMyPreparations();

      if (!result.success) {
        setError(
          result.data?.message || "Unable to load your preparation."
        );
        return;
      }

      const preparations = result.data?.preparations || [];

      const currentPreparation = preparationId
        ? preparations.find((item) => item._id === preparationId) || null
        : preparations[0] || null;

      if (preparationId && !currentPreparation) {
        setError("This preparation was not found in your account.");
        return;
      }

      setPreparation(currentPreparation);

      if (!currentPreparation) return;

      const planResult = await getPreparationPlan(
        currentPreparation._id,
      );

      if (planResult.success) {
        setPlan(planResult.data?.plan || null);
      } else if (planResult.status !== 404) {
        setPlanError(
          planResult.data?.message ||
          "Unable to load your saved AI plan."
        );
      }

      const mockResult = await getMockInterview(
        currentPreparation._id,
      );

      if (mockResult.success) {
        setMockInterviewData(mockResult.data || null);
      }
    } catch {
      setError("Something went wrong while loading your preparation.");
    } finally {
      setIsLoading(false);
    }
  }, [token, preparationId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPreparation();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadPreparation]);

  useEffect(() => {
    const submittedFromMock = location.state?.mockInterviewSubmitted;
    const interviewId = location.state?.interviewId;

    if (
      !submittedFromMock ||
      !preparation?._id ||
      !token ||
      !interviewId
    ) {
      return undefined;
    }

    let cancelled = false;
    let timer;

    const checkEvaluation = async () => {
      const result = await getMockInterview(preparation._id);

      if (cancelled) return;

      if (result.success) {
        setMockInterviewData(result.data || null);

        const attempts = result.data?.interviews || [];
        const submittedInterview =
          attempts.find((item) => item._id === interviewId) ||
          (result.data?.interview?._id === interviewId
            ? result.data.interview
            : null);

        if (
          submittedInterview &&
          ["completed", "failed"].includes(
            submittedInterview.evaluationStatus
          )
        ) {
          setResultPopupMessage(
            submittedInterview.evaluationStatus === "failed"
              ? "Your interview was submitted, but evaluation failed. You can open the report for details."
              : `Your mock interview evaluation is complete. Score: ${submittedInterview.report?.averageScore ?? "N/A"
              }%`
          );

          setShowResultPopup(true);
          return;
        }
      }

      timer = setTimeout(checkEvaluation, 3000);
    };

    timer = window.setTimeout(() => {
      setResultInterviewId(interviewId);
      setResultPopupMessage(
        "Your answers were submitted. PrepPilot is evaluating them in the background."
      );
      checkEvaluation();
    }, 0);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [location.state, preparation?._id, token]);

  const handleCloseResultPopup = () => {
    setShowResultPopup(false);
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleGeneratePlan = async () => {
    if (!preparation?._id || !token || isGenerating) return;

    setIsGenerating(true);
    setPlanError("");

    try {
      const result = await generatePreparationPlan(
        preparation._id,
      );

      if (!result.success) {
        setPlanError(
          result.data?.message ||
          "Unable to generate your AI plan. Please try again."
        );
        return;
      }

      setPlan(result.data?.plan || null);
      setExpandedDays([1]);
    } catch {
      setPlanError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTaskCompletion = async (
    dayId,
    taskId,
    isCompleted
  ) => {
    if (!preparation?._id || !token || updatingTaskId) return;

    setUpdatingTaskId(taskId);
    setPlanError("");

    try {
      const result = await updatePreparationTask(
        preparation._id,
        dayId,
        taskId,
        isCompleted,
      );

      if (!result.success) {
        setPlanError(
          result.data?.message || "Unable to update task completion."
        );
        return;
      }

      setPlan((currentPlan) => ({
        ...currentPlan,
        days: currentPlan.days.map((day) =>
          day._id === dayId
            ? {
              ...day,
              tasks: day.tasks.map((task) =>
                task._id === taskId
                  ? {
                    ...task,
                    isCompleted,
                    completedAt: result.data.task.completedAt,
                  }
                  : task
              ),
            }
            : day
        ),
      }));

      setPreparation((current) => ({
        ...current,
        progress: result.data.progress,
      }));
    } catch {
      setPlanError("Something went wrong while updating the task.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const toggleDay = (dayNumber) => {
    setExpandedDays((current) =>
      current.includes(dayNumber)
        ? current.filter((day) => day !== dayNumber)
        : [...current, dayNumber]
    );
  };

  const totalTasks =
    plan?.days?.reduce(
      (total, day) => total + (day.tasks?.length || 0),
      0
    ) || 0;

  const completedTasks =
    plan?.days?.reduce(
      (total, day) =>
        total +
        (day.tasks?.filter((task) => task.isCompleted).length || 0),
      0
    ) || 0;

  const taskProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const milestones = [
    {
      threshold: 50,
      title: "50% — Mock Test 1",
      description: "Complete 50% of your study plan to unlock your first mock test.",
      milestone: 1,
    },
    {
      threshold: 75,
      title: "75% — Mock Test 2",
      description: "Complete 75% of your study plan to unlock your second mock test.",
      milestone: 2,
    },
    {
      threshold: 100,
      title: "100% — Final Mock Test",
      description: "Complete your entire study plan to unlock the final mock test.",
      milestone: 3,
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/preparation-history"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <ArrowLeft size={16} />
              Back to preparation history
            </Link>

            <h1 className="text-3xl font-bold">Your Preparation</h1>

            <p className="mt-2 text-[var(--muted)]">
              Review your interview preparation and personalized AI study
              plan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {preparation && (
              <Link
                to={`/interview-practice/${preparation._id}`}
                className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <Brain size={18} className="mr-2" />
                Interview Practice
              </Link>
            )}

            <Button
              variant="secondary"
              onClick={loadPreparation}
              disabled={isLoading || isGenerating}
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <div className="flex items-center gap-3">
              <LoaderCircle className="animate-spin" size={20} />
              <p className="text-[var(--muted)]">
                Loading your preparation and AI plan...
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
            <Button className="mt-4" onClick={loadPreparation}>
              Try again
            </Button>
          </Card>
        ) : !preparation ? (
          <Card>
            <div className="py-8 text-center">
              <FileText
                size={40}
                className="mx-auto mb-4 text-[var(--muted)]"
              />

              <h2 className="text-xl font-semibold">No preparation found</h2>

              <p className="mt-2 text-[var(--muted)]">
                Start a preparation to see your details here.
              </p>

              <Link to="/start-prep" className="mt-5 inline-block">
                <Button>Start Preparation</Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                    {preparation.status || "ACTIVE"}
                  </span>

                  <h2 className="mt-4 text-2xl font-bold">
                    {preparation.targetRole}
                  </h2>

                  <p className="mt-2 text-[var(--muted)]">
                    {preparation.targetCompany ||
                      "No target company specified"}
                  </p>
                </div>

                <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                  <p className="text-sm text-[var(--muted)]">
                    Overall progress
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[var(--primary)]">
                    {preparation.progress ?? 0}%
                  </p>
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                <div
                  className="h-full rounded-full bg-[var(--primary)] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, preparation.progress ?? 0)
                    )}%`,
                  }}
                />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DetailCard
                icon={<BriefcaseBusiness size={20} />}
                label="Target Role"
                value={preparation.targetRole}
              />
              <DetailCard
                icon={<GraduationCap size={20} />}
                label="Experience"
                value={preparation.experience}
              />
              <DetailCard
                icon={<CalendarDays size={20} />}
                label="Duration"
                value={preparation.duration}
              />
              <DetailCard
                icon={<Clock3 size={20} />}
                label="Daily Study Time"
                value={preparation.dailyTime}
              />
              <DetailCard
                icon={<GraduationCap size={20} />}
                label="Difficulty"
                value={preparation.difficulty}
              />
              <DetailCard
                icon={<FileText size={20} />}
                label="Resume"
                value={
                  preparation.resumeId?.fileName ||
                  preparation.resume?.fileName ||
                  "Resume information unavailable"
                }
              />
            </div>

            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2">
                    <Brain size={22} className="text-[var(--primary)]" />
                    <h2 className="text-xl font-semibold">
                      Preparation Milestones
                    </h2>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Complete your AI study-plan tasks to progress through
                    the 50%, 75%, and 100% milestones.
                  </p>

                  <p className="mt-3 text-sm font-medium">
                    Study-plan progress: {taskProgress}%
                  </p>

                  <div className="mt-2 h-2 max-w-lg overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${taskProgress}%` }}
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
                {milestones.map((milestone) => {
                  const reached = taskProgress >= milestone.threshold;

                  return (
                    <div
                      key={milestone.threshold}
                      className={`rounded-xl border p-4 ${reached
                          ? "border-emerald-500/40 bg-emerald-500/5"
                          : "border-[var(--border)] bg-[var(--surface-secondary)]"
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        {reached ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500"
                          />
                        ) : (
                          <Clock3
                            size={18}
                            className="text-[var(--muted)]"
                          />
                        )}

                        <p className="font-semibold">{milestone.title}</p>
                      </div>

                      <p className="mt-2 text-sm leading-5 text-[var(--muted)]">
                        {milestone.description}
                      </p>

                      <p
                        className={`mt-3 text-xs font-semibold ${reached
                            ? "text-emerald-600"
                            : "text-[var(--muted)]"
                          }`}
                      >
                        {reached
                          ? "Milestone reached"
                          : `${milestone.threshold - taskProgress}% remaining`}
                      </p>

                      {reached ? (
                        <Link
                          to={`/mock-interview/${preparation._id}?milestone=${milestone.threshold}`}
                          className="mt-4 inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                        >
                          <Brain size={16} className="mr-2" />
                          Start Mock Test
                        </Link>
                      ) : (
                        <p className="mt-4 text-sm text-[var(--muted)]">
                          Unlocks at {milestone.threshold}% progress
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {mockInterviewData?.interviews?.length > 0 && (
                <div className="mt-6 border-t border-[var(--border)] pt-4">
                  <h3 className="font-semibold">
                    Previous Mock Test Results
                  </h3>

                  <div className="mt-3 space-y-2">
                    {mockInterviewData.interviews.map((attempt, index) => (
                      <div
                        key={attempt._id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-secondary)] p-3"
                      >
                        <div>
                          <p className="font-medium">
                            Attempt {mockInterviewData.interviews.length - index}
                          </p>

                          <p className="text-sm text-[var(--muted)]">
                            {attempt.evaluationStatus === "completed"
                              ? `Score: ${attempt.report?.averageScore ?? "N/A"}%`
                              : attempt.evaluationStatus === "failed"
                                ? "Evaluation failed"
                                : attempt.status === "completed"
                                  ? "Evaluation in progress"
                                  : attempt.status}
                          </p>
                        </div>

                        <Link
                          to={`/mock-interview/${preparation._id}/report/${attempt._id}`}
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                        >
                          View report
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <h2 className="text-xl font-semibold">Interview Types</h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {(preparation.interviewTypes || []).map((type) => (
                  <span
                    key={type}
                    className="rounded-full border border-[var(--border)] px-3 py-2 text-sm"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </Card>

            {preparation.jobDescription && (
              <Card>
                <h2 className="text-xl font-semibold">Job Description</h2>

                <p className="mt-3 whitespace-pre-wrap leading-7 text-[var(--muted)]">
                  {preparation.jobDescription}
                </p>
              </Card>
            )}

            <section className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={22}
                    className="text-[var(--primary)]"
                  />
                  <h2 className="text-2xl font-bold">
                    Your AI Study Plan
                  </h2>
                </div>

                <p className="mt-2 text-sm text-[var(--muted)]">
                  A personalized roadmap based on your role, experience,
                  resume, and interview goals.
                </p>
              </div>

              {planError && (
                <Card>
                  <p className="text-[var(--danger)]">{planError}</p>
                </Card>
              )}

              {plan ? (
                <>
                  <Card>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--primary)]">
                          YOUR PERSONALIZED ROADMAP
                        </p>

                        <h3 className="mt-2 text-xl font-bold">
                          {plan.title}
                        </h3>

                        <p className="mt-3 leading-7 text-[var(--muted)]">
                          {plan.overview}
                        </p>
                      </div>

                      <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                        <p className="text-sm text-[var(--muted)]">
                          Plan duration
                        </p>
                        <p className="mt-1 text-xl font-bold">
                          {plan.days?.length || 0} days
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <StatCard label="Total tasks" value={totalTasks} />
                      <StatCard label="Completed" value={completedTasks} />
                      <StatCard
                        label="Task progress"
                        value={`${taskProgress}%`}
                      />
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)] transition-all"
                        style={{ width: `${taskProgress}%` }}
                      />
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {(plan.days || []).map((day) => {
                      const isExpanded = expandedDays.includes(day.day);
                      const dayTasks = day.tasks || [];
                      const dayCompleted = dayTasks.filter(
                        (task) => task.isCompleted
                      ).length;

                      return (
                        <Card key={day._id || day.day}>
                          <button
                            type="button"
                            onClick={() => toggleDay(day.day)}
                            aria-expanded={isExpanded}
                            className="flex w-full items-center justify-between gap-4 text-left"
                          >
                            <div className="flex min-w-0 items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 font-bold text-[var(--primary)]">
                                {String(day.day).padStart(2, "0")}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">
                                  Day {day.day}
                                </p>

                                <h3 className="mt-1 font-semibold">
                                  {day.title}
                                </h3>

                                <p className="mt-1 text-sm text-[var(--muted)]">
                                  {day.focus}
                                </p>

                                <p className="mt-2 text-xs text-[var(--muted)]">
                                  {dayCompleted} of {dayTasks.length} tasks
                                  completed
                                </p>
                              </div>
                            </div>

                            {isExpanded ? (
                              <ChevronUp className="shrink-0" size={20} />
                            ) : (
                              <ChevronDown className="shrink-0" size={20} />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-5 space-y-3 border-t border-[var(--border)] pt-4">
                              {dayTasks.map((task) => (
                                <div
                                  key={task._id || task.title}
                                  className="rounded-xl border border-[var(--border)] p-4"
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(task.isCompleted)}
                                      disabled={updatingTaskId !== null}
                                      onChange={(event) =>
                                        handleTaskCompletion(
                                          day._id,
                                          task._id,
                                          event.target.checked
                                        )
                                      }
                                      aria-label={`Mark ${task.title} as completed`}
                                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-violet-600 disabled:cursor-not-allowed"
                                    />

                                    <div className="min-w-0 flex-1">
                                      <h4
                                        className={`font-medium ${task.isCompleted
                                            ? "text-[var(--muted)] line-through"
                                            : ""
                                          }`}
                                      >
                                        {task.title}
                                      </h4>

                                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--muted)]">
                                        {task.description}
                                      </p>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs">
                                          {task.durationMinutes} min
                                        </span>

                                        <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-xs">
                                          {task.type}
                                        </span>

                                        {updatingTaskId === task._id && (
                                          <span className="text-xs text-[var(--muted)]">
                                            Saving...
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <Card>
                  <div className="py-6 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Sparkles size={26} />
                    </div>

                    <h3 className="mt-4 text-xl font-semibold">
                      Generate your personalized study plan
                    </h3>

                    <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--muted)]">
                      PrepPilot will use your saved preparation details
                      and resume to create a day-by-day interview
                      preparation roadmap.
                    </p>

                    <Button
                      className="mt-5"
                      onClick={handleGeneratePlan}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <>
                          <LoaderCircle
                            size={18}
                            className="mr-2 animate-spin"
                          />
                          Generating your plan...
                        </>
                      ) : (
                        <>
                          <Sparkles size={18} className="mr-2" />
                          Generate AI Plan
                        </>
                      )}
                    </Button>

                    {isGenerating && (
                      <p className="mt-4 text-sm text-[var(--muted)]">
                        AI is creating your plan. This can take a little
                        while. Please keep this page open.
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </section>
          </>
        )}
      </div>

      {showResultPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mock-result-title"
        >
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="mock-result-title" className="text-xl font-bold">
                  Mock Test Result
                </h2>
                <p className="mt-3 leading-6 text-[var(--muted)]">
                  {resultPopupMessage}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCloseResultPopup}
                className="rounded-lg px-2 py-1 text-xl text-[var(--muted)] hover:bg-[var(--surface-secondary)]"
                aria-label="Close result popup"
              >
                ×
              </button>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                onClick={handleCloseResultPopup}
              >
                Close
              </Button>

              <Link
                to={
                  resultInterviewId
                    ? `/mock-interview/${preparation?._id}/report/${resultInterviewId}`
                    : `/mock-interview/${preparation?._id}`
                }
                onClick={handleCloseResultPopup}
                className="inline-flex items-center rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                View Detailed Report
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

const DetailCard = ({ icon, label, value }) => (
  <Card>
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-[var(--surface-secondary)] p-3 text-[var(--primary)]">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="mt-1 break-words font-semibold">
          {value || "Not specified"}
        </p>
      </div>
    </div>
  </Card>
);

const StatCard = ({ label, value }) => (
  <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
    <p className="text-sm text-[var(--muted)]">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </div>
);

export default Preparation;

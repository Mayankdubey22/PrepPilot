
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  MessageSquare,
  Target,
  Trophy,
} from "lucide-react";
import { Link } from "react-router";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import {
  getMyPreparations,
  getPreparationPlan,
} from "../../services/preparation.service";
import { getInterviewPracticeStats } from "../../services/interviewPractice.service";
import { getMockInterview } from "../../services/mockInterview.service";

const Home = () => {
  const { user, token } = useAuth();

  const [preparation, setPreparation] = useState(null);
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [practiceStats, setPracticeStats] = useState(null);
  const [practiceActivity, setPracticeActivity] = useState([]);
  const [practiceStatsError, setPracticeStatsError] = useState("");
  const [mockInterviewData, setMockInterviewData] = useState(null);
  const [mockInterviewError, setMockInterviewError] = useState("");

  const firstName = user?.name?.split(" ")[0] || "there";

  
const loadDashboard = useCallback(async () => {
  if (!token) {
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  setError("");
  setPracticeStatsError("");
  setMockInterviewError("");

  try {
    const preparationResult = await getMyPreparations(token);

    if (!preparationResult.success) {
      setError(
        preparationResult.data?.message ||
          "Unable to load your dashboard."
      );
      return;
    }

    const preparations = Array.isArray(
      preparationResult.data?.preparations
    )
      ? preparationResult.data.preparations
      : [];

    const currentPreparation = preparations[0] || null;

    setPreparation(currentPreparation);
    setPlan(null);
    setMockInterviewData(null);

    if (currentPreparation) {
      // Load mock interview results independently.
      try {
        const mockResult = await getMockInterview(
          currentPreparation._id,
          token
        );

        if (mockResult.success) {
          setMockInterviewData(mockResult.data || null);
        } else {
          setMockInterviewError(
            mockResult.data?.message ||
              "Unable to load mock interview results."
          );
        }
      } catch {
        setMockInterviewError(
          "Unable to load mock interview results."
        );
      }

      // Load the preparation plan.
      try {
        const planResult = await getPreparationPlan(
          currentPreparation._id,
          token
        );

        if (planResult.success) {
          setPlan(planResult.data?.plan || null);
        } else if (planResult.status !== 404) {
          setError(
            planResult.data?.message ||
              "Unable to load your preparation plan."
          );
        }
      } catch {
        setError("Unable to load your preparation plan.");
      }
    }

    // Practice statistics should not prevent the main dashboard
    // from displaying an empty state or an existing preparation.
    try {
      const statsResult = await getInterviewPracticeStats(token);

      if (statsResult.success) {
        setPracticeStats(statsResult.data?.stats || null);
        setPracticeActivity(
          statsResult.data?.recentActivity || []
        );
      } else {
        setPracticeStatsError(
          statsResult.data?.message ||
            "Unable to load practice statistics."
        );
      }
    } catch {
      setPracticeStatsError(
        "Unable to load practice statistics."
      );
    }
  } catch {
    setError("Something went wrong while loading your dashboard.");
  } finally {
    // Always stop the main loading spinner.
    setIsLoading(false);
  }
}, [token]);


  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const allTasks = (plan?.days || []).flatMap(
    (day) => day.tasks || []
  );

  const completedTasks = allTasks.filter(
    (task) => task.isCompleted
  ).length;

  const totalTasks = allTasks.length;
  const remainingTasks = totalTasks - completedTasks;

  const calculatedProgress =
    totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0;

  const progress = plan
    ? calculatedProgress
    : preparation?.progress ?? 0;

  const today = new Date();
  const dayOfPlan = preparation?.startDate
    ? Math.max(
      1,
      Math.floor(
        (today.getTime() -
          new Date(preparation.startDate).getTime()) /
        (1000 * 60 * 60 * 24)
      ) + 1
    )
    : 1;

  const todayPlanDay = plan?.days?.find(
    (day) => day.day === dayOfPlan
  );

  const displayedTasks = todayPlanDay?.tasks || [];

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Welcome section */}
        <section>
          <p className="mb-2 text-sm font-medium text-[var(--primary)]">
            Your interview journey
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Good morning, {firstName} 👋
          </h1>

          <p className="mt-2 text-[var(--muted)]">
            Let's continue preparing for your next interview.
          </p>
        </section>

        {isLoading ? (
          <Card>
            <div className="flex items-center gap-3">
              <LoaderCircle
                size={20}
                className="animate-spin text-[var(--primary)]"
              />
              <p className="text-[var(--muted)]">
                Loading your preparation...
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
            <Button className="mt-4" onClick={loadDashboard}>
              Try again
            </Button>
          </Card>
        ) : !preparation ? (
          <Card className="py-8 text-center">
            <Target
              size={40}
              className="mx-auto text-[var(--primary)]"
            />
            <h2 className="mt-4 text-xl font-semibold">
              Start your interview preparation
            </h2>
            <p className="mt-2 text-[var(--muted)]">
              Create a personalized roadmap for your target role.
            </p>
            <Link to="/start-prep" className="mt-5 inline-block">
              <Button>
                Start Preparation
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Current preparation and progress */}
            <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card className="relative overflow-hidden">
                <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[var(--primary)]/10 blur-2xl" />

                <div className="relative">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-[var(--muted)]">
                        Current Preparation
                      </p>
                      <h2 className="mt-1 text-xl font-bold">
                        {preparation.targetRole}
                      </h2>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        {preparation.targetCompany ||
                          "Target company not specified"}
                      </p>
                    </div>

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Target size={21} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                      <p className="text-xs text-[var(--muted)]">
                        Preparation Duration
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {preparation.duration}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        Day {Math.min(
                          dayOfPlan,
                          plan?.days?.length || dayOfPlan
                        )} of {plan?.days?.length || Number.parseInt(
                          preparation.duration,
                          10
                        ) || "—"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[var(--surface-secondary)] p-4">
                      <p className="text-xs text-[var(--muted)]">
                        Tasks Remaining
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {plan ? remainingTasks : "—"}
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {plan
                          ? `${completedTasks} completed`
                          : "Generate your AI plan"}
                      </p>
                    </div>
                  </div>

                  <Link
                    to="/preparation"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    Continue preparation
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[var(--muted)]">
                      Overall Progress
                    </p>
                    <p className="mt-1 text-3xl font-bold">
                      {progress}%
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                    <BarChart3 size={22} />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between gap-3 text-xs">
                    <span className="text-[var(--muted)]">
                      {plan
                        ? "Completed tasks"
                        : "Task completion progress"}
                    </span>
                    <span className="font-medium">
                      {plan
                        ? `${completedTasks} / ${totalTasks}`
                        : `${progress}%`}
                    </span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                    <div
                      className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, progress)
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-sm text-[var(--muted)]">
                  {plan
                    ? remainingTasks === 0
                      ? "Congratulations! You have completed every task in this plan."
                      : "Keep completing your daily tasks to reach your interview goals."
                    : "Your preparation progress will update as you complete tasks."}
                </p>
              </Card>
            </section>


            {/* Interview Practice Progress */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Interview Practice Progress</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Track your answers and AI evaluation results.
                </p>
              </div>

              {practiceStatsError ? (
                <Card>
                  <p className="text-sm text-[var(--danger)]">
                    {practiceStatsError}
                  </p>
                </Card>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--muted)]">
                            Questions Attempted
                          </p>
                          <p className="mt-2 text-3xl font-bold">
                            {practiceStats?.attemptedQuestions ?? "—"}
                          </p>
                        </div>
                        <Brain className="text-[var(--primary)]" size={25} />
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--muted)]">
                            Questions Evaluated
                          </p>
                          <p className="mt-2 text-3xl font-bold">
                            {practiceStats?.evaluatedQuestions ?? "—"}
                          </p>
                        </div>
                        <CheckCircle2 className="text-emerald-500" size={25} />
                      </div>
                    </Card>

                    <Card>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-[var(--muted)]">
                            Average Score
                          </p>
                          <p className="mt-2 text-3xl font-bold">
                            {practiceStats?.averageScore == null
                              ? "—"
                              : `${practiceStats.averageScore}/100`}
                          </p>
                        </div>
                        <Trophy className="text-amber-500" size={25} />
                      </div>
                    </Card>
                  </div>

                  <Card>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">Recent Practice Activity</h3>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          Your five most recent answered or evaluated questions.
                        </p>
                      </div>
                      <Link
                        to={
                          preparation?._id
                            ? `/interview-practice/${preparation._id}`
                            : "/preparation-history"
                        }
                        className="shrink-0 text-sm font-medium text-[var(--primary)] hover:underline"
                      >
                        Practice <ArrowRight className="inline" size={15} />
                      </Link>
                    </div>

                    {practiceActivity.length === 0 ? (
                      <p className="mt-5 text-sm text-[var(--muted)]">
                        No interview practice activity yet. Answer a question and
                        evaluate it to see your progress here.
                      </p>
                    ) : (
                      <div className="mt-4 divide-y divide-[var(--border)]">
                        {practiceActivity.map((activity, index) => (
                          <div
                            key={activity.questionId || index}
                            className="flex flex-wrap items-center justify-between gap-3 py-4"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-medium">{activity.question}</p>
                              <p className="mt-1 text-sm text-[var(--muted)]">
                                {activity.targetRole} · {activity.topic}
                              </p>
                              {activity.activityDate && (
                                <p className="mt-1 text-xs text-[var(--muted)]">
                                  {new Date(activity.activityDate).toLocaleString()}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {activity.evaluated && activity.score != null ? (
                                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
                                  {activity.score}/100
                                </span>
                              ) : (
                                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600">
                                  Answer saved
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </>
              )}
            </section>


            {/* Mock Interview Results */}
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Mock Interview Results</h2>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Review your latest score and previous mock interview attempts.
                </p>
              </div>

              {mockInterviewError ? (
                <Card>
                  <p className="text-sm text-[var(--muted)]">{mockInterviewError}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    You can still continue your preparation while results load.
                  </p>
                </Card>
              ) : (
                <Card>
                  {(() => {
                    const attempts = Array.isArray(mockInterviewData?.interviews)
                      ? mockInterviewData.interviews
                      : mockInterviewData?.interview
                        ? [mockInterviewData.interview]
                        : [];
                    const submittedAttempts = attempts.filter(
                      (attempt) => attempt.status === "completed"
                    );
                    const latest = submittedAttempts[0] || attempts[0] || null;
                    const latestScore = latest?.report?.averageScore;

                    return (
                      <>
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-[var(--muted)]">Latest mock interview</p>
                            <p className="mt-1 text-3xl font-bold">
                              {latestScore == null ? "—" : `${latestScore}%`}
                            </p>
                            <p className="mt-1 text-sm text-[var(--muted)]">
                              {!latest
                                ? "You have not attempted a mock interview yet."
                                : latest.evaluationStatus === "pending" ||
                                    latest.evaluationStatus === "processing"
                                  ? "Your answers are being evaluated."
                                  : latest.evaluationStatus === "failed"
                                    ? "Evaluation failed. You can review the attempt and try again."
                                    : latestScore == null
                                      ? "No score is available for this attempt yet."
                                      : `${latest.report?.answeredQuestions ?? 0} of ${latest.report?.totalQuestions ?? latest.questions?.length ?? 0} questions answered`}
                            </p>
                          </div>
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                            <Trophy size={22} />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3">
                          <Link to="/preparation">
                            <Button>
                              {latest ? "Open Preparation" : "Start Mock Interview"}
                              <ArrowRight size={16} className="ml-2" />
                            </Button>
                          </Link>
                          {latest && (
                            <Link
                              to={`/mock-interview/${preparation._id}`}
                              className="inline-flex items-center rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-secondary)]"
                            >
                              View mock interview
                            </Link>
                          )}
                        </div>

                        {submittedAttempts.length > 1 && (
                          <div className="mt-6">
                            <h3 className="font-semibold">Previous attempts</h3>
                            <div className="mt-3 divide-y divide-[var(--border)]">
                              {submittedAttempts.slice(1, 6).map((attempt, index) => (
                                <div
                                  key={attempt._id || index}
                                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                                >
                                  <div>
                                    <p className="text-sm font-medium">
                                      Attempt {submittedAttempts.length - index - 1}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--muted)]">
                                      {attempt.completedAt
                                        ? new Date(attempt.completedAt).toLocaleString()
                                        : "Submission date unavailable"}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-600">
                                    {attempt.report?.averageScore == null
                                      ? attempt.evaluationStatus === "failed"
                                        ? "Evaluation failed"
                                        : "Pending"
                                      : `${attempt.report.averageScore}%`}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {latest && latest.evaluationStatus === "completed" && latestScore != null && (
                          <p className="mt-4 text-sm text-[var(--muted)]">
                            {latest.report?.summary || "Your mock interview evaluation is complete."}
                          </p>
                        )}
                      </>
                    );
                  })()}
                </Card>
              )}
            </section>

            {/* Today's preparation */}
            <section>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>

                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold">
                      Today's Preparation
                    </h2>

                    {todayPlanDay && (
                      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-xs font-semibold text-[var(--primary)]">
                        TODAY · DAY {todayPlanDay.day}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {todayPlanDay
                      ? `Day ${todayPlanDay.day}: ${todayPlanDay.title}`
                      : "Review your next preparation tasks."}
                  </p>
                </div>

                <Link
                  to="/preparation"
                  className="text-sm font-medium text-[var(--primary)] hover:underline"
                >
                  View full plan
                </Link>
              </div>

              <Card className="p-0">
                {!plan ? (
                  <div className="px-6 py-8 text-center">
                    <Brain
                      size={32}
                      className="mx-auto text-[var(--primary)]"
                    />
                    <h3 className="mt-3 font-semibold">
                      Your AI plan is not ready yet
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Generate your personalized plan to see your daily
                      tasks here.
                    </p>
                    <Link
                      to="/preparation"
                      className="mt-4 inline-block"
                    >
                      <Button>
                        View Preparation
                        <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                  </div>
                ) : displayedTasks.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <CalendarDays
                      size={30}
                      className="mx-auto text-[var(--primary)]"
                    />
                    <h3 className="mt-3 font-semibold">
                      No tasks for this day
                    </h3>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      Open your full plan to review all scheduled tasks.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {displayedTasks.map((task) => (

                      <div
                        key={task._id || task.title}
                        className={`flex items-start gap-4 border-l-4 px-6 py-5 transition-colors ${task.isCompleted
                          ? "border-emerald-500 bg-emerald-500/5"
                          : "border-[var(--primary)] bg-[var(--primary)]/5"
                          }`}
                      >

                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${task.isCompleted
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-[var(--primary)]/10 text-[var(--primary)]"
                            }`}
                        >
                          <CheckCircle2 size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3
                            className={`font-medium ${task.isCompleted
                              ? "line-through opacity-60"
                              : ""
                              }`}
                          >
                            {task.title}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--muted)]">
                            {task.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[var(--muted)]">
                            <span>{task.durationMinutes} min</span>
                            <span>·</span>
                            <span>{task.type}</span>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${task.isCompleted
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-[var(--primary)]/10 text-[var(--primary)]"
                            }`}
                        >
                          {task.isCompleted ? "Completed" : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </section>
          </>
        )}

        {/* Quick actions */}
        <section>
          <h2 className="mb-4 text-xl font-bold">Quick Actions</h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <QuickAction
              icon={Brain}
              title="Practice Questions"
              description="Review your personalized interview preparation tasks."
              to="/preparation"
            />

            <QuickAction
              icon={MessageSquare}
              title="Mock Interview"
              description="Open your preparation roadmap and practice interview topics."
              to="/preparation"
            />

            <QuickAction
              icon={FileText}
              title="Analyze Resume"
              description="Start a preparation using your latest resume."
              to="/start-prep"
            />
          </div>
        </section>

        {/* Start preparation CTA */}
        <section>
          <Card className="overflow-hidden bg-[var(--primary)] text-white">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-white/70">
                  Want to prepare for another role?
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Create another preparation plan.
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-white/75">
                  Choose a target role, upload your resume, and create a
                  personalized interview preparation roadmap.
                </p>
              </div>

              <Link to="/start-prep">
                <Button
                  variant="secondary"
                  size="lg"
                  className="shrink-0 border-0 bg-white text-slate-900 hover:bg-slate-100"
                >
                  Start Preparation
                  <ArrowRight size={17} className="ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
};

const QuickAction = ({ icon: Icon, title, description, to }) => (
  <Link to={to}>
    <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        <Icon size={20} />
      </div>

      <h3 className="mt-5 font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[var(--primary)]">
        Open
        <ArrowRight size={15} />
      </div>
    </Card>
  </Link>
);

export default Home;

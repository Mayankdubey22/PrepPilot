
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileText,
  History,
  LoaderCircle,
  RefreshCw,
  Target,
} from "lucide-react";
import { Link } from "react-router";

import AppLayout from "../../layouts/AppLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { useAuth } from "../../context/AuthContext";
import { getMyPreparations } from "../../services/preparation.service";

const PreparationHistory = () => {
  const { token } = useAuth();

  const [preparations, setPreparations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPreparations = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await getMyPreparations(token);

      if (!result.success) {
        setError(
          result.data?.message || "Unable to load preparation history."
        );
        return;
      }

      setPreparations(result.data?.preparations || []);
    } catch {
      setError("Something went wrong while loading preparation history.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadPreparations();
  }, [loadPreparations]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/home"
              className="mb-3 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--primary)]"
            >
              <ArrowLeft size={16} />
              Back to dashboard
            </Link>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <History size={23} />
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  Preparation History
                </h1>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Review your interview preparation journeys.
                </p>
              </div>
            </div>
          </div>

          <Button
            variant="secondary"
            onClick={loadPreparations}
            disabled={isLoading}
          >
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
        </div>

        {!isLoading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total preparations"
              value={preparations.length}
              icon={<FileText size={20} />}
            />

            <SummaryCard
              label="Active preparations"
              value={
                preparations.filter((item) => item.status === "ACTIVE")
                  .length
              }
              icon={<Target size={20} />}
            />

            <SummaryCard
              label="Completed preparations"
              value={
                preparations.filter((item) => item.status === "COMPLETED")
                  .length
              }
              icon={<History size={20} />}
            />
          </div>
        )}

        {isLoading ? (
          <Card>
            <div className="flex items-center gap-3">
              <LoaderCircle
                size={20}
                className="animate-spin text-[var(--primary)]"
              />
              <p className="text-[var(--muted)]">
                Loading your preparation history...
              </p>
            </div>
          </Card>
        ) : error ? (
          <Card>
            <p className="text-[var(--danger)]">{error}</p>
            <Button className="mt-4" onClick={loadPreparations}>
              Try again
            </Button>
          </Card>
        ) : preparations.length === 0 ? (
          <Card>
            <div className="py-10 text-center">
              <History
                size={40}
                className="mx-auto text-[var(--muted)]"
              />

              <h2 className="mt-4 text-xl font-semibold">
                No preparation history yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
                Create your first preparation plan to start tracking your
                interview journey.
              </p>

              <Link to="/start-prep" className="mt-5 inline-block">
                <Button>
                  Start Preparation
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {preparations.map((preparation) => (
              <PreparationCard
                key={preparation._id}
                preparation={preparation}
              />
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Link to="/start-prep">
            <Button>
              Create New Preparation
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
};

const PreparationCard = ({ preparation }) => {
  const progress = Math.min(
    100,
    Math.max(0, preparation.progress ?? 0)
  );

  const statusStyles = {
    ACTIVE:
      "bg-emerald-500/10 text-emerald-500",
    COMPLETED:
      "bg-blue-500/10 text-blue-500",
    PAUSED:
      "bg-amber-500/10 text-amber-500",
  };

  const createdDate = preparation.createdAt
    ? new Date(preparation.createdAt).toLocaleDateString()
    : "Date unavailable";

  return (
    <Card className="h-full">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <BriefcaseBusiness size={21} />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold">
              {preparation.targetRole}
            </h2>

            <p className="mt-1 break-words text-sm text-[var(--muted)]">
              {preparation.targetCompany || "No target company specified"}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            statusStyles[preparation.status] ||
            "bg-[var(--surface-secondary)] text-[var(--muted)]"
          }`}
        >
          {preparation.status || "ACTIVE"}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <InfoItem
          icon={<CalendarDays size={17} />}
          label="Duration"
          value={preparation.duration}
        />

        <InfoItem
          icon={<Clock3 size={17} />}
          label="Daily study"
          value={preparation.dailyTime}
        />

        <InfoItem
          icon={<Target size={17} />}
          label="Difficulty"
          value={preparation.difficulty}
        />

        <InfoItem
          icon={<FileText size={17} />}
          label="Created"
          value={createdDate}
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-[var(--muted)]">
            Preparation progress
          </span>
          <span className="font-semibold">{progress}%</span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Link
        to={`/preparation/${preparation._id}`}
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[var(--primary)] hover:underline"
      >
        Open preparation
        <ArrowRight size={16} />
      </Link>
    </Card>
  );
};

const SummaryCard = ({ label, value, icon }) => (
  <Card>
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-[var(--muted)]">{label}</p>
        <p className="mt-2 text-2xl font-bold">{value}</p>
      </div>

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
        {icon}
      </div>
    </div>
  </Card>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="rounded-xl bg-[var(--surface-secondary)] p-3">
    <div className="flex items-center gap-2 text-[var(--muted)]">
      {icon}
      <span className="text-xs">{label}</span>
    </div>
    <p className="mt-2 break-words text-sm font-semibold">
      {value || "Not specified"}
    </p>
  </div>
);

export default PreparationHistory;

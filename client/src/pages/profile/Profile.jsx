import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import AppLayout from "../../layouts/AppLayout";
import {
  UserRound,
  Mail,
  BriefcaseBusiness,
  Pencil,
  X,
  CalendarDays,
  Save,
  LoaderCircle,
  CircleUserRound,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  BookOpen,
  Trophy,
  Target,
  Clock3,
  ChevronRight,
} from "lucide-react";

const API_URL = "http://localhost:5000/api/profile";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    targetRole: "",
    profileImage: "",
    createdAt: "",
  });

  const [stats, setStats] = useState({
    totalPreparations: 0,
    completedPreparations: 0,
    completedMockInterviews: 0,
    totalTasks: 0,
    completedTasks: 0,
    taskCompletionPercentage: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [preparations, setPreparations] = useState([]);
  const [preparationsLoading, setPreparationsLoading] = useState(true);
  const [preparationsError, setPreparationsError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [originalProfile, setOriginalProfile] = useState(null);
  // Image selection currently provides a local preview; persistent upload needs a backend endpoint.
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const imageStorageKey = (email) => `preppilot-profile-image-${(email || "user").toLowerCase()}`;

  const currentPreparation = preparations.find(
    (preparation) => preparation.status === "ACTIVE"
  );

  const currentTargetRole =
    currentPreparation?.targetRole || "No active preparation";

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token =
          localStorage.getItem("prepPilot-token") ||
          localStorage.getItem("token");

        if (!token) {
          setError("Please sign in to view your profile.");
          return;
        }

        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to load profile.");
        }

        const savedLocalImage = localStorage.getItem(
          imageStorageKey(data.user.email)
        );

        setProfile({
          name: data.user.name || "",
          email: data.user.email || "",
          targetRole: data.user.targetRole || "",
          profileImage: savedLocalImage || data.user.profileImage || "",
          createdAt: data.user.createdAt || "",
        });
      } catch (err) {
        setError(err.message || "Unable to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token =
          localStorage.getItem("prepPilot-token") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(
          "http://localhost:5000/api/profile/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load statistics."
          );
        }

        setStats(data.stats);
      } catch (error) {
        setStatsError(error.message || "Failed to load statistics.");
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);


  useEffect(() => {
    const fetchPreparations = async () => {
      try {
        const token =
          localStorage.getItem("prepPilot-token") ||
          localStorage.getItem("token");

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const response = await fetch(
          "http://localhost:5000/api/profile/preparations",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load preparation history."
          );
        }

        setPreparations(data.preparations || []);
      } catch (error) {
        setPreparationsError(
          error.message || "Failed to load preparation history."
        );
      } finally {
        setPreparationsLoading(false);
      }
    };

    fetchPreparations();
  }, []);


  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  const handleStartEdit = () => {
    setOriginalProfile({ ...profile });
    setIsEditing(true);
    setMessage("");
    setError("");
  };

  const handleCancelEdit = () => {
    if (originalProfile) {
      setProfile(originalProfile);
    }

    setIsEditing(false);
    setOriginalProfile(null);
    setMessage("");
    setError("");
    setImagePreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const token =
        localStorage.getItem("prepPilot-token") ||
        localStorage.getItem("token");

      if (!token) {
        throw new Error("Please sign in again.");
      }

      const response = await fetch(API_URL, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: profile.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to save profile.");
      }

      setProfile((previous) => ({
        ...previous,
        name: data.user.name || "",
        email: data.user.email || "",
        targetRole: data.user.targetRole || "",
        profileImage: data.user.profileImage || "",
        createdAt: data.user.createdAt || "",
      }));

      setMessage("Profile updated successfully.");
      setIsEditing(false);
      setOriginalProfile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  const initials = profile.name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (loading) {
    return (
      <AppLayout>
        <div className="flex min-h-[50vh] items-center justify-center text-white">
          <LoaderCircle className="mr-3 animate-spin" size={24} />
          Loading profile...
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 text-white">
        <div className="flex flex-col gap-2 border-b border-white/[0.08] pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">PrepPilot workspace</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Your progress</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Track your interview preparation and manage your account from one place.</p>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-xs font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Your workspace
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,2.2fr)_minmax(290px,1fr)] xl:gap-0">
          <div className="min-w-0 space-y-10 xl:pr-8">
        <section className="min-w-0">
          <div className="mb-5">
            <h2 className="text-xl font-semibold">
              Your Preparation Statistics
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              A snapshot of your interview preparation journey.
            </p>
          </div>

          {statsError && (
            <p className="mb-4 text-sm text-red-400" role="alert">
              {statsError}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Preparations",
                value: stats.totalPreparations,
                icon: BookOpen,
              },
              {
                label: "Completed Plans",
                value: stats.completedPreparations,
                icon: Trophy,
              },
              {
                label: "Mock Interviews",
                value: stats.completedMockInterviews,
                icon: Target,
              },
              {
                label: "Task Completion",
                value: `${stats.taskCompletionPercentage}%`,
                icon: BarChart3,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/[0.08] bg-[#12131e] p-5 transition hover:-translate-y-0.5 hover:border-violet-400/25"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                    <Icon size={20} />
                  </div>

                  <p className="text-sm text-gray-400">
                    {item.label}
                  </p>

                  <p className="mt-2 text-2xl font-bold">
                    {statsLoading ? "..." : item.value}
                  </p>
                </div>
              );
            })}
          </div>

          {!statsLoading && !statsError && (
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="mb-3 flex items-center justify-between gap-4">
                <span className="text-sm text-gray-300">
                  Completed tasks
                </span>
                <span className="text-sm font-semibold text-violet-300">
                  {stats.completedTasks} / {stats.totalTasks}
                </span>
              </div>

              <div
                className="h-2.5 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-label="Task completion"
                aria-valuenow={stats.taskCompletionPercentage}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-violet-500 transition-all duration-500"
                  style={{
                    width: `${stats.taskCompletionPercentage}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="min-w-0">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">
                Recent Preparations
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Continue working toward your career goals.
              </p>
            </div>

            <Link
              to="/preparation-history"
              className="inline-flex shrink-0 items-center gap-1 text-sm text-violet-400 hover:text-violet-300"
            >
              View all
              <ChevronRight size={16} />
            </Link>
          </div>

          {preparationsError && (
            <p role="alert" className="text-sm text-red-400">
              {preparationsError}
            </p>
          )}

          {preparationsLoading ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-gray-400">
              <LoaderCircle className="mr-2 inline animate-spin" size={18} />
              Loading preparations...
            </div>
          ) : !preparationsError && preparations.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
              <BriefcaseBusiness
                size={32}
                className="mx-auto mb-3 text-violet-400"
              />
              <h3 className="font-semibold">No preparations yet</h3>
              <p className="mt-2 text-sm text-gray-400">
                Start your first preparation plan to see it here.
              </p>
              <Link
                to="/start-prep"
                className="mt-5 inline-flex rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-medium hover:bg-violet-500"
              >
                Start preparing
              </Link>
            </div>
          ) : !preparationsError ? (
            <div className="space-y-4">
              {preparations.map((preparation) => (
                <Link
                  key={preparation._id}
                  to={`/preparation/${preparation._id}`}
                  className="block rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-500/40 hover:bg-white/[0.05]"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div>
                      <h3 className="font-semibold">
                        {preparation.targetRole}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">
                        {preparation.targetCompany || "Company not specified"}
                        {" · "}
                        {preparation.duration}
                      </p>

                      <p className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                        <Clock3 size={14} />
                        Started{" "}
                        {preparation.startDate
                          ? new Date(preparation.startDate).toLocaleDateString("en-IN")
                          : "Date unavailable"}
                      </p>
                    </div>

                    <span className="w-fit rounded-full border border-white/10 px-3 py-1 text-xs text-gray-300">
                      {preparation.status}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-400">Progress</span>
                      <span className="font-medium text-violet-300">
                        {preparation.progress ?? 0}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-500 transition-all"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(0, preparation.progress ?? 0)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </section>
          </div>

          <aside className="min-w-0 space-y-5 border-t border-white/[0.10] pt-8 xl:border-l xl:border-t-0 xl:pl-8 xl:pt-0">
          <div className="h-fit rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#151522] to-[#10111a] p-7 shadow-2xl shadow-black/20">
            <div className="flex flex-col items-center text-center">

              <div className="relative mb-5 h-28 w-28">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-violet-400/50 bg-violet-500/15 text-2xl font-bold text-violet-200 ring-4 ring-violet-500/10">
                  {imagePreview || profile.profileImage ? (
                    <img
                      src={imagePreview || profile.profileImage}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : initials ? (
                    initials
                  ) : (
                    <CircleUserRound size={42} />
                  )}
                </div>

                <button
                  type="button"
                  title="Change profile picture"
                  aria-label="Change profile picture"
                  onClick={() => {
                    setMessage("");
                    setError("");
                    fileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#10111a] bg-violet-600 text-white shadow-lg shadow-violet-950/40 transition hover:scale-105 hover:bg-violet-500"
                >
                  <Pencil size={14} />
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (!file.type.startsWith("image/")) {
                      setError("Please select an image file.");
                      event.target.value = "";
                      return;
                    }

                    if (file.size > 5 * 1024 * 1024) {
                      setError("Image size must be 5 MB or less.");
                      event.target.value = "";
                      return;
                    }

                    // Store a resized image in browser storage so it survives refreshes.
                    const reader = new FileReader();
                    reader.onload = () => {
                      const image = new Image();
                      image.onload = () => {
                        const canvas = document.createElement("canvas");
                        const maxDimension = 512;
                        const scale = Math.min(
                          1,
                          maxDimension / Math.max(image.width, image.height)
                        );
                        canvas.width = Math.max(1, Math.round(image.width * scale));
                        canvas.height = Math.max(1, Math.round(image.height * scale));
                        const context = canvas.getContext("2d");
                        context.drawImage(image, 0, 0, canvas.width, canvas.height);
                        const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
                        try {
                          localStorage.setItem(imageStorageKey(profile.email), dataUrl);
                          setProfile((previous) => ({ ...previous, profileImage: dataUrl }));
                          setImagePreview(dataUrl);
                          setError("");
                          setMessage("Profile picture updated and saved in this browser.");
                        } catch {
                          setError("This image could not be saved in browser storage. Please choose a smaller image.");
                        }
                      };
                      image.onerror = () => setError("Unable to read this image. Please choose another one.");
                      image.src = reader.result;
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </div>


              <h2 className="break-words text-xl font-semibold">
                {profile.name || "Your Name"}
              </h2>

              <p className="mt-1 break-all text-sm text-gray-400">
                {profile.email}
              </p>

              <div className="mt-6 w-full rounded-2xl border border-white/[0.08] bg-black/20 p-4 text-left">
                <p className="mb-2 text-xs uppercase tracking-wider text-gray-500">
                  Target role
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-200">
                  <BriefcaseBusiness
                    size={17}
                    className="shrink-0 text-violet-400"
                  />
                  <span className="break-words">
                    {currentTargetRole}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex w-full items-center gap-3 text-left text-sm text-gray-400">
                <CalendarDays size={18} className="shrink-0" />
                <span>
                  Joined{" "}
                  {profile.createdAt
                    ? new Date(profile.createdAt).toLocaleDateString(
                      "en-IN",
                      {
                        month: "short",
                        year: "numeric",
                      }
                    )
                    : "date unavailable"}
                </span>
              </div>
            </div>
          </div>

          
<section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-gradient-to-br from-[#171725] via-[#12131f] to-[#0e1019] shadow-xl shadow-black/20">
  {/* Card header */}
  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-violet-300">
        <UserRound size={21} />
      </div>

      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-white">
          Personal information
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-400">
          Manage your account details
        </p>
      </div>
    </div>

    <button
      type="button"
      onClick={isEditing ? handleCancelEdit : handleStartEdit}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        isEditing
          ? "border-white/10 text-gray-300 hover:bg-white/[0.06]"
          : "border-violet-400/25 bg-violet-500/10 text-violet-200 hover:border-violet-400/50 hover:bg-violet-500/20"
      }`}
    >
      {isEditing ? <X size={16} /> : <Pencil size={16} />}
      {isEditing ? "Cancel" : "Edit"}
    </button>
  </div>

  <div className="p-5 sm:p-6">
    {message && (
      <div
        role="status"
        className="mb-5 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] p-3 text-sm text-emerald-300"
      >
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
        <span>{message}</span>
      </div>
    )}

    {error && (
      <div
        role="alert"
        className="mb-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.08] p-3 text-sm text-red-300"
      >
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
        <span>{error}</span>
      </div>
    )}

    {isEditing ? (
      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Full name
          </label>

          <div className="relative">
            <UserRound
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-violet-300"
            />
            <input
              id="name"
              name="name"
              type="text"
              value={profile.name}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
              className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/10"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-medium text-gray-300"
          >
            Email address
          </label>

          <div className="relative">
            <Mail
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              id="email"
              type="email"
              value={profile.email}
              readOnly
              className="w-full cursor-not-allowed rounded-xl border border-white/[0.07] bg-white/[0.03] py-3 pl-10 pr-3 text-sm text-gray-400 outline-none"
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Email cannot be changed here.
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-white/[0.08] pt-5">
          <button
            type="button"
            onClick={handleCancelEdit}
            className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-gray-300 transition hover:bg-white/[0.05]"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-950/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    ) : (
      <div className="space-y-1">
        <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
            <UserRound size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Full name
            </p>
            <p className="mt-1 break-words text-sm font-medium text-gray-100">
              {profile.name || "Not provided"}
            </p>
          </div>
        </div>

        <div className="mx-3 border-t border-white/[0.06]" />

        <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
            <Mail size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Email address
            </p>
            <p className="mt-1 break-all text-sm text-gray-200">
              {profile.email || "Not provided"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Your registered email
            </p>
          </div>
        </div>

        <div className="mx-3 border-t border-white/[0.06]" />

        <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <BriefcaseBusiness size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Current target role
            </p>
            <p className="mt-1 break-words text-sm font-medium text-gray-100">
              {currentTargetRole}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Based on your active preparation
            </p>
          </div>
        </div>

        <div className="mx-3 border-t border-white/[0.06]" />

        <div className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-white/[0.025]">
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-gray-400">
            <CalendarDays size={17} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Member since
            </p>
            <p className="mt-1 text-sm text-gray-200">
              {profile.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Date unavailable"}
            </p>
          </div>
        </div>
      </div>
    )}
  </div>
</section>

          </aside>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;

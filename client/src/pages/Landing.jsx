import {
  ArrowRight,
  BrainCircuit,
  FileText,
  MessageSquareText,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/common/ThemeToggle";

const features = [
  {
    icon: FileText,
    title: "Resume Analysis",
    description:
      "Let AI analyze your resume, identify your skills, and find areas that need improvement.",
  },
  {
    icon: BrainCircuit,
    title: "Personalized Preparation",
    description:
      "Get a preparation plan designed around your target role, experience, and weaknesses.",
  },
  {
    icon: MessageSquareText,
    title: "AI Mock Interviews",
    description:
      "Practice realistic technical and behavioral interviews with instant AI feedback.",
  },
];

const stats = [
  {
    icon: Target,
    value: "Personalized",
    label: "Preparation",
  },
  {
    icon: TrendingUp,
    value: "AI Powered",
    label: "Progress Tracking",
  },
  {
    icon: Sparkles,
    value: "Smart",
    label: "Interview Feedback",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Navigation */}
      <header className="border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20">
              <Sparkles size={20} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight">
                PrepPilot
              </h1>

              <p className="text-xs text-[var(--muted)]">
                AI Interview Preparation
              </p>
            </div>
          </Link>

          {/* Navigation Actions */}
          <div className="flex items-center gap-4">
            <Link
              to="/signin"
              className="hidden text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:block"
            >
              Sign In
            </Link>

            <ThemeToggle />

            <Link to="/signup">
              <Button>
                Get Started
                <ArrowRight size={17} />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="pointer-events-none absolute left-1/2 top-0 -z-0 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--primary)]/10 blur-3xl" />

          <div className="relative mx-auto grid max-w-7xl grid-cols-2 items-center gap-16 px-8 py-24">
            {/* Left */}
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium shadow-sm">
                <Sparkles
                  size={16}
                  className="text-[var(--primary)]"
                />

                <span>
                  AI-powered interview preparation
                </span>
              </div>

              <h2 className="max-w-3xl text-6xl font-bold leading-[1.08] tracking-tight">
                Prepare smarter.
                <span className="block text-[var(--primary)]">
                  Get hired faster.
                </span>
              </h2>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
                PrepPilot analyzes your resume, understands your target
                role, creates a personalized preparation plan, and
                helps you practice with AI-powered mock interviews.
              </p>

              <div className="mt-9 flex items-center gap-4">
                <Link to="/signup">
                  <Button size="lg">
                    Start Preparing
                    <ArrowRight size={18} />
                  </Button>
                </Link>

                <Link to="/signin">
                  <Button
                    variant="secondary"
                    size="lg"
                  >
                    I already have an account
                  </Button>
                </Link>
              </div>

              {/* Trust line */}
              <div className="mt-8 flex items-center gap-3 text-sm text-[var(--muted)]">
                <div className="flex -space-x-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--background)] bg-purple-200 text-xs font-bold text-purple-700">
                    M
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--background)] bg-blue-200 text-xs font-bold text-blue-700">
                    A
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--background)] bg-teal-200 text-xs font-bold text-teal-700">
                    R
                  </div>
                </div>

                <span>
                  Build confidence before your next interview.
                </span>
              </div>
            </div>

            {/* Right - Dashboard Preview */}
            <div className="relative">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl shadow-black/10">
                {/* Fake dashboard header */}
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-[var(--muted)]">
                      Your preparation
                    </p>

                    <h3 className="mt-1 font-semibold">
                      Welcome back 👋
                    </h3>
                  </div>

                  <div className="h-9 w-9 rounded-full bg-[var(--primary)]/10" />
                </div>

                {/* Main preparation card */}
                <div className="rounded-xl bg-[var(--primary)] p-5 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-white/70">
                        Current Preparation
                      </p>

                      <h3 className="mt-2 text-xl font-semibold">
                        MERN Stack Developer
                      </h3>

                      <p className="mt-1 text-sm text-white/70">
                        Intermediate level
                      </p>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white/20">
                      <span className="text-sm font-bold">
                        78%
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">
                    <div className="h-full w-[78%] rounded-full bg-white" />
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div
                        key={stat.label}
                        className="rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] p-4"
                      >
                        <Icon
                          size={18}
                          className="text-[var(--primary)]"
                        />

                        <p className="mt-3 text-sm font-semibold">
                          {stat.value}
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Today's goal */}
                <div className="mt-4 rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">
                        Today's Goal
                      </p>

                      <p className="mt-1 text-xs text-[var(--muted)]">
                        React Hooks
                      </p>
                    </div>

                    <span className="text-sm font-semibold text-[var(--primary)]">
                      3/5
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                    <div className="h-full w-[60%] rounded-full bg-[var(--accent)]" />
                  </div>
                </div>
              </div>

              {/* Floating AI card */}
              <div className="absolute -bottom-7 -left-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                    <BrainCircuit size={20} />
                  </div>

                  <div>
                    <p className="text-xs text-[var(--muted)]">
                      AI feedback
                    </p>

                    <p className="text-sm font-semibold">
                      Great progress! 🎯
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-[var(--border)] bg-[var(--surface)]">
          <div className="mx-auto max-w-7xl px-8 py-20">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-widest text-[var(--primary)]">
                Everything you need
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                One platform for your entire interview preparation.
              </h2>

              <p className="mt-4 text-[var(--muted)]">
                From understanding your resume to practicing real
                interview questions, PrepPilot keeps your preparation
                focused and personalized.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
                      <Icon size={23} />
                    </div>

                    <h3 className="mt-5 text-lg font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                      {feature.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[var(--primary)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-16">
            <div className="text-white">
              <h2 className="text-3xl font-bold">
                Ready to start preparing?
              </h2>

              <p className="mt-2 text-white/70">
                Build your personalized interview preparation plan.
              </p>
            </div>

            <Link to="/signup">
              <Button
                size="lg"
                className="bg-white text-[var(--primary)] hover:bg-white/90"
              >
                Get Started
                <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--background)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">
          <p className="text-sm text-[var(--muted)]">
            © 2026 PrepPilot. All rights reserved.
          </p>

          <p className="text-sm text-[var(--muted)]">
            AI-powered interview preparation.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
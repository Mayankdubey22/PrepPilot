import { Sparkles } from "lucide-react";
import { Link } from "react-router";
import ThemeToggle from "../components/common/ThemeToggle";

const AuthLayout = ({ children, quote }) => {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      <div className="grid min-h-screen grid-cols-2">
        {/* Left Branding Section */}
        <section className="relative hidden overflow-hidden bg-slate-950 lg:flex">
          {/* Background decoration */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

          <div className="relative flex w-full flex-col justify-between p-12">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Sparkles size={20} />
              </div>

              <div>
                <p className="font-bold text-white">
                  PrepPilot
                </p>

                <p className="text-xs text-slate-400">
                  AI Interview Preparation
                </p>
              </div>
            </Link>

            {/* Illustration area */}
            <div className="relative flex flex-1 items-center justify-center">
              <div className="absolute h-72 w-72 rounded-full bg-violet-600/10 blur-2xl" />

              <div className="relative max-w-md text-center">
                <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl border border-violet-400/20 bg-violet-500/10 text-violet-300 shadow-2xl shadow-violet-950/40">
                  <Sparkles size={52} />
                </div>

                <h2 className="text-4xl font-bold leading-tight text-white">
                  Prepare smarter.
                  <span className="block text-violet-400">
                    Get hired faster.
                  </span>
                </h2>

                <p className="mt-5 text-base leading-7 text-slate-400">
                  Personalized interview preparation powered by AI.
                  Understand your strengths, improve your weaknesses,
                  and walk into your next interview with confidence.
                </p>
              </div>
            </div>

            {/* Quote */}
            <div className="border-l-2 border-violet-500 pl-5">
              <p className="text-sm italic leading-6 text-slate-300">
                "{quote}"
              </p>
            </div>
          </div>
        </section>

        {/* Right Content */}
        <section className="relative flex min-h-screen flex-col">
          <div className="absolute right-8 top-7">
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center justify-center px-8 py-16">
            <div className="w-full max-w-md">
              {children}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuthLayout;
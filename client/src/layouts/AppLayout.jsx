import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import {
  BarChart3,
  BookOpen,
  History,
  LayoutDashboard,
  LogOut,
  Rocket,
  User,
} from "lucide-react";

import ThemeToggle from "../components/common/ThemeToggle";
import { useAuth } from "../context/AuthContext";

const navigation = [
  {
    label: "Home",
    path: "/home",
    icon: LayoutDashboard,
  },
  {
    label: "Preparation",
    path: "/preparation",
    icon: BookOpen,
  },
  {
    label: "Start Prep",
    path: "/start-prep",
    icon: Rocket,
  },
  {
    label: "History",
    path: "/preparation-history",
    icon: History,
  },
  {
    label: "Profile",
    path: "/profile",
    icon: User,
  },
];

const AppLayout = ({ children }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-8">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Rocket size={18} />
            </div>

            <div>
              <p className="font-bold leading-none">PrepPilot</p>
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                AI Interview Preparation
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium
                    transition-all
                    ${isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                    }
                    `
                  }
                >
                  <Icon size={16} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <div className="h-7 w-px bg-[var(--border)]" />

            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <span className="max-w-32 truncate text-sm font-medium">
                {user?.name || "User"}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-secondary)] hover:text-[var(--danger)]"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-8 py-8">
        {children}
      </main>
      
{showLogoutConfirm && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
    onClick={() => setShowLogoutConfirm(false)}
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
      className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
          <LogOut size={22} />
        </div>

        <div>
          <h2
            id="logout-dialog-title"
            className="text-lg font-bold"
          >
            Confirm logout
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            Are you sure you want to log out of PrepPilot?
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(false)}
          className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium hover:bg-[var(--surface-secondary)]"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={confirmLogout}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          Logout
        </button>
      </div>
    </div>
  </div>
)}
</div>
  );
};

export default AppLayout;

import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../context/useTheme";

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-lg
        border
        border-[var(--border)]
        bg-[var(--surface)]
        text-[var(--foreground)]
        transition-all
        duration-200
        hover:bg-[var(--surface-secondary)]
      "
    >
      {theme === "light" ? (
        <Moon size={18} />
      ) : (
        <Sun size={18} />
      )}
    </button>
  );
};

export default ThemeToggle;

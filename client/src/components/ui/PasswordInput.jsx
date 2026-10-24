import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const PasswordInput = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="w-full">
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <div className="relative">
        <input
          id={name}
          name={name}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full
            rounded-lg
            border
            bg-[var(--surface)]
            px-4
            py-3
            pr-12
            text-sm
            text-[var(--foreground)]
            outline-none
            transition-all
            placeholder:text-[var(--muted)]
            disabled:cursor-not-allowed
            disabled:opacity-60
            ${
              error
                ? "border-red-500"
                : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
            }
          `}
        />

        <button
          type="button"
          onClick={() => setShowPassword((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] transition-colors hover:text-[var(--foreground)]"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default PasswordInput;
const Input = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
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

      <input
        id={name}
        name={name}
        type={type}
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
          text-sm
          text-[var(--foreground)]
          outline-none
          transition-all
          placeholder:text-[var(--muted)]
          disabled:cursor-not-allowed
          disabled:opacity-60
          ${
            error
              ? "border-red-500 focus:border-red-500"
              : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
          }
        `}
      />

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;
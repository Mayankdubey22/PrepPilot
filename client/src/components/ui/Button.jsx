const variants = {
  primary:
    "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)]",

  secondary:
    "bg-[var(--surface-secondary)] text-[var(--foreground)] border border-[var(--border)] hover:opacity-80",

  ghost:
    "text-[var(--foreground)] hover:bg-[var(--surface-secondary)]",

  danger:
    "bg-[var(--danger)] text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-2 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3 text-base",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  className = "",
  disabled = false,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        font-medium
        transition-all
        duration-200
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--primary)]
        focus:ring-offset-2
        focus:ring-offset-[var(--background)]
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
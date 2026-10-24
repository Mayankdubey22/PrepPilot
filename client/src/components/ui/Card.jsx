const Card = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-6
        shadow-sm
        transition-colors
        duration-200
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
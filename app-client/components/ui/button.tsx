import type { ButtonVariant, ButtonProps } from "@/types";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white shadow-sm hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50",
  secondary:
    "border border-border text-foreground shadow-sm hover:bg-surface active:scale-[0.98]",
  danger:
    "border border-error/20 text-error shadow-sm hover:bg-error/5 active:scale-[0.98]",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
};

export function Button({
  variant = "primary",
  size = "md",
  disabled,
  children,
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </button>
  );
}

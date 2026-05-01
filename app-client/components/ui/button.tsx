import type { ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50",
  secondary: "border border-gray-300 text-gray-700 hover:bg-gray-50",
  danger: "border border-red-200 text-red-600 hover:bg-red-50",
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

import type { ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: "sm" | "md";
  disabled?: boolean;
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export type StatusBadgeProps = {
  status: string;
};

export type NoticeProps = {
  message: string;
  variant?: "success" | "error" | "info";
};

export type ModalProps = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer: ReactNode;
};

export type NavItem = {
  label: string;
  href: string;
};

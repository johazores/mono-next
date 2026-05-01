type NoticeProps = {
  message: string;
  variant?: "success" | "error";
};

export function Notice({ message, variant = "success" }: NoticeProps) {
  const styles =
    variant === "error"
      ? "bg-red-50 text-red-700"
      : "bg-green-50 text-green-700";

  return (
    <div className={`rounded-lg px-4 py-3 text-sm ${styles}`} role="alert">
      {message}
    </div>
  );
}

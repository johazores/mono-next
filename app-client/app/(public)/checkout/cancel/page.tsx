import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-foreground">Payment Cancelled</h1>
        <p className="mt-2 text-sm text-muted">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/cart"
            className="block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Return to Cart
          </Link>
          <Link
            href="/"
            className="block rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}

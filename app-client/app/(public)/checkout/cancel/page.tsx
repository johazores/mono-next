import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900">Payment Cancelled</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your payment was cancelled. No charges were made.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link
            href="/cart"
            className="block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Return to Cart
          </Link>
          <Link
            href="/"
            className="block rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Products
          </Link>
        </div>
      </div>
    </div>
  );
}

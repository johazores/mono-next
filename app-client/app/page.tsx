import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            mono-next
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Full-stack monorepo with admin panel, user dashboard, and API.
          </p>
        </div>

        <div className="grid gap-3">
          <Link
            href="/admin"
            className="block rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            Admin Panel
          </Link>
          <Link
            href="/dashboard"
            className="block rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-800"
          >
            User Dashboard
          </Link>
        </div>

        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
          <Link href="/login" className="hover:text-gray-700 underline">
            Admin Login
          </Link>
          <span>&middot;</span>
          <Link href="/user-login" className="hover:text-gray-700 underline">
            User Login
          </Link>
          <span>&middot;</span>
          <Link href="/user-register" className="hover:text-gray-700 underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { userAuthService, type AppUser } from "@/services/user-auth-service";

const planLabel: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

export default function AccountPage() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    userAuthService.me().then((res) => {
      if (res.ok && res.data) {
        setUser(res.data);
      }
    });
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-gray-400">Loading&hellip;</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account</h1>
        <p className="mt-1 text-sm text-gray-600">
          View your profile and subscription details.
        </p>
      </div>

      {/* Profile */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Profile</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Name</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  user.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      {/* Subscription */}
      <section className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900">Subscription</h2>

        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Current Plan</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                {planLabel[user.plan] ?? user.plan}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Renews</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {user.subscriptionEnds
                ? new Date(user.subscriptionEnds).toLocaleDateString()
                : "N/A"}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}

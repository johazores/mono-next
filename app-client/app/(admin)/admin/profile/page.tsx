"use client";

import { useEffect, useState } from "react";
import { authService } from "@/services/auth-service";
import {
  PageHeader,
  FormSection,
  FormField,
  Notice,
  Button,
} from "@/components/ui";
import type { AuthUser, UpdateAdminProfileInput } from "@/types";

export default function ProfilePage() {
  const [admin, setAdmin] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    authService.getProfile().then((res) => {
      if (res.ok && res.data) {
        setAdmin(res.data);
        setName(res.data.name);
      }
    });
  }, []);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const input: UpdateAdminProfileInput = {};
    if (name !== admin?.name) input.name = name;

    if (Object.keys(input).length === 0) {
      setMessage({ type: "error", text: "No changes to save." });
      setSaving(false);
      return;
    }

    try {
      const res = await authService.updateProfile(input);
      if (res.ok && res.data) {
        setAdmin(res.data);
        setMessage({ type: "success", text: "Profile updated." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (!currentPassword || !newPassword) {
      setMessage({
        type: "error",
        text: "Both current and new password are required.",
      });
      setSaving(false);
      return;
    }

    try {
      const res = await authService.updateProfile({
        currentPassword,
        newPassword,
      });
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
        setMessage({ type: "success", text: "Password updated." });
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Update failed.",
      });
    } finally {
      setSaving(false);
    }
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted">Loading&hellip;</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="Manage your admin profile." />

      {message && (
        <Notice
          message={message.text}
          variant={message.type === "success" ? "success" : "error"}
        />
      )}

      {/* Profile */}
      <FormSection title="Details">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <FormField
            label="Name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              type="email"
              value={admin.email}
              disabled
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-muted"
            />
            <p className="mt-1 text-xs text-muted">
              Admin email cannot be changed from here.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">
              Role
            </label>
            <input
              type="text"
              value={admin.role}
              disabled
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm capitalize text-muted"
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving\u2026" : "Save Changes"}
          </Button>
        </form>
      </FormSection>

      {/* Change Password */}
      <FormSection title="Change Password">
        <form onSubmit={handlePasswordSave} className="space-y-4">
          <FormField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <FormField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? "Updating\u2026" : "Update Password"}
          </Button>
        </form>
      </FormSection>
    </div>
  );
}

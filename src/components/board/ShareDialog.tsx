"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Mail, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import {
  inviteToBoard,
  removeMember,
  revokeInvite,
  updateMemberRole,
} from "@/server/actions/members";

export type ShareRole = "EDITOR" | "VIEWER";

export type Member = {
  userId: string;
  role: ShareRole;
  email: string;
  name: string | null;
};

export type Invite = {
  email: string;
  role: ShareRole;
};

export type Owner = {
  id: string;
  email: string;
  name: string | null;
};

type Props = {
  boardId: string;
  owner: Owner;
  members: Member[];
  invites: Invite[];
  onClose: () => void;
};

export function ShareDialog({
  boardId,
  owner,
  members,
  invites,
  onClose,
}: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("EDITOR");
  const [pending, start] = useTransition();

  const submit = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    start(async () => {
      try {
        await inviteToBoard({ boardId, email: trimmed, role });
        setEmail("");
        toast.success("Invite sent");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not send invite");
      }
    });
  };

  const changeRole = (userId: string, newRole: ShareRole) => {
    start(async () => {
      try {
        await updateMemberRole({ boardId, userId, role: newRole });
        toast.success("Role updated");
        router.refresh();
      } catch {
        toast.error("Could not change role");
      }
    });
  };

  const remove = (userId: string) => {
    start(async () => {
      try {
        await removeMember({ boardId, userId });
        toast.success("Member removed");
        router.refresh();
      } catch {
        toast.error("Could not remove");
      }
    });
  };

  const revoke = (em: string) => {
    start(async () => {
      try {
        await revokeInvite({ boardId, email: em });
        toast.success("Invite revoked");
        router.refresh();
      } catch {
        toast.error("Could not revoke");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-sm bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-brand-red" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h2 className="text-base font-semibold text-brand-dark">
            Share Board
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Invite new member
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="example@company.com"
                className="flex-1 min-w-0 rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as ShareRole)}
                className="rounded-sm border border-brand-border bg-white px-2 py-2 text-sm outline-none focus:border-brand-dark"
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <button
                type="button"
                onClick={submit}
                disabled={pending || !email.trim()}
                className="rounded-sm bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:opacity-50"
              >
                Invite
              </button>
            </div>
            <p className="text-xs text-brand-muted">
              If the user is not registered, they will be automatically added when
              they sign up.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Members
            </label>
            <ul className="divide-y divide-brand-border rounded-sm border border-brand-border">
              <li className="flex items-center gap-3 px-3 py-2">
                <Avatar name={owner.name ?? owner.email} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-brand-dark">
                    {owner.name ?? owner.email}
                  </div>
                  <div className="truncate text-xs text-brand-muted">
                    {owner.email}
                  </div>
                </div>
                <span className="text-xs font-semibold text-brand-red">
                  Owner
                </span>
              </li>
              {members.map((m) => (
                <li
                  key={m.userId}
                  className="flex items-center gap-3 px-3 py-2"
                >
                  <Avatar name={m.name ?? m.email} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-brand-dark">
                      {m.name ?? m.email}
                    </div>
                    <div className="truncate text-xs text-brand-muted">
                      {m.email}
                    </div>
                  </div>
                  <select
                    value={m.role}
                    disabled={pending}
                    onChange={(e) =>
                      changeRole(m.userId, e.target.value as ShareRole)
                    }
                    className="rounded-sm border border-brand-border bg-white px-2 py-1 text-xs outline-none focus:border-brand-dark"
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                  <button
                    type="button"
                    aria-label="Remove member"
                    onClick={() => remove(m.userId)}
                    disabled={pending}
                    className="rounded-sm p-1 text-brand-muted hover:bg-brand-red/10 hover:text-brand-red"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
              {members.length === 0 && (
                <li className="px-3 py-3 text-xs text-brand-muted text-center">
                  No other members yet.
                </li>
              )}
            </ul>
          </div>

          {invites.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Pending Invites
              </label>
              <ul className="divide-y divide-brand-border rounded-sm border border-brand-border">
                {invites.map((i) => (
                  <li
                    key={i.email}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-border text-brand-muted">
                      <Mail className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-brand-dark">
                        {i.email}
                      </div>
                      <div className="text-xs text-brand-muted">
                        {i.role === "EDITOR" ? "Editor" : "Viewer"}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label="Revoke invite"
                      onClick={() => revoke(i.email)}
                      disabled={pending}
                      className="rounded-sm p-1 text-brand-muted hover:bg-brand-red/10 hover:text-brand-red"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-white">
      {initials || "?"}
    </span>
  );
}

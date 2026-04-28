"use client";

import {
  useEffect,
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  CalendarDays,
  Clock,
  MessageSquare,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { BoardData, BoardMemberData, CardData, LabelData } from "./BoardView";
import { updateCard } from "@/server/actions/cards";
import { addCardLabel, removeCardLabel } from "@/server/actions/labels";
import {
  addComment,
  deleteComment,
  listComments,
  type CommentDTO,
} from "@/server/actions/comments";
import {
  listActivity,
  type ActivityDTO,
} from "@/server/actions/activity";
import {
  CARD_PRIORITIES,
  isPriority,
  priorityDotClass,
  type CardPriority,
} from "./cardPriority";
import { fromDateInputValue, toDateInputValue } from "./dueDate";
import { labelChipClass } from "./labelColors";

type Props = {
  card: CardData;
  boardLabels: LabelData[];
  boardMembers: BoardMemberData[];
  canEdit: boolean;
  isOwner: boolean;
  currentUserId: string;
  onClose: () => void;
  onLocalChange: Dispatch<SetStateAction<BoardData>>;
  initialBoard: BoardData;
  onCommentCountChange: (cardId: string, delta: number) => void;
};

type Tab = "details" | "activity";

export function CardDialog({
  card,
  boardLabels,
  boardMembers,
  canEdit,
  isOwner,
  currentUserId,
  onClose,
  onLocalChange,
  initialBoard,
  onCommentCountChange,
}: Props) {
  const [tab, setTab] = useState<Tab>("details");
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description ?? "");
  const [priority, setPriority] = useState<CardPriority>(
    isPriority(card.priority) ? card.priority : "none",
  );
  const [dueInput, setDueInput] = useState<string>(toDateInputValue(card.dueDate));
  const [assigneeId, setAssigneeId] = useState<string | null>(card.assigneeId);
  const [savePending, startSave] = useTransition();
  const [labelPending, startLabel] = useTransition();

  const [comments, setComments] = useState<CommentDTO[] | null>(null);
  const [commentsError, setCommentsError] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentPending, startComment] = useTransition();

  const [activity, setActivity] = useState<ActivityDTO[] | null>(null);
  const [activityError, setActivityError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listComments(card.id)
      .then((rows) => { if (!cancelled) setComments(rows); })
      .catch(() => { if (!cancelled) setCommentsError(true); });
    listActivity(card.id)
      .then((rows) => { if (!cancelled) setActivity(rows); })
      .catch(() => { if (!cancelled) setActivityError(true); });
    return () => { cancelled = true; };
  }, [card.id]);

  const newDueIso = fromDateInputValue(dueInput);
  const dirty =
    canEdit &&
    (title.trim() !== card.title ||
      (description.trim() || null) !== (card.description ?? null) ||
      priority !== (isPriority(card.priority) ? card.priority : "none") ||
      newDueIso !== card.dueDate ||
      assigneeId !== card.assigneeId);

  const save = () => {
    const t = title.trim();
    if (!t) return;
    const d = description.trim();
    const dueIso = fromDateInputValue(dueInput);
    const selectedMember = boardMembers.find((m) => m.userId === assigneeId) ?? null;
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) => ({
        ...c,
        cards: c.cards.map((cc) =>
          cc.id === card.id
            ? {
                ...cc,
                title: t,
                description: d || null,
                priority,
                dueDate: dueIso,
                assigneeId,
                assigneeName: selectedMember?.name ?? null,
                assigneeEmail: selectedMember?.email ?? null,
              }
            : cc,
        ),
      })),
    }));
    startSave(async () => {
      try {
        await updateCard({
          cardId: card.id,
          title: t,
          description: d || null,
          priority,
          dueDate: dueIso,
          assigneeId,
        });
        onClose();
      } catch {
        toast.error("Could not save");
        onLocalChange(initialBoard);
      }
    });
  };

  const toggleLabel = (labelId: string) => {
    const has = card.labelIds.includes(labelId);
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) => ({
        ...c,
        cards: c.cards.map((cc) =>
          cc.id === card.id
            ? {
                ...cc,
                labelIds: has
                  ? cc.labelIds.filter((id) => id !== labelId)
                  : [...cc.labelIds, labelId],
              }
            : cc,
        ),
      })),
    }));
    startLabel(async () => {
      try {
        if (has) await removeCardLabel({ cardId: card.id, labelId });
        else await addCardLabel({ cardId: card.id, labelId });
      } catch {
        toast.error("Could not update labels");
        onLocalChange(initialBoard);
      }
    });
  };

  const submitComment = () => {
    const body = newComment.trim();
    if (!body) return;
    startComment(async () => {
      try {
        const created = await addComment({ cardId: card.id, body });
        setComments((prev) => (prev ? [...prev, created] : [created]));
        setNewComment("");
        onCommentCountChange(card.id, 1);
      } catch {
        toast.error("Could not add comment");
      }
    });
  };

  const removeComment = (id: string) => {
    const prev = comments;
    setComments((cs) => (cs ? cs.filter((c) => c.id !== id) : cs));
    onCommentCountChange(card.id, -1);
    startComment(async () => {
      try {
        await deleteComment(id);
      } catch {
        toast.error("Could not delete");
        setComments(prev);
        onCommentCountChange(card.id, 1);
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-sm bg-white shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-brand-red" />
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-brand-border">
          <div className="flex items-center gap-1">
            {(["details", "activity"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1 text-sm font-semibold rounded-sm transition-colors",
                  tab === t
                    ? "bg-brand-dark text-white"
                    : "text-brand-muted hover:text-brand-dark",
                )}
              >
                {t === "details" ? "Details" : "Activity"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {tab === "details" ? (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Title
              </label>
              {canEdit ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
                />
              ) : (
                <p className="mt-1 text-sm font-semibold text-brand-dark">{card.title}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Description
              </label>
              {canEdit ? (
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20 resize-none"
                />
              ) : card.description ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-brand-dark">{card.description}</p>
              ) : (
                <p className="mt-1 text-sm italic text-brand-muted">No description.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Priority
                </label>
                {canEdit ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {CARD_PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setPriority(p.value)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium transition-colors",
                          priority === p.value
                            ? "border-brand-dark bg-brand-dark text-white"
                            : "border-brand-border bg-white text-brand-dark hover:border-brand-dark",
                        )}
                      >
                        <span className={cn("h-2 w-2 rounded-full", priorityDotClass(p.value))} />
                        {p.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-dark">
                    <span className={cn("h-2 w-2 rounded-full", priorityDotClass(priority))} />
                    {CARD_PRIORITIES.find((p) => p.value === priority)?.label}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                  Due date
                </label>
                {canEdit ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="relative flex-1">
                      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
                      <input
                        type="date"
                        value={dueInput}
                        onChange={(e) => setDueInput(e.target.value)}
                        className="w-full rounded-sm border border-brand-border bg-white pl-8 pr-2 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
                      />
                    </div>
                    {dueInput && (
                      <button
                        type="button"
                        onClick={() => setDueInput("")}
                        aria-label="Clear due date"
                        className="rounded-sm border border-brand-border bg-white p-2 text-brand-muted hover:border-brand-dark hover:text-brand-dark"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-brand-dark">
                    {card.dueDate
                      ? new Date(card.dueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </p>
                )}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <User className="h-3.5 w-3.5" />
                Assignee
              </div>
              {canEdit ? (
                <select
                  value={assigneeId ?? ""}
                  onChange={(e) => setAssigneeId(e.target.value || null)}
                  className="mt-1 w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
                >
                  <option value="">Unassigned</option>
                  {boardMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.name ? `${m.name} (${m.email})` : m.email}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="mt-1 text-sm text-brand-dark">
                  {card.assigneeName ?? card.assigneeEmail ?? "—"}
                </p>
              )}
            </div>

            {/* Labels */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <Tag className="h-3.5 w-3.5" />
                Labels
              </div>
              {boardLabels.length === 0 ? (
                <p className="mt-2 text-xs italic text-brand-muted">
                  No labels yet. Create labels from the board header.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {boardLabels.map((l) => {
                    const active = card.labelIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => canEdit && toggleLabel(l.id)}
                        disabled={!canEdit || labelPending}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-xs font-medium transition-all",
                          labelChipClass(l.color),
                          active ? "ring-2 ring-brand-dark/40" : "opacity-60 hover:opacity-100",
                          !canEdit && "cursor-default",
                        )}
                      >
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
                <MessageSquare className="h-3.5 w-3.5" />
                Comments
                {comments && (
                  <span className="text-brand-muted/70">({comments.length})</span>
                )}
              </div>
              <div className="mt-2 space-y-3">
                {commentsError ? (
                  <p className="text-xs text-brand-red">Could not load comments.</p>
                ) : comments === null ? (
                  <p className="text-xs text-brand-muted">Loading…</p>
                ) : comments.length === 0 ? (
                  <p className="text-xs text-brand-muted">No comments yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {comments.map((c) => (
                      <CommentItem
                        key={c.id}
                        comment={c}
                        canDelete={c.userId === currentUserId || isOwner}
                        onDelete={() => removeComment(c.id)}
                      />
                    ))}
                  </ul>
                )}
              </div>
              {canEdit ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        submitComment();
                      }
                    }}
                    rows={2}
                    placeholder="Write a comment… (Send with Ctrl/Cmd + Enter)"
                    className="w-full rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={submitComment}
                      disabled={commentPending || !newComment.trim()}
                      className="rounded-sm bg-brand-dark px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark-hover disabled:opacity-50"
                    >
                      Send
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs italic text-brand-muted">
                  You don&apos;t have permission to comment.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Activity tab */
          <div className="p-6 overflow-y-auto">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-muted mb-4">
              <Clock className="h-3.5 w-3.5" />
              Activity history
            </div>
            {activityError ? (
              <p className="text-xs text-brand-red">Could not load activity.</p>
            ) : activity === null ? (
              <p className="text-xs text-brand-muted">Loading…</p>
            ) : activity.length === 0 ? (
              <p className="text-xs text-brand-muted">No activity yet.</p>
            ) : (
              <ol className="relative border-l border-brand-border space-y-4 ml-2">
                {activity.map((a) => (
                  <ActivityItem key={a.id} entry={a} />
                ))}
              </ol>
            )}
          </div>
        )}

        {canEdit && tab === "details" && (
          <div className="flex items-center justify-end gap-2 border-t border-brand-border bg-brand-surface px-6 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm border border-brand-border bg-white px-3 py-1.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={savePending || !dirty || !title.trim()}
              className={cn(
                "rounded-sm bg-brand-dark px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark-hover transition-colors",
                "disabled:opacity-50",
              )}
            >
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  canDelete,
  onDelete,
}: {
  comment: CommentDTO;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const display = comment.userName ?? comment.userEmail;
  const initials = display
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <li className="flex gap-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-dark text-xs font-semibold text-white">
        {initials || "?"}
      </span>
      <div className="min-w-0 flex-1 rounded-sm border border-brand-border bg-brand-surface px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="truncate text-sm font-semibold text-brand-dark">{display}</span>
            <span className="ml-2 text-[11px] text-brand-muted">{formatTime(comment.createdAt)}</span>
          </div>
          {canDelete && (
            <button
              type="button"
              aria-label="Delete comment"
              onClick={onDelete}
              className="rounded-sm p-1 text-brand-muted hover:bg-brand-red/10 hover:text-brand-red"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-brand-dark">{comment.body}</p>
      </div>
    </li>
  );
}

function ActivityItem({ entry }: { entry: ActivityDTO }) {
  const actor = entry.userName ?? entry.userEmail;
  const text = describeActivity(entry);
  return (
    <li className="pl-5 relative">
      <span className="absolute -left-1.5 top-1 h-3 w-3 rounded-full border-2 border-white bg-brand-muted" />
      <p className="text-sm text-brand-dark">
        <span className="font-semibold">{actor}</span>{" "}
        <span className="text-brand-muted">{text}</span>
      </p>
      <p className="text-[11px] text-brand-muted mt-0.5">{formatTime(entry.createdAt)}</p>
    </li>
  );
}

function describeActivity(entry: ActivityDTO): string {
  const m = entry.meta;
  switch (entry.type) {
    case "card_created":
      return "created this card";
    case "card_moved":
      return m?.from && m?.to
        ? `moved this card from "${m.from}" to "${m.to}"`
        : "moved this card";
    case "title_changed":
      return m?.from && m?.to
        ? `renamed from "${m.from}" to "${m.to}"`
        : "changed the title";
    case "description_changed":
      return "updated the description";
    case "priority_changed":
      return m?.from && m?.to
        ? `changed priority from ${m.from} to ${m.to}`
        : "changed the priority";
    case "due_date_changed":
      if (!m?.to) return "removed the due date";
      return `set due date to ${new Date(m.to).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    case "assignee_changed":
      if (!m?.to) return "removed the assignee";
      return `assigned to ${m.to}`;
    case "label_added":
      return m?.label ? `added label "${m.label}"` : "added a label";
    case "label_removed":
      return m?.label ? `removed label "${m.label}"` : "removed a label";
    case "comment_added":
      return "added a comment";
    default:
      return entry.type.replace(/_/g, " ");
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} hour${hour > 1 ? "s" : ""} ago`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString("en-US");
}

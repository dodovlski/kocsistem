"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { LabelData } from "./BoardView";
import {
  createLabel,
  deleteLabel,
  updateLabel,
} from "@/server/actions/labels";
import {
  LABEL_COLORS,
  isLabelColor,
  labelChipClass,
  type LabelColor,
} from "./labelColors";

type Props = {
  boardId: string;
  labels: LabelData[];
  canEdit: boolean;
  onChange: (labels: LabelData[]) => void;
  onClose: () => void;
};

export function LabelsDialog({
  boardId,
  labels,
  canEdit,
  onChange,
  onClose,
}: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>("blue");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<LabelColor>("blue");
  const [pending, start] = useTransition();

  const submitCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    start(async () => {
      try {
        const created = await createLabel({ boardId, name: trimmed, color });
        onChange([...labels, created].sort((a, b) => a.name.localeCompare(b.name)));
        setName("");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not create label");
      }
    });
  };

  const startEdit = (label: LabelData) => {
    setEditingId(label.id);
    setEditName(label.name);
    setEditColor(isLabelColor(label.color) ? label.color : "blue");
  };

  const submitEdit = () => {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    const id = editingId;
    start(async () => {
      try {
        await updateLabel({ labelId: id, name: trimmed, color: editColor });
        onChange(
          labels
            .map((l) =>
              l.id === id ? { ...l, name: trimmed, color: editColor } : l,
            )
            .sort((a, b) => a.name.localeCompare(b.name)),
        );
        setEditingId(null);
      } catch {
        toast.error("Could not update label");
      }
    });
  };

  const remove = (id: string) => {
    start(async () => {
      try {
        await deleteLabel(id);
        onChange(labels.filter((l) => l.id !== id));
      } catch {
        toast.error("Could not delete label");
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
            Manage Labels
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-sm p-1 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
          >
            <X className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {canEdit && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
                Create new label
              </label>
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                  placeholder="Label name"
                  maxLength={40}
                  className="flex-1 min-w-0 rounded-sm border border-brand-border bg-white px-3 py-2 text-sm outline-none focus:border-brand-dark focus:ring-2 focus:ring-brand-red/20"
                />
                <button
                  type="button"
                  onClick={submitCreate}
                  disabled={pending || !name.trim()}
                  className="inline-flex items-center gap-1 rounded-sm bg-brand-red px-3 py-2 text-sm font-semibold text-white hover:bg-brand-red-hover disabled:opacity-50"
                >
                  <Plus className="h-5 w-5 sm:h-3.5 sm:w-3.5" /> Add
                </button>
              </div>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
              Labels
            </label>
            {labels.length === 0 ? (
              <p className="rounded-sm border border-dashed border-brand-border bg-brand-surface px-3 py-4 text-center text-xs text-brand-muted">
                No labels yet.
              </p>
            ) : (
              <ul className="divide-y divide-brand-border rounded-sm border border-brand-border">
                {labels.map((l) => {
                  const isEditing = editingId === l.id;
                  return (
                    <li key={l.id} className="px-3 py-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && submitEdit()
                              }
                              maxLength={40}
                              autoFocus
                              className="flex-1 min-w-0 rounded-sm border border-brand-border bg-white px-2 py-1 text-sm outline-none focus:border-brand-dark"
                            />
                            <button
                              type="button"
                              onClick={submitEdit}
                              disabled={pending || !editName.trim()}
                              className="rounded-sm bg-brand-dark px-3 py-1 text-xs font-semibold text-white hover:bg-brand-dark-hover disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="rounded-sm border border-brand-border bg-white px-3 py-1 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                          <ColorPicker
                            value={editColor}
                            onChange={setEditColor}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm border px-2 py-0.5 text-xs font-medium",
                              labelChipClass(l.color),
                            )}
                          >
                            {l.name}
                          </span>
                          <span className="ml-auto flex items-center gap-1">
                            {canEdit && (
                              <>
                                <button
                                  type="button"
                                  aria-label="Edit"
                                  onClick={() => startEdit(l)}
                                  className="rounded-sm p-1.5 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
                                >
                                  <Pencil className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  aria-label="Delete"
                                  onClick={() => remove(l.id)}
                                  className="rounded-sm p-1.5 text-brand-muted hover:bg-brand-red/10 hover:text-brand-red"
                                >
                                  <Trash2 className="h-5 w-5 sm:h-3.5 sm:w-3.5" />
                                </button>
                              </>
                            )}
                          </span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: LabelColor;
  onChange: (c: LabelColor) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {LABEL_COLORS.map((c) => (
        <button
          key={c.value}
          type="button"
          title={c.label}
          onClick={() => onChange(c.value)}
          className={cn(
            "h-5 w-5 rounded-full border",
            c.swatch,
            value === c.value
              ? "border-brand-dark ring-2 ring-brand-dark/30"
              : "border-brand-border",
          )}
        />
      ))}
    </div>
  );
}

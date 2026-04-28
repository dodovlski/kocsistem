"use client";

import { useState, useTransition, useRef, useEffect, type Dispatch, type SetStateAction } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, MoreHorizontal, Palette, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { BoardData, BoardMemberData, CardData, ColumnData, LabelData } from "./BoardView";
import { SortableCardView } from "./Card";
import {
  deleteColumn,
  renameColumn,
  setColumnColor,
} from "@/server/actions/columns";
import { createCard, deleteCard } from "@/server/actions/cards";
import { COLUMN_COLORS, colorBarClass, type ColumnColor } from "./columnColors";
import { ConfirmDialog } from "./ConfirmDialog";
import { useUndoRedo } from "./UndoRedoProvider";

type Props = {
  column: ColumnData;
  boardId: string;
  boardLabels: LabelData[];
  boardMembers: BoardMemberData[];
  onLocalChange: Dispatch<SetStateAction<BoardData>>;
  initialBoard: BoardData;
  canEdit: boolean;
  isOwner: boolean;
  currentUserId: string;
};

export function ColumnView({
  column,
  boardLabels,
  boardMembers,
  onLocalChange,
  initialBoard,
  canEdit,
  isOwner,
  currentUserId,
}: Props) {
  const sortable = useSortable({
    id: column.id,
    data: { type: "column" },
    disabled: !canEdit,
  });
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = sortable;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(column.title);
  const [, startRename] = useTransition();
  const [deletePending, startDelete] = useTransition();
  const [addingCard, setAddingCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [newCardDescription, setNewCardDescription] = useState("");
  const [, startAddCard] = useTransition();
  const [colorOpen, setColorOpen] = useState(false);
  const [, startColor] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const addCardRef = useRef<HTMLDivElement>(null);
  const addCardFnRef = useRef<() => void>(() => {});
  const { push: pushUndo } = useUndoRedo();

  // When clicked/tapped outside: save if title present, otherwise close
  useEffect(() => {
    if (!addingCard) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e instanceof TouchEvent ? e.touches[0]?.target : e.target;
      if (addCardRef.current && target && !addCardRef.current.contains(target as Node)) {
        addCardFnRef.current();
      }
    };
    document.addEventListener("mousedown", handler as EventListener);
    document.addEventListener("touchstart", handler as EventListener, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handler as EventListener);
      document.removeEventListener("touchstart", handler as EventListener);
    };
  }, [addingCard]);

  const saveTitle = () => {
    const trimmed = title.trim();
    if (!trimmed || trimmed === column.title) {
      setTitle(column.title);
      setEditing(false);
      return;
    }
    setEditing(false);
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) =>
        c.id === column.id ? { ...c, title: trimmed } : c,
      ),
    }));
    startRename(async () => {
      try {
        await renameColumn({ columnId: column.id, title: trimmed });
      } catch {
        toast.error("Could not rename");
        onLocalChange(initialBoard);
      }
    });
  };

  const changeColor = (color: ColumnColor) => {
    setColorOpen(false);
    if (color === column.color) return;
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) =>
        c.id === column.id ? { ...c, color } : c,
      ),
    }));
    startColor(async () => {
      try {
        await setColumnColor({ columnId: column.id, color });
      } catch {
        toast.error("Could not change color");
        onLocalChange(initialBoard);
      }
    });
  };

  const remove = () => {
    setConfirmOpen(false);
    // Snapshot the column + cards before deletion for undo
    const deletedColumn = column;
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.filter((c) => c.id !== column.id),
    }));
    startDelete(async () => {
      try {
        await deleteColumn(column.id);
        pushUndo({
          description: `Deleted column "${deletedColumn.title}"`,
          undo: () => {
            // Restore column in local state immediately
            onLocalChange((p) => {
              const cols = [...p.columns, deletedColumn].sort((a, b) =>
                a.order.localeCompare(b.order),
              );
              return { ...p, columns: cols };
            });
            // Note: Server-side restoration would require a recreateColumn action.
            // For now, the page will revalidate on next navigation.
            // This is a client-only undo for deleted columns.
            toast.info("Column restored. Refresh to sync with server.");
          },
          redo: () => {
            onLocalChange((p) => ({
              ...p,
              columns: p.columns.filter((c) => c.id !== column.id),
            }));
            deleteColumn(column.id).catch(() => toast.error("Redo failed"));
          },
        });
      } catch {
        toast.error("Could not delete column");
        onLocalChange(initialBoard);
      }
    });
  };

  const addCard = () => {
    const t = newCardTitle.trim();
    if (!t) return;
    const d = newCardDescription.trim();
    setNewCardTitle("");
    setNewCardDescription("");
    setAddingCard(false);

    const optimistic: CardData = {
      id: `tmp-${Date.now()}`,
      title: t,
      description: d ? d : null,
      priority: "none",
      dueDate: null,
      columnId: column.id,
      order: "zzz",
      labelIds: [],
      commentCount: 0,
      assigneeId: null,
      assigneeName: null,
      assigneeEmail: null,
    };
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) =>
        c.id === column.id ? { ...c, cards: [...c.cards, optimistic] } : c,
      ),
    }));

    startAddCard(async () => {
      try {
        const real = await createCard({
          columnId: column.id,
          title: t,
          ...(d ? { description: d } : {}),
        });
        onLocalChange((p) => ({
          ...p,
          columns: p.columns.map((c) =>
            c.id === column.id
              ? {
                  ...c,
                  cards: c.cards.map((cc) =>
                    cc.id === optimistic.id
                      ? {
                          id: real.id,
                          title: real.title,
                          description: real.description,
                          priority: "none" as const,
                          dueDate: null,
                          columnId: real.columnId,
                          order: real.order,
                          labelIds: [],
                          commentCount: 0,
                          assigneeId: null,
                          assigneeName: null,
                          assigneeEmail: null,
                        }
                      : cc,
                  ),
                }
              : c,
          ),
        }));

        // Make card creation undoable
        const realId = real.id;
        pushUndo({
          description: `Created card "${t}"`,
          undo: () => {
            onLocalChange((p) => ({
              ...p,
              columns: p.columns.map((c) =>
                c.id === column.id
                  ? { ...c, cards: c.cards.filter((cc) => cc.id !== realId) }
                  : c,
              ),
            }));
            deleteCard(realId).catch(() => toast.error("Undo failed"));
          },
          redo: () => {
            createCard({
              columnId: column.id,
              title: t,
              ...(d ? { description: d } : {}),
            }).then((reCreated) => {
              onLocalChange((p) => ({
                ...p,
                columns: p.columns.map((c) =>
                  c.id === column.id
                    ? {
                        ...c,
                        cards: [
                          ...c.cards,
                          {
                            id: reCreated.id,
                            title: reCreated.title,
                            description: reCreated.description,
                            priority: "none" as const,
                            dueDate: null,
                            columnId: reCreated.columnId,
                            order: reCreated.order,
                            labelIds: [],
                            commentCount: 0,
                            assigneeId: null,
                            assigneeName: null,
                            assigneeEmail: null,
                          },
                        ],
                      }
                    : c,
                ),
              }));
            }).catch(() => toast.error("Redo failed"));
          },
        });
      } catch {
        toast.error("Could not add card");
        onLocalChange(initialBoard);
      }
    });
  };

  // When clicked outside: save if title present, otherwise just close
  const dismissOrSave = () => {
    if (newCardTitle.trim()) {
      addCard();
    } else {
      setNewCardTitle("");
      setNewCardDescription("");
      setAddingCard(false);
    }
  };
  addCardFnRef.current = dismissOrSave;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group/col w-[280px] shrink-0 rounded-sm border border-brand-border bg-white flex flex-col max-h-[calc(100vh-10rem)] shadow-sm",
        isDragging && "opacity-50",
      )}
    >
      <div className={cn("h-1 w-full", colorBarClass(column.color))} />
      <div className="flex items-center gap-1 p-2 border-b border-brand-border bg-brand-surface relative">
        {canEdit && (
          <button
            type="button"
            aria-label="Drag column"
            className="cursor-grab active:cursor-grabbing rounded-sm p-1 text-brand-muted hover:bg-brand-border touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        )}
        {editing && canEdit ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveTitle();
              if (e.key === "Escape") {
                setTitle(column.title);
                setEditing(false);
              }
            }}
            className="flex-1 rounded-sm border border-brand-dark bg-white px-2 py-1 text-sm outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => canEdit && setEditing(true)}
            disabled={!canEdit}
            className="flex-1 text-left text-sm font-semibold text-brand-dark px-1 py-1 rounded-sm hover:bg-brand-border disabled:hover:bg-transparent disabled:cursor-default"
          >
            {column.title}{" "}
            <span className="text-brand-muted font-normal">
              · {column.cards.length}
            </span>
          </button>
        )}
        {canEdit && (
          <div className="relative sm:opacity-0 sm:group-hover/col:opacity-100 focus-within:opacity-100 transition-opacity">
            <button
              type="button"
              aria-label="Options"
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-sm p-1 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
            >
              <MoreHorizontal className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-sm border border-brand-border bg-white shadow-md py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setColorOpen((v) => !v); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-brand-dark hover:bg-brand-border"
                  >
                    <Palette className="h-3.5 w-3.5 text-brand-muted" /> Choose color
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-brand-red hover:bg-brand-red/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete column
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        {colorOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setColorOpen(false)}
            />
            <div className="absolute right-2 top-full z-20 mt-1 flex gap-1 rounded-sm border border-brand-border bg-white p-2 shadow-md">
              {COLUMN_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  title={c.label}
                  onClick={() => changeColor(c.value)}
                  className={cn(
                    "h-8 w-8 sm:h-5 sm:w-5 rounded-full border",
                    c.swatch,
                    column.color === c.value
                      ? "border-brand-dark ring-2 ring-brand-dark/30"
                      : "border-brand-border",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <SortableContext
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className={cn(
            "flex-1 overflow-y-auto px-2 flex flex-col gap-2",
            column.cards.length > 0 ? "py-2 min-h-[40px]" : "py-0 min-h-0",
          )}
          data-column-drop-id={column.id}
        >
          {column.cards.map((card) => (
            <SortableCardView
              key={card.id}
              card={card}
              boardLabels={boardLabels}
              boardMembers={boardMembers}
              onLocalChange={onLocalChange}
              initialBoard={initialBoard}
              canEdit={canEdit}
              isOwner={isOwner}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      </SortableContext>

      {canEdit && (
      <div className="p-2 border-t border-brand-border bg-brand-surface">
        {addingCard ? (
          <div ref={addCardRef} className="space-y-2">
            <input
              autoFocus
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title"
              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-sm outline-none focus:border-brand-dark"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCard();
                }
                if (e.key === "Escape") {
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setAddingCard(false);
                }
              }}
            />
            <textarea
              value={newCardDescription}
              onChange={(e) => setNewCardDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={3}
              className="w-full rounded-sm border border-brand-border bg-white px-2 py-1.5 text-sm resize-none outline-none focus:border-brand-dark"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  addCard();
                }
                if (e.key === "Escape") {
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setAddingCard(false);
                }
              }}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={addCard}
                className="rounded-sm bg-brand-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-red-hover"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewCardTitle("");
                  setNewCardDescription("");
                  setAddingCard(false);
                }}
                className="rounded-sm border border-brand-border bg-white px-3 py-1.5 text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAddingCard(true)}
            className="flex w-full items-center gap-2 rounded-sm px-2 py-2.5 text-sm sm:text-xs font-medium text-brand-muted hover:bg-white hover:text-brand-dark cursor-pointer active:bg-brand-border transition-colors"
          >
            <Plus className="h-5 w-5 sm:h-3.5 sm:w-3.5" /> Add card
          </button>
        )}
      </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete column"
        description="Are you sure you want to delete this column and all its cards? This action cannot be undone."
        pending={deletePending}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

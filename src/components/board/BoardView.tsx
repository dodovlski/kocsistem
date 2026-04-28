"use client";

import { useCallback, useEffect, useMemo, useState, useTransition, useId } from "react";
import { Plus, Redo2, Share2, Tag, Undo2 } from "lucide-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { toast } from "sonner";
import { ColumnView } from "./Column";
import { CardView } from "./Card";
import { AddColumn } from "./AddColumn";
import { orderBetween } from "@/lib/ordering";
import { createColumn, moveColumn } from "@/server/actions/columns";
import { moveCard as moveCardAction } from "@/server/actions/cards";
import { colorBarClass } from "./columnColors";
import { RoleBadge } from "./RoleBadge";
import {
  ShareDialog,
  type Invite,
  type Member,
  type Owner,
} from "./ShareDialog";
import { LabelsDialog } from "./LabelsDialog";
import { UndoRedoProvider, useUndoRedo } from "./UndoRedoProvider";
import { cn } from "@/lib/cn";
import type { BoardRole } from "@/lib/auth";

export type CardData = {
  id: string;
  title: string;
  description: string | null;
  priority: "none" | "low" | "medium" | "high";
  dueDate: string | null;
  columnId: string;
  order: string;
  labelIds: string[];
  commentCount: number;
  assigneeId: string | null;
  assigneeName: string | null;
  assigneeEmail: string | null;
};

export type BoardMemberData = {
  userId: string;
  email: string;
  name: string | null;
};

export type LabelData = {
  id: string;
  name: string;
  color: string;
};

export type ColumnColor =
  | "red"
  | "amber"
  | "green"
  | "blue"
  | "violet"
  | "slate";

export type ColumnData = {
  id: string;
  title: string;
  color: string;
  order: string;
  cards: CardData[];
};

export type BoardData = {
  id: string;
  title: string;
  labels: LabelData[];
  columns: ColumnData[];
};

type Props = {
  board: BoardData;
  role: BoardRole;
  currentUser: { id: string; email: string };
  owner: Owner;
  members: Member[];
  invites: Invite[];
  boardMembers: BoardMemberData[];
};

export function BoardView(props: Props) {
  return (
    <UndoRedoProvider>
      <BoardViewInner {...props} />
    </UndoRedoProvider>
  );
}

function BoardViewInner({
  board: initialBoard,
  role,
  currentUser,
  owner,
  members,
  invites,
  boardMembers,
}: Props) {
  const id = useId();
  const [board, setBoard] = useState<BoardData>(initialBoard);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [addingColumn, setAddingColumn] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, startSave] = useTransition();

  const { push: pushUndo, canUndo, canRedo, undo, redo } = useUndoRedo();

  useEffect(() => {
    setMounted(true);
  }, []);

  const canEdit = role === "OWNER" || role === "EDITOR";
  const isOwner = role === "OWNER";
  const currentUserId = currentUser.id;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const columnIds = useMemo(() => board.columns.map((c) => c.id), [board]);

  const findCard = useCallback(
    (id: string) => {
      for (const col of board.columns) {
        const c = col.cards.find((x) => x.id === id);
        if (c) return { col, card: c };
      }
      return null;
    },
    [board],
  );

  const handleDragStart = (ev: DragStartEvent) => {
    if (!canEdit) return;
    const type = ev.active.data.current?.type as "card" | "column" | undefined;
    if (type === "card") {
      const hit = findCard(ev.active.id as string);
      if (hit) setActiveCard(hit.card);
    } else if (type === "column") {
      setActiveColumnId(ev.active.id as string);
    }
  };

  const handleDragOver = (ev: DragOverEvent) => {
    if (!canEdit) return;
    const { active, over } = ev;
    if (!over) return;
    const activeType = active.data.current?.type as
      | "card"
      | "column"
      | undefined;
    if (activeType !== "card") return;

    const overType = over.data.current?.type as "card" | "column" | undefined;
    const activeId = active.id as string;
    const overId = over.id as string;

    const fromHit = findCard(activeId);
    if (!fromHit) return;

    const targetColumnId =
      overType === "column"
        ? overId
        : (over.data.current?.columnId as string | undefined);
    if (!targetColumnId) return;

    if (fromHit.col.id === targetColumnId) return;

    setBoard((prev) => {
      const cols = prev.columns.map((c) => ({ ...c, cards: [...c.cards] }));
      const source = cols.find((c) => c.id === fromHit.col.id)!;
      const target = cols.find((c) => c.id === targetColumnId)!;
      const idx = source.cards.findIndex((c) => c.id === activeId);
      if (idx === -1) return prev;
      const [moved] = source.cards.splice(idx, 1);
      moved.columnId = target.id;

      let insertAt = target.cards.length;
      if (overType === "card") {
        const overIdx = target.cards.findIndex((c) => c.id === overId);
        if (overIdx !== -1) insertAt = overIdx;
      }
      target.cards.splice(insertAt, 0, moved);
      return { ...prev, columns: cols };
    });
  };

  const handleDragEnd = (ev: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = ev;
    setActiveCard(null);
    setActiveColumnId(null);
    if (!over) return;

    const activeType = active.data.current?.type as
      | "card"
      | "column"
      | undefined;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId && activeType === "card") return;

    if (activeType === "column") {
      if (activeId === overId) return;
      const oldIndex = board.columns.findIndex((c) => c.id === activeId);
      if (oldIndex === -1) return;

      const overType = over.data.current?.type as "card" | "column" | undefined;
      const targetId = overType === "card" ? (over.data.current?.columnId as string) : overId;
      const newIndex = board.columns.findIndex((c) => c.id === targetId);
      if (newIndex === -1) return;

      const reordered = [...board.columns];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);

      const prev = reordered[newIndex - 1]?.order ?? null;
      const next = reordered[newIndex + 1]?.order ?? null;
      let newOrder: string;
      try {
        newOrder = orderBetween(prev, next);
      } catch {
        return;
      }
      reordered[newIndex] = { ...moved, order: newOrder };

      // Capture state before the move for undo
      const boardBeforeMove = board;
      setBoard((p) => ({ ...p, columns: reordered }));

      startSave(async () => {
        try {
          await moveColumn({
            columnId: activeId,
            prevOrder: prev,
            nextOrder: next,
          });

          // Compute the reverse: move column back to original position
          const origOrder = moved.order;
          const origPrev = boardBeforeMove.columns[oldIndex - 1]?.order ?? null;
          const origNext = boardBeforeMove.columns[oldIndex + 1]?.order ?? null;

          pushUndo({
            description: `Moved column "${moved.title}"`,
            undo: () => {
              setBoard(boardBeforeMove);
              moveColumn({
                columnId: activeId,
                prevOrder: origPrev,
                nextOrder: origNext,
              }).catch(() => toast.error("Undo failed"));
            },
            redo: () => {
              setBoard((p) => ({ ...p, columns: reordered }));
              moveColumn({
                columnId: activeId,
                prevOrder: prev,
                nextOrder: next,
              }).catch(() => toast.error("Redo failed"));
            },
          });
        } catch {
          toast.error("Could not move column");
          setBoard(initialBoard);
        }
      });
      return;
    }

    if (activeType === "card") {
      const hit = findCard(activeId);
      if (!hit) return;
      const targetCol = hit.col;
      const idx = targetCol.cards.findIndex((c) => c.id === activeId);
      if (idx === -1) return;

      const prevCard = targetCol.cards[idx - 1]?.order ?? null;
      const nextCard = targetCol.cards[idx + 1]?.order ?? null;
      let newOrder: string;
      try {
        newOrder = orderBetween(prevCard, nextCard);
      } catch {
        return;
      }

      // Capture state before the move for undo
      const boardBeforeMove = board;
      // Find the card's original column and order before any DragOver mutations
      const origCard = (() => {
        for (const col of boardBeforeMove.columns) {
          const c = col.cards.find((x) => x.id === activeId);
          if (c) return { columnId: col.id, order: c.order };
        }
        return null;
      })();

      setBoard((p) => {
        const cols = p.columns.map((c) => ({
          ...c,
          cards: c.cards.map((cc) =>
            cc.id === activeId ? { ...cc, order: newOrder } : cc,
          ),
        }));
        return { ...p, columns: cols };
      });

      startSave(async () => {
        try {
          await moveCardAction({
            cardId: activeId,
            targetColumnId: targetCol.id,
            prevOrder: prevCard,
            nextOrder: nextCard,
          });

          // Compute undo data: move card back to original position
          if (origCard) {
            const movedCardTitle = hit.card.title;
            const origColId = origCard.columnId;
            const origOrd = origCard.order;
            // Find neighbours around original position for the reverse server call
            const origCol = boardBeforeMove.columns.find((c) => c.id === origColId);
            const origIdx = origCol?.cards.findIndex((c) => c.id === activeId) ?? -1;
            const origPrevOrder = origIdx > 0 ? (origCol?.cards[origIdx - 1]?.order ?? null) : null;
            const origNextOrder = origCol?.cards[origIdx + 1]?.order ?? null;

            pushUndo({
              description: `Moved card "${movedCardTitle}"`,
              undo: () => {
                setBoard(boardBeforeMove);
                moveCardAction({
                  cardId: activeId,
                  targetColumnId: origColId,
                  prevOrder: origPrevOrder,
                  nextOrder: origNextOrder,
                }).catch(() => toast.error("Undo failed"));
              },
              redo: () => {
                setBoard((p) => {
                  const cols = p.columns.map((c) => ({
                    ...c,
                    cards: c.cards.map((cc) =>
                      cc.id === activeId
                        ? { ...cc, columnId: targetCol.id, order: newOrder }
                        : cc,
                    ),
                  }));
                  // Move card between columns in local state
                  const srcCol = cols.find((c) => c.cards.some((cc) => cc.id === activeId));
                  const dstCol = cols.find((c) => c.id === targetCol.id);
                  if (srcCol && dstCol && srcCol.id !== dstCol.id) {
                    const cardIdx = srcCol.cards.findIndex((cc) => cc.id === activeId);
                    if (cardIdx !== -1) {
                      const [movedCard] = srcCol.cards.splice(cardIdx, 1);
                      movedCard.columnId = dstCol.id;
                      dstCol.cards.push(movedCard);
                      dstCol.cards.sort((a, b) => a.order.localeCompare(b.order));
                    }
                  }
                  return { ...p, columns: cols };
                });
                moveCardAction({
                  cardId: activeId,
                  targetColumnId: targetCol.id,
                  prevOrder: prevCard,
                  nextOrder: nextCard,
                }).catch(() => toast.error("Redo failed"));
              },
            });
          }
        } catch {
          toast.error("Could not move card");
          setBoard(initialBoard);
        }
      });
    }
  };

  const handleAddColumn = async (title: string) => {
    try {
      const col = await createColumn({ boardId: board.id, title });
      setBoard((p) => ({
        ...p,
        columns: [...p.columns, { ...col, cards: [] }],
      }));
    } catch {
      toast.error("Could not add column");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:pt-8 pb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="h-6 w-1 bg-brand-red" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-brand-dark truncate max-w-[50vw] sm:max-w-none">
            {board.title}
          </h1>
          <RoleBadge role={role} />
        </div>

        {/* ── Toolbar: always visible, mobile-friendly ───────── */}
        {canEdit && (
          <div className="flex items-center gap-1.5 sm:gap-2 mt-3 flex-wrap">
            {/* Undo / Redo */}
            <div className="inline-flex rounded-sm border border-brand-border bg-white divide-x divide-brand-border">
              <button
                type="button"
                onClick={() => undo()}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 text-brand-dark transition-colors",
                  canUndo ? "hover:bg-brand-border active:bg-brand-dark/10" : "opacity-30 cursor-not-allowed",
                )}
              >
                <Undo2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
              <button
                type="button"
                onClick={() => redo()}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                aria-label="Redo"
                className={cn(
                  "inline-flex items-center justify-center h-10 w-10 sm:h-9 sm:w-9 text-brand-dark transition-colors",
                  canRedo ? "hover:bg-brand-border active:bg-brand-dark/10" : "opacity-30 cursor-not-allowed",
                )}
              >
                <Redo2 className="h-5 w-5 sm:h-4 sm:w-4" />
              </button>
            </div>

            {/* Labels */}
            <button
              type="button"
              onClick={() => setLabelsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-white h-10 sm:h-9 px-3 text-sm sm:text-xs font-semibold text-brand-dark hover:border-brand-dark active:bg-brand-dark/5"
            >
              <Tag className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Labels</span>
            </button>

            {/* Share (owner only) */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-white h-10 sm:h-9 px-3 text-sm sm:text-xs font-semibold text-brand-dark hover:border-brand-dark active:bg-brand-dark/5"
              >
                <Share2 className="h-5 w-5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}

            {/* Add column */}
            <button
              type="button"
              onClick={() => setAddingColumn(true)}
              aria-label="Add column"
              className="inline-flex items-center gap-1.5 rounded-sm border border-brand-border bg-white h-10 sm:h-9 px-3 text-sm sm:text-xs font-semibold text-brand-dark hover:border-brand-dark active:bg-brand-dark/5 sm:hidden"
            >
              <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}

        {!canEdit && (
          <div className="mt-3 rounded-sm border border-brand-border bg-brand-surface px-3 py-2 text-xs text-brand-muted">
            You can only view this board. Ask the owner for editor permissions to
            make changes.
          </div>
        )}
      </div>
      <DndContext
        id={id}
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="mx-auto flex w-full max-w-7xl items-start gap-4 px-4 pb-8 pt-2 min-h-full">
            <SortableContext
              items={columnIds}
              strategy={horizontalListSortingStrategy}
            >
              {board.columns.map((col) => (
                <ColumnView
                  key={col.id}
                  column={col}
                  boardLabels={board.labels}
                  boardMembers={boardMembers}
                  onLocalChange={setBoard}
                  boardId={board.id}
                  initialBoard={initialBoard}
                  canEdit={canEdit}
                  isOwner={isOwner}
                  currentUserId={currentUserId}
                />
              ))}
            </SortableContext>
            {canEdit && (
              <AddColumn
                onAdd={handleAddColumn}
                adding={addingColumn}
                onAddingChange={setAddingColumn}
              />
            )}
          </div>
        </div>
        <DragOverlay>
          {activeCard ? (
            <CardView card={activeCard} labels={board.labels} dragging />
          ) : null}
          {activeColumnId
            ? (() => {
                const c = board.columns.find((x) => x.id === activeColumnId);
                return c ? (
                  <div className="w-[280px] rounded-sm border border-brand-dark bg-white shadow-xl opacity-95">
                    <div className={`h-1 w-full ${colorBarClass(c.color)}`} />
                    <div className="px-3 py-2 font-semibold text-sm text-brand-dark">
                      {c.title}
                    </div>
                  </div>
                ) : null;
              })()
            : null}
        </DragOverlay>
      </DndContext>

      {shareOpen && isOwner && (
        <ShareDialog
          boardId={board.id}
          owner={owner}
          members={members}
          invites={invites}
          onClose={() => setShareOpen(false)}
        />
      )}

      {labelsOpen && (
        <LabelsDialog
          boardId={board.id}
          labels={board.labels}
          canEdit={canEdit}
          onChange={(labels) => {
            const validIds = new Set(labels.map((l) => l.id));
            setBoard((p) => ({
              ...p,
              labels,
              columns: p.columns.map((c) => ({
                ...c,
                cards: c.cards.map((cc) => ({
                  ...cc,
                  labelIds: cc.labelIds.filter((id) => validIds.has(id)),
                })),
              })),
            }));
          }}
          onClose={() => setLabelsOpen(false)}
        />
      )}
    </div>
  );
}

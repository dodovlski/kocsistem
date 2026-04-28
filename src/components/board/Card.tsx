"use client";

import {
  useState,
  useTransition,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, GripVertical, MessageSquare, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";
import type { BoardData, BoardMemberData, CardData, LabelData } from "./BoardView";

// re-export so Column.tsx can import it through this file if needed
export type { BoardMemberData };
import { deleteCard } from "@/server/actions/cards";
import { ConfirmDialog } from "./ConfirmDialog";
import { CardDialog } from "./CardDialog";
import { isPriority, priorityBorderClass } from "./cardPriority";
import { dueBadgeClass, formatDueShort } from "./dueDate";
import { labelChipClass } from "./labelColors";

export function CardView({
  card,
  labels,
  dragging,
}: {
  card: CardData;
  labels?: LabelData[];
  dragging?: boolean;
}) {
  const priority = isPriority(card.priority) ? card.priority : "none";
  const cardLabels = (labels ?? []).filter((l) =>
    card.labelIds.includes(l.id),
  );
  return (
    <div
      className={cn(
        "rounded-sm border border-brand-border bg-white p-3 shadow-sm text-sm border-l-2 flex items-start gap-1.5",
        priorityBorderClass(priority),
        dragging && "shadow-xl rotate-1",
      )}
    >
      <span className="mt-0.5 text-brand-muted shrink-0">
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        {cardLabels.length > 0 && (
          <div className="mb-1 flex flex-wrap gap-1">
            {cardLabels.map((l) => (
              <span
                key={l.id}
                className={cn(
                  "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                  labelChipClass(l.color),
                )}
              >
                {l.name}
              </span>
            ))}
          </div>
        )}
        <div className="font-semibold text-brand-dark">{card.title}</div>
        {card.description && (
          <div className="mt-1 text-xs text-brand-muted line-clamp-2">
            {card.description}
          </div>
        )}
        {card.dueDate && (
          <div
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
              dueBadgeClass(card.dueDate),
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {formatDueShort(card.dueDate)}
          </div>
        )}
      </div>
    </div>
  );
}

type SortableProps = {
  card: CardData;
  boardLabels: LabelData[];
  boardMembers: BoardMemberData[];
  onLocalChange: Dispatch<SetStateAction<BoardData>>;
  initialBoard: BoardData;
  canEdit: boolean;
  isOwner: boolean;
  currentUserId: string;
};

export function SortableCardView({
  card,
  boardLabels,
  boardMembers,
  onLocalChange,
  initialBoard,
  canEdit,
  isOwner,
  currentUserId,
}: SortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { type: "card", columnId: card.columnId },
    disabled: !canEdit,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, start] = useTransition();

  const priority = isPriority(card.priority) ? card.priority : "none";
  const cardLabels = boardLabels.filter((l) => card.labelIds.includes(l.id));

  const remove = () => {
    setConfirmOpen(false);
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) => ({
        ...c,
        cards: c.cards.filter((cc) => cc.id !== card.id),
      })),
    }));
    start(async () => {
      try {
        await deleteCard(card.id);
      } catch {
        toast.error("Could not delete");
        onLocalChange(initialBoard);
      }
    });
  };

  const updateCommentCount = (cardId: string, delta: number) => {
    onLocalChange((p) => ({
      ...p,
      columns: p.columns.map((c) => ({
        ...c,
        cards: c.cards.map((cc) =>
          cc.id === cardId
            ? { ...cc, commentCount: Math.max(0, cc.commentCount + delta) }
            : cc,
        ),
      })),
    }));
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        onClick={(e) => {
          if (isDragging) return;
          const target = e.target as HTMLElement;
          if (target.closest("button")) return;
          setEditOpen(true);
        }}
        className={cn(
          "group rounded-sm border border-brand-border border-l-2 bg-white p-3 shadow-sm text-sm transition-all flex items-start gap-1.5 cursor-pointer",
          priorityBorderClass(priority),
          "hover:border-brand-dark hover:shadow",
          isDragging && "opacity-40",
        )}
      >
        {canEdit ? (
          <button
            type="button"
            aria-label="Drag card"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 shrink-0 rounded-sm p-1 -ml-0.5 text-brand-muted hover:bg-brand-border cursor-grab active:cursor-grabbing touch-none"
          >
            <GripVertical className="h-5 w-5 sm:h-4 sm:w-4" />
          </button>
        ) : (
          <span className="mt-0.5 shrink-0 text-brand-muted/40">
            <GripVertical className="h-4 w-4" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          {cardLabels.length > 0 && (
            <div className="mb-1 flex flex-wrap gap-1">
              {cardLabels.map((l) => (
                <span
                  key={l.id}
                  className={cn(
                    "inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                    labelChipClass(l.color),
                  )}
                >
                  {l.name}
                </span>
              ))}
            </div>
          )}
          <div className="font-semibold text-brand-dark">{card.title}</div>
          {card.description && (
            <div className="mt-1 text-xs text-brand-muted line-clamp-2">
              {card.description}
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            {card.dueDate && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-[10px] font-medium",
                  dueBadgeClass(card.dueDate),
                )}
              >
                <CalendarDays className="h-3 w-3" />
                {formatDueShort(card.dueDate)}
              </div>
            )}
            {card.commentCount > 0 && (
              <div className="inline-flex items-center gap-1 text-[11px] text-brand-muted">
                <MessageSquare className="h-3 w-3" />
                {card.commentCount}
              </div>
            )}
          </div>
        </div>
        {canEdit && (
          <div className="ml-1 flex shrink-0 items-center gap-1 sm:opacity-0 transition-opacity sm:group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              aria-label="Edit"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="rounded-sm p-1.5 text-brand-muted hover:bg-brand-border hover:text-brand-dark"
            >
              <Pencil className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
            <button
              type="button"
              aria-label="Delete"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                setConfirmOpen(true);
              }}
              className="rounded-sm p-1.5 text-brand-muted hover:bg-brand-red/10 hover:text-brand-red"
            >
              <Trash2 className="h-5 w-5 sm:h-4 sm:w-4" />
            </button>
          </div>
        )}
      </div>
      {editOpen && (
        <CardDialog
          card={card}
          boardLabels={boardLabels}
          boardMembers={boardMembers}
          canEdit={canEdit}
          isOwner={isOwner}
          currentUserId={currentUserId}
          onClose={() => setEditOpen(false)}
          onLocalChange={onLocalChange}
          initialBoard={initialBoard}
          onCommentCountChange={updateCommentCount}
        />
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Delete card"
        description="Are you sure you want to delete this card? This action cannot be undone."
        pending={pending}
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

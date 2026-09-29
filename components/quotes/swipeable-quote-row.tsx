"use client";

import { useRef, useState } from "react";

interface SwipeableQuoteRowProps {
  /** The row's tappable content (the `Link` to the quote detail page). */
  children: React.ReactNode;
  /** The two quick actions, revealed on the right edge when swiped open. */
  actions: React.ReactNode;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  /** The row's own translateX when the gesture started (0 or -width). */
  originX: number;
  /** Once the gesture is recognised as a horizontal swipe, vertical scroll is ignored for it. */
  swiping: boolean;
}

/**
 * A quote row that reveals `actions` on the right edge when swiped left,
 * without conflicting with the tap-to-open-detail gesture on the rest of
 * the row (`specs/010-quote-actions/spec.md`). Below `lg` only — the
 * desktop table shows the same actions in their own column instead.
 *
 * The actions panel sits behind the content and is only ever reached by
 * swiping it into view: `inert` while closed keeps it out of the tab order
 * so a covered, invisible button never takes keyboard focus.
 *
 * The live drag position is tracked in a ref, not state, so the decision
 * made on pointerup always sees the true current position — reading state
 * instead would risk a stale value if the browser fires several pointer
 * events before React re-renders between them.
 */
export function SwipeableQuoteRow({
  children,
  actions,
}: SwipeableQuoteRowProps) {
  const actionsRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const position = useRef(0);
  const [open, setOpen] = useState(false);
  const [visualX, setVisualX] = useState(0);
  const [dragging, setDragging] = useState(false);

  function moveTo(x: number) {
    position.current = x;
    setVisualX(x);
  }

  function handlePointerDown(event: React.PointerEvent) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: position.current,
      swiping: false,
    };
  }

  function handlePointerMove(event: React.PointerEvent) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - state.startX;
    const deltaY = event.clientY - state.startY;

    if (!state.swiping) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > 8) {
        drag.current = null;
        return;
      }
      if (Math.abs(deltaX) < 8) return;
      state.swiping = true;
      setDragging(true);
    }

    const width = actionsRef.current?.offsetWidth ?? 0;
    moveTo(Math.min(0, Math.max(-width, state.originX + deltaX)));
  }

  function handlePointerUp(event: React.PointerEvent) {
    const state = drag.current;
    if (!state || state.pointerId !== event.pointerId) return;
    if (state.swiping) {
      const width = actionsRef.current?.offsetWidth ?? 0;
      const nextOpen = position.current < -width / 2;
      moveTo(nextOpen ? -width : 0);
      setOpen(nextOpen);
    }
    drag.current = null;
    setDragging(false);
  }

  function handleContentClick(event: React.MouseEvent) {
    if (open) {
      event.preventDefault();
      moveTo(0);
      setOpen(false);
    }
  }

  return (
    <li className="relative overflow-hidden">
      <div
        ref={actionsRef}
        inert={!open}
        className="absolute inset-y-0 right-0 flex items-center gap-1 bg-background pr-1 pl-3"
      >
        {actions}
      </div>
      <div
        className={
          dragging
            ? "relative bg-background"
            : "relative bg-background motion-safe:transition-transform motion-safe:duration-200"
        }
        style={{ transform: `translateX(${visualX}px)`, touchAction: "pan-y" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleContentClick}
      >
        {children}
      </div>
    </li>
  );
}

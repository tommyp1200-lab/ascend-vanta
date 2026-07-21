"use client";

import { useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import type { HeroPointerState, HeroPointerVector } from "./heroTypes";

function createPointerVector(): HeroPointerVector {
  return {
    isVector2: true,
    x: 0,
    y: 0,
    set(x, y) {
      this.x = x;
      this.y = y;
      return this;
    },
    lerp(target, alpha) {
      this.x += (target.x - this.x) * alpha;
      this.y += (target.y - this.y) * alpha;
      return this;
    },
  };
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}

export function useHeroPointer() {
  const pointer = useRef<HeroPointerState>({
    target: createPointerVector(),
    current: createPointerVector(),
    active: 0,
  });

  const handlers = useMemo(
    () => ({
      onPointerMove(event: ReactPointerEvent<HTMLElement>) {
        if (event.pointerType === "touch") return;
        // The event target is the complete scroll narrative (several viewports
        // tall), while the interactive stage is pinned to the visible viewport.
        // Normalize against the viewport so top/bottom cursor travel truly
        // crosses zero instead of remaining in the upper hemisphere.
        const viewportWidth = Math.max(document.documentElement.clientWidth, 1);
        const viewportHeight = Math.max(document.documentElement.clientHeight, 1);
        const uvX = clamp(event.clientX / viewportWidth, 0, 1);
        const uvY = 1 - clamp(event.clientY / viewportHeight, 0, 1);
        const nextX = uvX * 2 - 1;
        const nextY = uvY * 2 - 1;
        pointer.current.target.set(nextX, nextY);
        pointer.current.active = 1;
      },
      onPointerLeave() {
        pointer.current.target.set(0, 0);
        pointer.current.active = 0;
      },
    }),
    [],
  );

  return { pointer, handlers };
}

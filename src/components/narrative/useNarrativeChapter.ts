"use client";

import { useEffect } from "react";
import type { RefObject } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNarrativeCoordinator } from "./NarrativeCoordinator";

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger);

function elementRange(element: HTMLElement) {
  const bounds = element.getBoundingClientRect();
  const start = bounds.top + window.scrollY;
  return { start, end: start + Math.max(1, bounds.height) };
}

export function useNarrativeChapter(
  ref: RefObject<HTMLElement | null>,
  id: string,
  order: number,
) {
  const {
    reducedMotion,
    registerChapter,
    requestRefresh,
    updateNarrativeState,
  } = useNarrativeCoordinator();

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    element.dataset.lifecycle = "sleeping";
    let trigger: ScrollTrigger | null = null;
    const unregister = registerChapter({
      id,
      order,
      getRange: () =>
        trigger ? { start: trigger.start, end: trigger.end } : elementRange(element),
    });

    const lifecycleObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          element.dataset.lifecycle = entry.intersectionRatio > 0 ? "active" : "near";
          if (reducedMotion && entry.intersectionRatio > 0) {
            updateNarrativeState({ chapterId: id, localProgress: 0 });
          }
        } else {
          element.dataset.lifecycle = "sleeping";
        }
      },
      { rootMargin: "75% 0px", threshold: [0, 0.01] },
    );
    lifecycleObserver.observe(element);

    trigger = reducedMotion
      ? null
      : ScrollTrigger.create({
          id: `narrative-${id}`,
          trigger: element,
          start: "top 70%",
          end: "bottom 30%",
          invalidateOnRefresh: true,
          onEnter: () => {
            element.dataset.lifecycle = "active";
            updateNarrativeState({ chapterId: id, localProgress: 0 });
          },
          onEnterBack: () => {
            element.dataset.lifecycle = "active";
            updateNarrativeState({ chapterId: id, localProgress: 1 });
          },
          onUpdate: (self) => {
            if (!self.isActive) return;
            updateNarrativeState({ chapterId: id, localProgress: self.progress });
          },
          onLeave: () => {
            element.dataset.lifecycle = "near";
            updateNarrativeState({ chapterId: id, localProgress: 1 });
          },
          onLeaveBack: () => {
            element.dataset.lifecycle = "near";
            updateNarrativeState({ chapterId: id, localProgress: 0 });
          },
        });

    requestRefresh(`${id}-ready`);
    return () => {
      trigger?.kill();
      lifecycleObserver.disconnect();
      unregister();
    };
  }, [id, order, reducedMotion, ref, registerChapter, requestRefresh, updateNarrativeState]);
}

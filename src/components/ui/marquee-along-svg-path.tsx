"use client";

import React, {
  type RefObject,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
} from "react";
import {
  motion,
  type MotionValue,
  type SpringOptions,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";

import { cn } from "@/lib/utils";

const wrap = (min: number, max: number, value: number) => {
  const range = max - min;
  return ((((value - min) % range) + range) % range) + min;
};

type PreserveAspectRatioAlign =
  | "none"
  | "xMinYMin"
  | "xMidYMin"
  | "xMaxYMin"
  | "xMinYMid"
  | "xMidYMid"
  | "xMaxYMid"
  | "xMinYMax"
  | "xMidYMax"
  | "xMaxYMax";

type PreserveAspectRatioMeetOrSlice = "meet" | "slice";

type PreserveAspectRatio =
  | PreserveAspectRatioAlign
  | `${Exclude<PreserveAspectRatioAlign, "none">} ${PreserveAspectRatioMeetOrSlice}`;

interface CSSVariableInterpolation {
  property: string;
  from: number | string;
  to: number | string;
}

interface MarqueeAlongSvgPathProps {
  children: ReactNode;
  className?: string;
  path: string;
  pathId?: string;
  preserveAspectRatio?: PreserveAspectRatio;
  showPath?: boolean;
  width?: string | number;
  height?: string | number;
  viewBox?: string;
  baseVelocity?: number;
  direction?: "normal" | "reverse";
  easing?: (value: number) => number;
  slowdownOnHover?: boolean;
  slowDownFactor?: number;
  slowDownSpringConfig?: SpringOptions;
  useScrollVelocity?: boolean;
  scrollAwareDirection?: boolean;
  scrollSpringConfig?: SpringOptions;
  scrollContainer?: RefObject<HTMLElement | null> | HTMLElement | null;
  repeat?: number;
  draggable?: boolean;
  dragSensitivity?: number;
  dragVelocityDecay?: number;
  dragAwareDirection?: boolean;
  grabCursor?: boolean;
  enableRollingZIndex?: boolean;
  zIndexBase?: number;
  zIndexRange?: number;
  cssVariableInterpolation?: CSSVariableInterpolation[];
  responsive?: boolean;
}

interface MarqueePathItemProps {
  baseOffset: MotionValue<number>;
  calculateZIndex: (offsetDistance: number) => number | undefined;
  child: ReactNode;
  cssVariableInterpolation: CSSVariableInterpolation[];
  draggable: boolean;
  easing?: (value: number) => number;
  enableRollingZIndex: boolean;
  grabCursor: boolean;
  index: number;
  itemCount: number;
  itemKey: string;
  path: string;
  repeated: boolean;
  setHovered: (hovered: boolean) => void;
}

const interpolateCssValue = (
  from: number | string,
  to: number | string,
  progress: number,
) => {
  if (typeof from === "number" && typeof to === "number") {
    return from + (to - from) * progress;
  }

  const fromMatch = String(from).match(/^(-?[\d.]+)(.*)$/);
  const toMatch = String(to).match(/^(-?[\d.]+)(.*)$/);
  if (fromMatch && toMatch && fromMatch[2] === toMatch[2]) {
    const value =
      Number(fromMatch[1]) +
      (Number(toMatch[1]) - Number(fromMatch[1])) * progress;
    return `${value}${fromMatch[2]}`;
  }

  return progress < 0.5 ? from : to;
};

function MarqueePathItem({
  baseOffset,
  calculateZIndex,
  child,
  cssVariableInterpolation,
  draggable,
  easing,
  enableRollingZIndex,
  grabCursor,
  index,
  itemCount,
  itemKey,
  path,
  repeated,
  setHovered,
}: MarqueePathItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const itemOffset = useTransform(baseOffset, (value) => {
    const position = (index * 100) / itemCount;
    const wrappedValue = wrap(0, 100, value + position);
    return `${easing ? easing(wrappedValue / 100) * 100 : wrappedValue}%`;
  });
  const zIndex = useTransform(itemOffset, (value) =>
    calculateZIndex(Number.parseFloat(value)),
  );

  useMotionValueEvent(itemOffset, "change", (value) => {
    if (!itemRef.current || cssVariableInterpolation.length === 0) return;
    const progress = Number.parseFloat(value) / 100;
    cssVariableInterpolation.forEach(({ property, from, to }) => {
      itemRef.current?.style.setProperty(
        property,
        String(interpolateCssValue(from, to, progress)),
      );
    });
  });

  return (
    <motion.div
      key={itemKey}
      ref={itemRef}
      className={cn(
        "absolute left-0 top-0",
        draggable && grabCursor && "cursor-grab",
      )}
      style={{
        offsetPath: `path('${path}')`,
        offsetDistance: itemOffset,
        zIndex: enableRollingZIndex ? zIndex : undefined,
        willChange: "offset-distance",
        backfaceVisibility: "hidden",
      }}
      aria-hidden={repeated}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {child}
    </motion.div>
  );
}

export default function MarqueeAlongSvgPath({
  children,
  className,
  path,
  pathId,
  preserveAspectRatio = "xMidYMid meet",
  showPath = false,
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",
  baseVelocity = 5,
  direction = "normal",
  easing,
  slowdownOnHover = false,
  slowDownFactor = 0.3,
  slowDownSpringConfig = { damping: 50, stiffness: 400 },
  useScrollVelocity = false,
  scrollAwareDirection = false,
  scrollSpringConfig = { damping: 50, stiffness: 400 },
  scrollContainer,
  repeat = 3,
  draggable = false,
  dragSensitivity = 0.2,
  dragVelocityDecay = 0.96,
  dragAwareDirection = false,
  grabCursor = false,
  enableRollingZIndex = true,
  zIndexBase = 1,
  zIndexRange = 10,
  cssVariableInterpolation = [],
  responsive = false,
}: MarqueeAlongSvgPathProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const marqueeContainerRef = useRef<HTMLDivElement>(null);
  const baseOffset = useMotionValue(0);
  const generatedId = useId().replace(/:/g, "");
  const id = pathId ?? `marquee-path-${generatedId}`;

  const normalizedScrollContainer = useMemo(() => {
    if (!scrollContainer) return undefined;
    if ("current" in scrollContainer) return scrollContainer;
    return { current: scrollContainer };
  }, [scrollContainer]);

  const { scrollY } = useScroll(
    normalizedScrollContainer
      ? { container: normalizedScrollContainer as RefObject<HTMLElement | null> }
      : {},
  );
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, scrollSpringConfig);
  const velocityFactor = useTransform(smoothVelocity, [-1600, 0, 1600], [-3, 0, 3], {
    clamp: true,
  });

  const isHovered = useRef(false);
  const isDragging = useRef(false);
  const isInView = useRef(false);
  const dragVelocity = useRef(0);
  const directionFactor = useRef(direction === "normal" ? 1 : -1);
  const hoverFactorValue = useMotionValue(1);
  const smoothHoverFactor = useSpring(hoverFactorValue, slowDownSpringConfig);
  const lastPointerPosition = useRef({ x: 0, y: 0 });

  const items = useMemo(() => {
    const childArray = React.Children.toArray(children);
    return childArray.flatMap((child, childIndex) =>
      Array.from({ length: repeat }, (_, repeatIndex) => ({
        child,
        index: repeatIndex * childArray.length + childIndex,
        key: `${childIndex}-${repeatIndex}`,
        repeated: repeatIndex > 0,
      })),
    );
  }, [children, repeat]);

  const calculateZIndex = useCallback(
    (offsetDistance: number) => {
      if (!enableRollingZIndex) return undefined;
      return Math.floor(zIndexBase + (offsetDistance / 100) * zIndexRange);
    },
    [enableRollingZIndex, zIndexBase, zIndexRange],
  );

  useEffect(() => {
    directionFactor.current = direction === "normal" ? 1 : -1;
  }, [direction]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isInView.current = entry.isIntersecting;
      },
      { rootMargin: "25% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!responsive) return;
    const wrapper = containerRef.current;
    const marqueeContainer = marqueeContainerRef.current;
    if (!wrapper || !marqueeContainer) return;

    const [, , viewBoxWidth = 100, viewBoxHeight = 100] = viewBox
      .split(/\s+/)
      .map(Number);

    const updateScale = () => {
      const scale = Math.min(
        wrapper.clientWidth / viewBoxWidth,
        wrapper.clientHeight / viewBoxHeight,
      );
      const scaledWidth = viewBoxWidth * scale;
      const scaledHeight = viewBoxHeight * scale;

      marqueeContainer.style.width = `${viewBoxWidth}px`;
      marqueeContainer.style.height = `${viewBoxHeight}px`;
      marqueeContainer.style.transform = `translate(${(wrapper.clientWidth - scaledWidth) / 2}px, ${(wrapper.clientHeight - scaledHeight) / 2}px) scale(${scale})`;
      marqueeContainer.style.transformOrigin = "top left";
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [responsive, viewBox]);

  useAnimationFrame((_, delta) => {
    if (!isInView.current) return;

    if (isDragging.current && draggable) {
      baseOffset.set(baseOffset.get() + dragVelocity.current);
      dragVelocity.current *= 0.9;
      if (Math.abs(dragVelocity.current) < 0.01) dragVelocity.current = 0;
      return;
    }

    hoverFactorValue.set(
      isHovered.current && slowdownOnHover ? slowDownFactor : 1,
    );

    if (scrollAwareDirection && Math.abs(smoothVelocity.get()) > 2) {
      directionFactor.current = smoothVelocity.get() < 0 ? -1 : 1;
    }

    const velocityBoost = useScrollVelocity ? Math.abs(velocityFactor.get()) : 0;
    const moveBy =
      directionFactor.current *
      baseVelocity *
      (delta / 1000) *
      smoothHoverFactor.get() *
      (1 + velocityBoost);

    if (draggable) {
      dragVelocity.current *= dragVelocityDecay;
      if (dragAwareDirection && Math.abs(dragVelocity.current) > 0.1) {
        directionFactor.current = Math.sign(dragVelocity.current);
      }
    }

    baseOffset.set(baseOffset.get() + moveBy + dragVelocity.current);
  });

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.style.cursor = grabCursor ? "grabbing" : "";
    isDragging.current = true;
    dragVelocity.current = 0;
    lastPointerPosition.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable || !isDragging.current) return;
    const deltaX = event.clientX - lastPointerPosition.current.x;
    const deltaY = event.clientY - lastPointerPosition.current.y;
    const magnitude = Math.hypot(deltaX, deltaY);
    dragVelocity.current = (deltaX >= 0 ? magnitude : -magnitude) * dragSensitivity;
    lastPointerPosition.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggable) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = grabCursor ? "grab" : "";
    isDragging.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: draggable ? "pan-y" : undefined }}
    >
      <div
        ref={marqueeContainerRef}
        className="relative"
        style={{ contain: "layout style" }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={width}
          height={height}
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          className="h-full w-full"
          aria-hidden="true"
        >
          <path
            id={id}
            d={path}
            stroke={showPath ? "currentColor" : "none"}
            fill="none"
          />
        </svg>

        {items.map((item) => (
          <MarqueePathItem
            key={item.key}
            baseOffset={baseOffset}
            calculateZIndex={calculateZIndex}
            child={item.child}
            cssVariableInterpolation={cssVariableInterpolation}
            draggable={draggable}
            easing={easing}
            enableRollingZIndex={enableRollingZIndex}
            grabCursor={grabCursor}
            index={item.index}
            itemCount={items.length}
            itemKey={item.key}
            path={path}
            repeated={item.repeated}
            setHovered={(hovered) => {
              isHovered.current = hovered;
            }}
          />
        ))}
      </div>
    </div>
  );
}

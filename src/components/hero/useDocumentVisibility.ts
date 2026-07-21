"use client";

import { useEffect, useRef, useState } from "react";

export function useDocumentVisibility() {
  const visible = useRef(true);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const update = () => {
      visible.current = !document.hidden;
      setActive(visible.current);
    };

    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return { visible, active };
}

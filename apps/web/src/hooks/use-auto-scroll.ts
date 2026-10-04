import { useEffect, useRef } from "react";

export const useAutoScroll = (dependencies: unknown[]) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, dependencies);

  return containerRef;
};

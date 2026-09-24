import { useEffect, useState } from "react";

export function useElementBounds(element: Element | null) {
  const [bounds, setBounds] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  useEffect(() => {
    function update() {
      if (!element?.isConnected) {
        setBounds(null);
        return;
      }
      const { x, y, width, height } = element.getBoundingClientRect();
      setBounds((previous) =>
        previous &&
        previous.x === x &&
        previous.y === y &&
        previous.width === width &&
        previous.height === height
          ? previous
          : { x, y, width, height },
      );
    }
    const frame = requestAnimationFrame(update);
    const interval = window.setInterval(update, 250);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(interval);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [element]);
  return element ? bounds : null;
}

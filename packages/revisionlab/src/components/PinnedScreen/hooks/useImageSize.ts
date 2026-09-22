import { useEffect, useRef, useState } from "react";

export function useImageSize(ready: boolean) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const image = imageRef.current;
    if (!ready || !image) return;
    const measure = () => {
      const { width, height } = image.getBoundingClientRect();
      setSize((previous) =>
        previous.width === width && previous.height === height
          ? previous
          : { width, height },
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(image);
    return () => observer.disconnect();
  }, [ready]);

  return { imageRef, size };
}
